import { Server as SocketIO, Socket } from "socket.io";
import Chat from "../models/Chat";
import ChatUser from "../models/ChatUser";
import User from "../models/User";
import { logger } from "../utils/logger";

/**
 * Chamadas de voz e vídeo do chat interno (salas estilo Discord).
 *
 * O vídeo vai direto de um navegador para o outro (WebRTC); o servidor só
 * apresenta os participantes e repassa a "negociação" entre eles pelo
 * socket que já existe. Nada de servidor de mídia: por isso a sala tem
 * limite de participantes (cada um manda o vídeo para todos os outros).
 */

export const MAX_PARTICIPANTS = 8;

export type CallParticipant = {
  socketId: string;
  userId: number;
  name: string;
  profileImage: string | null;
  audio: boolean;
  video: boolean;
  screen: boolean;
};

// chatId → (socketId → participante)
const calls = new Map<number, Map<string, CallParticipant>>();

const listOf = (chatId: number): CallParticipant[] =>
  Array.from(calls.get(chatId)?.values() || []);

/** Quem está em chamada, só das conversas informadas. */
export const activeCallsFor = (chatIds: number[]) => {
  const result: Record<number, CallParticipant[]> = {};
  chatIds.forEach(id => {
    const list = listOf(id);
    if (list.length) result[id] = list;
  });
  return result;
};

const isMember = async (chatId: number, userId: number, companyId: number) => {
  const chat = await Chat.findByPk(chatId, { attributes: ["id", "companyId"] });
  if (!chat || chat.companyId !== companyId) return false;
  return !!(await ChatUser.count({ where: { chatId, userId } }));
};

// avisa todos os membros da conversa (para mostrar quem está na sala)
const broadcastParticipants = async (io: SocketIO, chatId: number) => {
  const members = await ChatUser.findAll({
    where: { chatId },
    attributes: ["userId"]
  });
  const chat = await Chat.findByPk(chatId, { attributes: ["companyId"] });
  if (!chat) return;
  io.to(members.map(m => `user-${m.userId}`)).emit(
    `company-${chat.companyId}-chat-call`,
    { chatId, participants: listOf(chatId) }
  );
};

const leave = (io: SocketIO, socket: Socket, chatId: number) => {
  const room = calls.get(chatId);
  if (!room?.has(socket.id)) return;
  room.delete(socket.id);
  if (!room.size) calls.delete(chatId);
  socket.leave(`call-${chatId}`);
  socket.to(`call-${chatId}`).emit("call:peer-left", {
    chatId,
    socketId: socket.id
  });
  broadcastParticipants(io, chatId).catch(() => {});
};

const inSameCall = (chatId: number, a: string, b: string) => {
  const room = calls.get(chatId);
  return !!room?.has(a) && !!room?.has(b);
};

export const registerCallHandlers = (
  io: SocketIO,
  socket: Socket,
  user: User
) => {
  socket.on(
    "call:join",
    async (
      payload: { chatId: number; video?: boolean },
      ack?: (data: unknown) => void
    ) => {
      const chatId = Number(payload?.chatId);
      const reply = (data: unknown) => typeof ack === "function" && ack(data);
      try {
        // SEGURANÇA: só quem participa da conversa entra na chamada dela
        if (!chatId || !(await isMember(chatId, user.id, user.companyId))) {
          reply({ error: "ERR_NO_PERMISSION" });
          return;
        }
        const room = calls.get(chatId) || new Map<string, CallParticipant>();
        if (!room.has(socket.id) && room.size >= MAX_PARTICIPANTS) {
          reply({ error: "ERR_CALL_FULL" });
          return;
        }
        const others = Array.from(room.values());
        room.set(socket.id, {
          socketId: socket.id,
          userId: user.id,
          name: user.name,
          profileImage: user.profileImage || null,
          audio: true,
          video: !!payload?.video,
          screen: false
        });
        calls.set(chatId, room);
        socket.join(`call-${chatId}`);

        socket.to(`call-${chatId}`).emit("call:peer-joined", {
          chatId,
          peer: room.get(socket.id)
        });
        reply({ ok: true, peers: others, self: socket.id });
        broadcastParticipants(io, chatId).catch(() => {});
      } catch (err) {
        logger.warn({ err: err?.message }, "call:join falhou");
        reply({ error: "ERR_CALL" });
      }
    }
  );

  socket.on("call:leave", (payload: { chatId: number }) =>
    leave(io, socket, Number(payload?.chatId))
  );

  // oferta, resposta e candidatos do WebRTC, de um participante para outro
  socket.on(
    "call:signal",
    (payload: { chatId: number; to: string; data: unknown }) => {
      const chatId = Number(payload?.chatId);
      if (!inSameCall(chatId, socket.id, payload?.to)) return;
      io.to(payload.to).emit("call:signal", {
        chatId,
        from: socket.id,
        data: payload.data
      });
    }
  );

  // microfone / câmera / tela ligados ou não
  socket.on(
    "call:state",
    (payload: {
      chatId: number;
      audio?: boolean;
      video?: boolean;
      screen?: boolean;
    }) => {
      const chatId = Number(payload?.chatId);
      const me = calls.get(chatId)?.get(socket.id);
      if (!me) return;
      if (typeof payload.audio === "boolean") me.audio = payload.audio;
      if (typeof payload.video === "boolean") me.video = payload.video;
      if (typeof payload.screen === "boolean") me.screen = payload.screen;
      socket.to(`call-${chatId}`).emit("call:peer-state", {
        chatId,
        peer: me
      });
      broadcastParticipants(io, chatId).catch(() => {});
    }
  );

  // caiu a conexão ou fechou a aba: sai de todas as chamadas
  socket.on("disconnect", () => {
    calls.forEach((room, chatId) => {
      if (room.has(socket.id)) leave(io, socket, chatId);
    });
  });
};
