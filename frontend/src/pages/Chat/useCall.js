import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

/**
 * Chamada de voz/vídeo das salas do chat interno.
 *
 * Cada participante conversa direto com os outros (WebRTC, em malha); o
 * servidor só apresenta quem está na sala e repassa a negociação pelo
 * socket. Por isso não precisa de servidor de vídeo — e a sala tem limite
 * de participantes. A chamada continua enquanto a pessoa navega entre as
 * conversas do chat.
 */
const ICE = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

const getMedia = async () => {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: { width: { ideal: 640 }, height: { ideal: 360 } }
    });
  } catch (err) {
    // sem câmera (ou negou): entra só com o microfone
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }
};

const useCall = () => {
  const socketManager = useContext(SocketContext);
  const companyId = localStorage.getItem("companyId");

  const [chatId, setChatId] = useState(null);
  const [joining, setJoining] = useState(false);
  const [peers, setPeers] = useState([]); // [{ socketId, userId, name, profileImage, audio, video, screen, stream }]
  const [local, setLocal] = useState({
    stream: null,
    audio: true,
    video: false,
    screen: false,
    hasCamera: false
  });
  // quem está em cada sala (para mostrar na lateral, mesmo sem estar nela)
  const [rooms, setRooms] = useState({});

  const socketRef = useRef(null);
  const pcs = useRef(new Map()); // socketId → RTCPeerConnection
  const pending = useRef(new Map()); // socketId → candidatos que chegaram cedo
  const info = useRef(new Map()); // socketId → dados do participante
  const streamRef = useRef(null);
  const cameraTrack = useRef(null);
  const screenTrack = useRef(null);
  const chatRef = useRef(null);
  const videoOn = useRef(false);

  const publish = useCallback(() => {
    setPeers(Array.from(info.current.values()).map(p => ({ ...p })));
  }, []);

  const signal = (to, data) =>
    socketRef.current?.emit("call:signal", {
      chatId: chatRef.current,
      to,
      data
    });

  const closePeer = socketId => {
    pcs.current.get(socketId)?.close();
    pcs.current.delete(socketId);
    pending.current.delete(socketId);
    info.current.delete(socketId);
  };

  const createPeer = useCallback(
    socketId => {
      const pc = new RTCPeerConnection(ICE);
      pcs.current.set(socketId, pc);
      const stream = streamRef.current;
      stream?.getTracks().forEach(track => pc.addTrack(track, stream));
      if (screenTrack.current) {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack.current);
      }
      pc.onicecandidate = e => {
        if (e.candidate) signal(socketId, { candidate: e.candidate });
      };
      pc.ontrack = e => {
        const peer = info.current.get(socketId) || { socketId };
        peer.stream = e.streams[0];
        info.current.set(socketId, peer);
        publish();
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") pc.restartIce?.();
      };
      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [publish]
  );

  const offerTo = async socketId => {
    const pc = pcs.current.get(socketId) || createPeer(socketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signal(socketId, { sdp: pc.localDescription });
  };

  const flush = async socketId => {
    const pc = pcs.current.get(socketId);
    const list = pending.current.get(socketId) || [];
    pending.current.delete(socketId);
    await Promise.all(list.map(c => pc.addIceCandidate(c).catch(() => {})));
  };

  // eventos do socket (uma vez, enquanto a página do chat existir)
  useEffect(() => {
    const socket = socketManager.GetSocket(companyId);
    socketRef.current = socket;

    const onJoined = ({ chatId: id, peer }) => {
      if (id !== chatRef.current) return;
      // quem chega é que liga para os outros: aqui só anota
      info.current.set(peer.socketId, { ...peer });
      publish();
    };
    const onLeft = ({ chatId: id, socketId }) => {
      if (id !== chatRef.current) return;
      closePeer(socketId);
      publish();
    };
    const onState = ({ chatId: id, peer }) => {
      if (id !== chatRef.current) return;
      const current = info.current.get(peer.socketId) || {};
      info.current.set(peer.socketId, { ...current, ...peer });
      publish();
    };
    const onSignal = async ({ chatId: id, from, data }) => {
      if (id !== chatRef.current) return;
      try {
        if (data.sdp) {
          const pc = pcs.current.get(from) || createPeer(from);
          await pc.setRemoteDescription(data.sdp);
          await flush(from);
          if (data.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            signal(from, { sdp: pc.localDescription });
          }
        } else if (data.candidate) {
          const pc = pcs.current.get(from);
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(data.candidate).catch(() => {});
          } else {
            const list = pending.current.get(from) || [];
            list.push(data.candidate);
            pending.current.set(from, list);
          }
        }
      } catch (err) {
        // uma negociação que falhou não derruba a chamada inteira
      }
    };
    const onRooms = ({ chatId: id, participants }) =>
      setRooms(prev => ({ ...prev, [id]: participants }));

    socket.on("call:peer-joined", onJoined);
    socket.on("call:peer-left", onLeft);
    socket.on("call:peer-state", onState);
    socket.on("call:signal", onSignal);
    socket.on(`company-${companyId}-chat-call`, onRooms);

    api
      .get("/chats/calls")
      .then(({ data }) => setRooms(data || {}))
      .catch(() => {});

    return () => {
      socket.off?.("call:peer-joined", onJoined);
      socket.off?.("call:peer-left", onLeft);
      socket.off?.("call:peer-state", onState);
      socket.off?.("call:signal", onSignal);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketManager]);

  const enter = useCallback(
    id =>
      new Promise(resolve => {
        socketRef.current.emit(
          "call:join",
          { chatId: id, video: videoOn.current },
          async result => {
            if (result?.error) {
              resolve(result.error);
              return;
            }
            (result.peers || []).forEach(p =>
              info.current.set(p.socketId, { ...p })
            );
            publish();
            await Promise.all(
              (result.peers || []).map(p => offerTo(p.socketId))
            );
            resolve(null);
          }
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [publish]
  );

  const stopAll = () => {
    pcs.current.forEach(pc => pc.close());
    pcs.current.clear();
    pending.current.clear();
    info.current.clear();
    streamRef.current?.getTracks().forEach(t => t.stop());
    screenTrack.current?.stop();
    streamRef.current = null;
    cameraTrack.current = null;
    screenTrack.current = null;
  };

  const leave = useCallback(() => {
    if (chatRef.current) {
      socketRef.current?.emit("call:leave", { chatId: chatRef.current });
    }
    stopAll();
    chatRef.current = null;
    setChatId(null);
    setPeers([]);
    setLocal({
      stream: null,
      audio: true,
      video: false,
      screen: false,
      hasCamera: false
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const join = useCallback(
    async (id, { video = false } = {}) => {
      if (chatRef.current === id) return;
      if (chatRef.current) leave();
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Este navegador não permite chamadas de voz e vídeo.");
        return;
      }
      setJoining(true);
      try {
        const stream = await getMedia();
        streamRef.current = stream;
        cameraTrack.current = stream.getVideoTracks()[0] || null;
        // entrou por voz: câmera começa desligada (dá para ligar depois)
        if (cameraTrack.current) cameraTrack.current.enabled = !!video;
        videoOn.current = !!video && !!cameraTrack.current;
        chatRef.current = id;
        setChatId(id);
        setLocal({
          stream,
          audio: true,
          video: videoOn.current,
          screen: false,
          hasCamera: !!cameraTrack.current
        });
        const error = await enter(id);
        if (error) {
          toast.error(
            error === "ERR_CALL_FULL"
              ? "A sala está cheia (máximo de 8 pessoas)."
              : "Não foi possível entrar na chamada."
          );
          leave();
        }
      } catch (err) {
        toast.error("Permita o microfone no navegador para entrar na chamada.");
        leave();
      }
      setJoining(false);
    },
    [enter, leave]
  );

  const sendState = changes =>
    socketRef.current?.emit("call:state", {
      chatId: chatRef.current,
      ...changes
    });

  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setLocal(prev => ({ ...prev, audio: track.enabled }));
    sendState({ audio: track.enabled });
  };

  const toggleVideo = () => {
    const track = cameraTrack.current;
    if (!track) {
      toast.info("Nenhuma câmera disponível neste aparelho.");
      return;
    }
    track.enabled = !track.enabled;
    videoOn.current = track.enabled;
    setLocal(prev => ({ ...prev, video: track.enabled }));
    sendState({ video: track.enabled });
  };

  // compartilhar a tela troca o vídeo da câmera pelo da tela (sem renegociar)
  const toggleScreen = async () => {
    if (screenTrack.current) {
      screenTrack.current.stop();
      screenTrack.current = null;
      pcs.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        sender?.replaceTrack(cameraTrack.current);
      });
      setLocal(prev => ({ ...prev, screen: false }));
      sendState({ screen: false });
      return;
    }
    if (!cameraTrack.current) {
      toast.info("Para compartilhar a tela, entre com uma câmera disponível.");
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      const track = display.getVideoTracks()[0];
      screenTrack.current = track;
      track.onended = () => {
        if (screenTrack.current === track) toggleScreen();
      };
      pcs.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        sender?.replaceTrack(track);
      });
      setLocal(prev => ({ ...prev, screen: true }));
      sendState({ screen: true });
    } catch (err) {
      // cancelou a escolha da tela
    }
  };

  // a conexão caiu e voltou: entra de novo na mesma sala
  useEffect(() => {
    const unsubscribe = socketManager.onEveryReady?.(() => {
      const id = chatRef.current;
      if (!id || !streamRef.current) return;
      pcs.current.forEach(pc => pc.close());
      pcs.current.clear();
      pending.current.clear();
      info.current.clear();
      publish();
      enter(id);
    });
    return () => unsubscribe?.();
  }, [socketManager, enter, publish]);

  // saiu do chat (fechou a página): sai da chamada
  useEffect(() => () => leave(), [leave]);

  // em chamada, "puxar para atualizar" fica desligado (remontar derrubaria)
  useEffect(() => {
    const root = document.documentElement;
    if (chatId) root.dataset.inCall = "1";
    else delete root.dataset.inCall;
    return () => {
      delete root.dataset.inCall;
    };
  }, [chatId]);

  return {
    chatId,
    joining,
    peers,
    local,
    rooms,
    join,
    leave,
    toggleAudio,
    toggleVideo,
    toggleScreen
  };
};

export default useCall;
