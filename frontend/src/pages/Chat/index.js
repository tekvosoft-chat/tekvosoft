import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useHistory, useParams } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import ForumRoundedIcon from "@material-ui/icons/ForumRounded";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import ExploreRoundedIcon from "@material-ui/icons/ExploreRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import CallRoundedIcon from "@material-ui/icons/CallRounded";
import VideocamRoundedIcon from "@material-ui/icons/VideocamRounded";
import PeopleAltRoundedIcon from "@material-ui/icons/PeopleAltRounded";
import PersonRoundedIcon from "@material-ui/icons/PersonRounded";
import ArrowBackIosRoundedIcon from "@material-ui/icons/ArrowBackIosRounded";
import VolumeUpRoundedIcon from "@material-ui/icons/VolumeUpRounded";
import MicOffRoundedIcon from "@material-ui/icons/MicOffRounded";
import CallEndRoundedIcon from "@material-ui/icons/CallEndRounded";
import SettingsRoundedIcon from "@material-ui/icons/SettingsRounded";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import ConfirmationModal from "../../components/ConfirmationModal";
import UserAvatar from "../../components/ui/UserAvatar";
import ChatMessages from "./ChatMessages";
import ChatSearch from "./ChatSearch";
import ChatDetails from "./ChatDetails";
import GroupDialog from "./GroupDialog";
import CallStage from "./CallStage";
import useCall from "./useCall";
import {
  GroupIcon,
  OnlineDot,
  isDirect,
  otherUserOf,
  titleOf,
  unreadOf
} from "./chatShared";

/**
 * Chat interno no desenho do Discord.
 *
 * À esquerda, o trilho de bolinhas: o início (conversas avulsas) e cada
 * sala (grupo) em que a pessoa está. Ao lado, a lista — conversas avulsas
 * no início; na sala, o canal de texto e a sala de voz com quem está nela.
 * No centro a conversa (com a chamada por cima quando entra nela) e à
 * direita os detalhes: perfil da pessoa ou membros da sala.
 *
 * No celular vira telas: trilho + lista primeiro; tocar abre a conversa em
 * tela cheia; os detalhes sobem de lado.
 */
const HOME = "home";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      flex: 1,
      minHeight: 0,
      height: "100%",
      display: "flex",
      overflow: "hidden",
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: { borderRadius: 0, border: "none" }
    },

    // ── trilho ──
    rail: {
      flex: "none",
      width: 72,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      padding: "12px 0",
      overflowY: "auto",
      backgroundColor: t.canvas,
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      [theme.breakpoints.down("xs")]: { width: 64 }
    },
    railItem: {
      position: "relative",
      flex: "none",
      display: "flex",
      justifyContent: "center",
      width: "100%"
    },
    pill: {
      position: "absolute",
      left: 0,
      top: "50%",
      width: 4,
      height: 0,
      borderRadius: "0 4px 4px 0",
      backgroundColor: theme.palette.text.primary,
      transform: "translateY(-50%)",
      transition: "height .2s ease"
    },
    pillUnread: { height: 8 },
    pillOn: { height: 40 },
    railBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: "hidden",
      transition: "border-radius .2s ease, background-color .2s ease",
      "&:hover, &$railBtnOn": { borderRadius: 16 },
      "&:hover $pill": { height: 20 }
    },
    railBtnOn: {},
    home: {
      color: theme.palette.text.primary,
      backgroundColor: t.surface,
      "& svg": { fontSize: 26 },
      "&:hover, &$railBtnOn": {
        color: t.brand.contrastText,
        backgroundColor: t.brand.main
      }
    },
    tool: {
      color: "#23A55A",
      backgroundColor: t.surface,
      "&:hover": { color: "#fff", backgroundColor: "#23A55A" }
    },
    sep: {
      flex: "none",
      width: 32,
      height: 2,
      borderRadius: 1,
      backgroundColor: t.border
    },

    // ── lista ──
    side: {
      flex: "none",
      width: 250,
      display: "flex",
      flexDirection: "column",
      backgroundColor: t.surfaceSunken,
      borderRight: `1px solid ${t.border}`,
      [theme.breakpoints.down("xs")]: {
        flex: 1,
        width: "auto",
        borderRight: "none"
      }
    },
    sideHead: {
      flex: "none",
      height: 52,
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "0 10px",
      borderBottom: `1px solid ${t.border}`,
      boxShadow: "0 1px 2px rgba(0,0,0,.12)"
    },
    findBtn: {
      flex: 1,
      height: 30,
      justifyContent: "flex-start",
      padding: "0 10px",
      borderRadius: 6,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      backgroundColor: t.surface
    },
    groupName: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.9688rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      paddingLeft: 6
    },
    sideBody: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: "8px 8px 12px",
      ...theme.scrollbarStyles
    },
    sideLabel: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 8px 6px",
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary,
      "& button": { padding: 2, color: theme.palette.text.secondary }
    },
    dm: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      padding: "6px 8px",
      marginBottom: 2,
      borderRadius: 6,
      justifyContent: "flex-start",
      textAlign: "left",
      color: theme.palette.text.secondary,
      "&:hover": {
        backgroundColor: t.surfaceHover,
        color: theme.palette.text.primary
      }
    },
    dmOn: {
      backgroundColor: `${t.surfaceHover} !important`,
      color: `${theme.palette.text.primary} !important`
    },
    dmUnread: {
      color: theme.palette.text.primary,
      "& $dmName": { fontWeight: 700 }
    },
    avatarWrap: { position: "relative", display: "inline-flex", flex: "none" },
    dmText: { flex: 1, minWidth: 0 },
    dmName: {
      display: "block",
      fontSize: "0.9375rem",
      fontWeight: 500,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    dmSub: {
      display: "block",
      fontSize: "0.75rem",
      opacity: 0.8,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    count: {
      flex: "none",
      minWidth: 18,
      height: 18,
      padding: "0 5px",
      borderRadius: 9,
      fontSize: "0.6875rem",
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      backgroundColor: "#F23F43"
    },
    channel: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
      padding: "7px 8px",
      marginBottom: 2,
      borderRadius: 6,
      justifyContent: "flex-start",
      fontSize: "0.9375rem",
      fontWeight: 500,
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 20 },
      "&:hover": {
        backgroundColor: t.surfaceHover,
        color: theme.palette.text.primary
      }
    },
    hash: {
      fontSize: "1.25rem",
      fontWeight: 400,
      width: 20,
      textAlign: "center"
    },
    voiceUser: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "3px 8px 3px 36px",
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 14, color: "#F23F43", marginLeft: "auto" }
    },
    about: {
      margin: "4px 8px 0",
      fontSize: "0.75rem",
      color: theme.palette.text.secondary,
      whiteSpace: "pre-wrap"
    },
    me: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      backgroundColor: t.canvas
    },
    meName: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    meSub: { fontSize: "0.6875rem", color: theme.palette.text.secondary },
    inCall: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderTop: `1px solid ${t.border}`,
      backgroundColor: t.canvas
    },
    inCallText: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: "#23A55A",
      "& span": {
        display: "block",
        fontWeight: 400,
        color: theme.palette.text.secondary,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    },

    // ── centro ──
    main: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      backgroundColor: t.surface
    },
    mainHead: {
      flex: "none",
      height: 52,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 8px 0 14px",
      borderBottom: `1px solid ${t.border}`,
      boxShadow: "0 1px 2px rgba(0,0,0,.12)",
      [theme.breakpoints.down("xs")]: { padding: "0 4px" }
    },
    mainTitle: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: "0.9688rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      "& > span": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    },
    headDesc: {
      marginLeft: 6,
      paddingLeft: 10,
      borderLeft: `1px solid ${t.border}`,
      fontSize: "0.8125rem",
      fontWeight: 400,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("sm")]: { display: "none" }
    },
    headBtn: { color: theme.palette.text.secondary },
    headBtnOn: { color: theme.palette.text.primary },
    empty: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 24,
      textAlign: "center",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 56, opacity: 0.5 }
    },
    emptyBtn: {
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700
    },

    // ── direita ──
    details: {
      flex: "none",
      width: 300,
      borderLeft: `1px solid ${t.border}`,
      [theme.breakpoints.down("md")]: { width: 270 }
    },
    detailsDrawer: { width: "min(360px, 100vw)" }
  };
});

function Chat() {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));
  const history = useHistory();
  const { id: uuid } = useParams();
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const call = useCall();

  const [chats, setChats] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [rail, setRail] = useState(HOME);
  const [messages, setMessages] = useState([]);
  const [pageInfo, setPageInfo] = useState({ hasMore: false });
  const [page, setPage] = useState(1);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [presence, setPresence] = useState({});
  const [showDetails, setShowDetails] = useState(isWide);
  const [search, setSearch] = useState({ open: false, tab: "all" });
  const [groupDialog, setGroupDialog] = useState({ open: false, chat: null });
  const [confirm, setConfirm] = useState(null); // { kind: "leave" | "delete", chat }
  const scrollToBottomRef = useRef(() => {});

  const current = useMemo(
    () => chats.find(c => c.uuid === uuid) || null,
    [chats, uuid]
  );
  const currentRef = useRef(null);
  currentRef.current = current;

  const loadChats = useCallback(async () => {
    try {
      const { data } = await api.get("/chats");
      setChats(data.records || []);
    } catch (err) {
      toastError(err);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadChats();
    // quem está online (pessoas da empresa)
    api
      .get("/chats/directory")
      .then(({ data }) => {
        const map = {};
        (data.users || []).forEach(u => {
          map[u.id] = u.online;
        });
        map[user.id] = true;
        setPresence(map);
      })
      .catch(() => {});
  }, [loadChats, user.id]);

  // a conversa aberta decide o trilho (sala → a bolinha dela; avulsa → início)
  useEffect(() => {
    if (current) setRail(isDirect(current) ? HOME : current.id);
  }, [current]);

  // mensagens da conversa aberta
  const fetchMessages = useCallback(async (chatId, pageNumber) => {
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/chats/${chatId}/messages`, {
        params: { pageNumber }
      });
      if (currentRef.current?.id !== chatId) return;
      setPage(pageNumber + 1);
      setPageInfo(data);
      setMessages(prev =>
        pageNumber === 1 ? data.records : [...data.records, ...prev]
      );
      if (pageNumber === 1) setTimeout(() => scrollToBottomRef.current(), 250);
    } catch (err) {
      toastError(err);
    }
    setLoadingMsgs(false);
  }, []);

  useEffect(() => {
    setMessages([]);
    setPage(1);
    setPageInfo({ hasMore: false });
    if (current?.id) fetchMessages(current.id, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // tempo real: conversas, mensagens e presença
  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const upsert = record =>
      setChats(prev => {
        const exists = prev.some(c => c.id === record.id);
        const next = exists
          ? prev.map(c => (c.id === record.id ? { ...c, ...record } : c))
          : [record, ...prev];
        return next;
      });

    const onChatUser = data => {
      if (data.action === "delete") {
        setChats(prev => prev.filter(c => c.id !== data.record?.id));
        if (currentRef.current?.id === data.record?.id) history.push("/chats");
        return;
      }
      if (data.record) upsert(data.record);
    };
    const onChat = data => {
      if (data.action === "delete") {
        setChats(prev => prev.filter(c => c.id !== +data.id));
        if (currentRef.current?.id === +data.id) history.push("/chats");
        return;
      }
      if (data.chat) {
        // conversa com novidade sobe para o topo
        setChats(prev => [
          { ...(prev.find(c => c.id === data.chat.id) || {}), ...data.chat },
          ...prev.filter(c => c.id !== data.chat.id)
        ]);
      }
      if (
        data.action === "new-message" &&
        data.newMessage?.chatId === currentRef.current?.id
      ) {
        setMessages(prev =>
          prev.some(m => m.id === data.newMessage.id)
            ? prev
            : [...prev, data.newMessage]
        );
        setTimeout(() => scrollToBottomRef.current(), 50);
        // está com a conversa aberta: já lê
        if (data.newMessage.senderId !== user.id) {
          api.post(`/chats/${data.newMessage.chatId}/read`).catch(() => {});
        }
      }
    };
    const onPresence = ({ userId, online }) =>
      setPresence(prev => ({ ...prev, [userId]: online }));

    socket.on(`company-${companyId}-chat-user-${user.id}`, onChatUser);
    socket.on(`company-${companyId}-chat`, onChat);
    socket.on(`company-${companyId}-chat-presence`, onPresence);
    return () => {
      socket.off?.(`company-${companyId}-chat-user-${user.id}`, onChatUser);
      socket.off?.(`company-${companyId}-chat`, onChat);
      socket.off?.(`company-${companyId}-chat-presence`, onPresence);
      socket.disconnect();
    };
  }, [socketManager, user.id, history]);

  const open = chat => {
    if (!chat) return;
    upsertLocal(chat);
    history.push(`/chats/${chat.uuid}`);
  };
  const upsertLocal = chat =>
    setChats(prev =>
      prev.some(c => c.id === chat.id)
        ? prev.map(c => (c.id === chat.id ? { ...c, ...chat } : c))
        : [chat, ...prev]
    );

  const sendMessage = async text => {
    try {
      await api.post(`/chats/${current.id}/messages`, { message: text });
    } catch (err) {
      toastError(err);
    }
  };

  const openUser = async member => {
    try {
      const { data } = await api.post("/chats/direct", { userId: member.id });
      open(data);
    } catch (err) {
      toastError(err);
    }
  };

  const runConfirm = async () => {
    const { kind, chat } = confirm;
    try {
      if (kind === "leave") await api.post(`/chats/${chat.id}/leave`);
      else await api.delete(`/chats/${chat.id}`);
      setChats(prev => prev.filter(c => c.id !== chat.id));
      setRail(HOME);
      history.push("/chats");
      toast.success(kind === "leave" ? "Você saiu da sala" : "Sala excluída");
    } catch (err) {
      toastError(err);
    }
  };

  const directs = chats.filter(isDirect);
  const groups = chats.filter(c => !isDirect(c));
  const railGroup = rail !== HOME ? groups.find(g => g.id === rail) : null;
  const homeUnread = directs.reduce((sum, c) => sum + unreadOf(c, user.id), 0);
  const callChat = call.chatId ? chats.find(c => c.id === call.chatId) : null;
  const inThisCall = !!current && call.chatId === current.id;
  const roomOf = chatId => call.rooms[chatId] || [];

  const showList = !isPhone || !uuid;
  const showMain = !isPhone || !!uuid;

  const joinCall = video => current && call.join(current.id, { video });

  // veio do lembrete da agenda (?call=1): entra direto na ligação da sala
  const autoCallDone = useRef(null);
  useEffect(() => {
    if (!current || autoCallDone.current === current.id) return;
    if (new URLSearchParams(window.location.search).get("call") !== "1") return;
    autoCallDone.current = current.id;
    if (call.chatId !== current.id) call.join(current.id, { video: false });
    history.replace(`/chats/${current.uuid}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // ── trilho ──
  const railEl = (
    <nav className={classes.rail} aria-label="Salas">
      <div className={classes.railItem}>
        <span
          className={`${classes.pill}${rail === HOME ? ` ${classes.pillOn}` : ""}`}
        />
        <Tooltip title="Mensagens diretas" placement="right">
          <ButtonBase
            className={`${classes.railBtn} ${classes.home}${rail === HOME ? ` ${classes.railBtnOn}` : ""}`}
            onClick={() => {
              setRail(HOME);
              if (current && !isDirect(current)) history.push("/chats");
            }}
          >
            <Badge badgeContent={homeUnread} color="error" max={99}>
              <ForumRoundedIcon />
            </Badge>
          </ButtonBase>
        </Tooltip>
      </div>
      <span className={classes.sep} />
      {groups.map(group => {
        const unread = unreadOf(group, user.id);
        const on = rail === group.id;
        return (
          <div key={group.id} className={classes.railItem}>
            <span
              className={`${classes.pill}${on ? ` ${classes.pillOn}` : unread ? ` ${classes.pillUnread}` : ""}`}
            />
            <Tooltip title={group.title} placement="right">
              <ButtonBase
                className={`${classes.railBtn}${on ? ` ${classes.railBtnOn}` : ""}`}
                onClick={() => {
                  setRail(group.id);
                  if (!isPhone) open(group);
                }}
              >
                <Badge
                  badgeContent={unread}
                  color="error"
                  max={99}
                  overlap="circular"
                >
                  <GroupIcon title={group.title} size={48} radius={0} />
                </Badge>
              </ButtonBase>
            </Tooltip>
          </div>
        );
      })}
      <Tooltip title="Criar sala" placement="right">
        <ButtonBase
          className={`${classes.railBtn} ${classes.tool}`}
          onClick={() => setGroupDialog({ open: true, chat: null })}
        >
          <AddRoundedIcon />
        </ButtonBase>
      </Tooltip>
      <Tooltip title="Explorar salas" placement="right">
        <ButtonBase
          className={`${classes.railBtn} ${classes.tool}`}
          onClick={() => setSearch({ open: true, tab: "groups" })}
        >
          <ExploreRoundedIcon />
        </ButtonBase>
      </Tooltip>
    </nav>
  );

  // ── lista (início ou sala) ──
  const dmItem = chat => {
    const other = otherUserOf(chat, user.id);
    const unread = unreadOf(chat, user.id);
    const on = current?.id === chat.id;
    const talking = roomOf(chat.id).length > 0;
    return (
      <ButtonBase
        key={chat.id}
        className={`${classes.dm}${on ? ` ${classes.dmOn}` : ""}${unread ? ` ${classes.dmUnread}` : ""}`}
        onClick={() => open(chat)}
      >
        <span className={classes.avatarWrap}>
          <UserAvatar user={other} size={34} />
          <OnlineDot online={!!presence[other?.id]} />
        </span>
        <span className={classes.dmText}>
          <span className={classes.dmName}>{other?.name || "—"}</span>
          {(talking || chat.lastMessage) && (
            <span className={classes.dmSub}>
              {talking ? "📞 Em chamada" : chat.lastMessage}
            </span>
          )}
        </span>
        {unread > 0 && <span className={classes.count}>{unread}</span>}
      </ButtonBase>
    );
  };

  const meBar = (
    <>
      {callChat && (
        <div className={classes.inCall}>
          <div className={classes.inCallText}>
            Conectado à voz
            <span>{titleOf(callChat, user.id)}</span>
          </div>
          {!inThisCall && (
            <Button size="small" onClick={() => open(callChat)}>
              Abrir
            </Button>
          )}
          <Tooltip title="Sair da chamada">
            <IconButton size="small" onClick={call.leave}>
              <CallEndRoundedIcon style={{ color: "#DA373C" }} />
            </IconButton>
          </Tooltip>
        </div>
      )}
      <div className={classes.me}>
        <span className={classes.avatarWrap}>
          <UserAvatar user={user} size={32} />
          <OnlineDot online />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={classes.meName}>{user.name}</div>
          <div className={classes.meSub}>Disponível</div>
        </div>
      </div>
    </>
  );

  const sideEl = railGroup ? (
    <aside className={classes.side}>
      <div className={classes.sideHead}>
        <span className={classes.groupName}>{railGroup.title}</span>
        {(railGroup.ownerId === user.id || user.profile === "admin") && (
          <Tooltip title="Editar sala">
            <IconButton
              size="small"
              onClick={() => setGroupDialog({ open: true, chat: railGroup })}
            >
              <SettingsRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
      <div className={classes.sideBody}>
        {railGroup.description && (
          <div className={classes.about}>{railGroup.description}</div>
        )}
        <div className={classes.sideLabel}>Canais de texto</div>
        <ButtonBase
          className={`${classes.channel}${current?.id === railGroup.id ? ` ${classes.dmOn}` : ""}`}
          onClick={() => open(railGroup)}
        >
          <span className={classes.hash}>#</span>
          conversa
          {unreadOf(railGroup, user.id) > 0 && (
            <span className={classes.count} style={{ marginLeft: "auto" }}>
              {unreadOf(railGroup, user.id)}
            </span>
          )}
        </ButtonBase>
        <div className={classes.sideLabel}>Canais de voz</div>
        <ButtonBase
          className={classes.channel}
          disabled={call.joining}
          onClick={() => {
            open(railGroup);
            call.join(railGroup.id, { video: false });
          }}
        >
          <VolumeUpRoundedIcon />
          Sala de voz
        </ButtonBase>
        {roomOf(railGroup.id).map(p => (
          <div key={p.socketId} className={classes.voiceUser}>
            <UserAvatar
              user={{ name: p.name, profileImage: p.profileImage }}
              size={22}
            />
            {p.name}
            {!p.audio && <MicOffRoundedIcon />}
          </div>
        ))}
      </div>
      {meBar}
    </aside>
  ) : (
    <aside className={classes.side}>
      <div className={classes.sideHead}>
        <ButtonBase
          className={classes.findBtn}
          onClick={() => setSearch({ open: true, tab: "all" })}
        >
          Encontre ou comece uma conversa
        </ButtonBase>
      </div>
      <div className={classes.sideBody}>
        <div className={classes.sideLabel}>
          Mensagens diretas
          <Tooltip title="Nova mensagem">
            <IconButton
              onClick={() => setSearch({ open: true, tab: "people" })}
            >
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
        {directs.map(dmItem)}
        {loaded && directs.length === 0 && (
          <div className={classes.about} style={{ padding: "4px 8px" }}>
            Nenhuma conversa ainda. Toque em “+” para falar com alguém da
            equipe.
          </div>
        )}
      </div>
      {meBar}
    </aside>
  );

  // ── centro ──
  const direct = current && isDirect(current);
  const otherUser = direct ? otherUserOf(current, user.id) : null;

  const mainEl = (
    <section className={classes.main}>
      {current ? (
        <>
          <div className={classes.mainHead}>
            {isPhone && (
              <IconButton
                className={classes.headBtn}
                onClick={() => history.push("/chats")}
                aria-label="Voltar"
              >
                <ArrowBackIosRoundedIcon fontSize="small" />
              </IconButton>
            )}
            <div className={classes.mainTitle}>
              {direct ? (
                <span className={classes.avatarWrap}>
                  <UserAvatar user={otherUser} size={28} />
                  <OnlineDot online={!!presence[otherUser?.id]} />
                </span>
              ) : (
                <span
                  className={classes.hash}
                  style={{ color: theme.palette.text.secondary }}
                >
                  #
                </span>
              )}
              <span>{titleOf(current, user.id)}</span>
              {!direct && current.description && !isPhone && (
                <span className={classes.headDesc}>{current.description}</span>
              )}
            </div>
            <Tooltip title="Chamada de voz">
              <span>
                <IconButton
                  className={classes.headBtn}
                  disabled={inThisCall || call.joining}
                  onClick={() => joinCall(false)}
                >
                  <CallRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Chamada de vídeo">
              <span>
                <IconButton
                  className={classes.headBtn}
                  disabled={inThisCall || call.joining}
                  onClick={() => joinCall(true)}
                >
                  <VideocamRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={direct ? "Perfil" : "Membros"}>
              <IconButton
                className={`${classes.headBtn}${showDetails ? ` ${classes.headBtnOn}` : ""}`}
                onClick={() => setShowDetails(v => !v)}
              >
                {direct ? <PersonRoundedIcon /> : <PeopleAltRoundedIcon />}
              </IconButton>
            </Tooltip>
          </div>
          {inThisCall && <CallStage call={call} me={user} />}
          <ChatMessages
            key={current.id}
            chat={current}
            messages={messages}
            placeholder={`Conversar em ${direct ? "@" : "#"}${titleOf(current, user.id)}`}
            handleSendMessage={sendMessage}
            handleLoadMore={() =>
              !loadingMsgs && fetchMessages(current.id, page)
            }
            scrollToBottomRef={scrollToBottomRef}
            pageInfo={pageInfo}
          />
        </>
      ) : (
        <div className={classes.empty}>
          <ForumRoundedIcon />
          <div>Escolha uma conversa ou encontre alguém da equipe.</div>
          <Button
            variant="contained"
            color="primary"
            disableElevation
            className={classes.emptyBtn}
            startIcon={<SearchRoundedIcon />}
            onClick={() => setSearch({ open: true, tab: "all" })}
          >
            Encontrar pessoas e salas
          </Button>
        </div>
      )}
    </section>
  );

  const detailsEl = current && (
    <ChatDetails
      chat={current}
      me={user}
      presence={presence}
      onOpenUser={openUser}
      onEdit={() => setGroupDialog({ open: true, chat: current })}
      onLeave={() => setConfirm({ kind: "leave", chat: current })}
      onDelete={() => setConfirm({ kind: "delete", chat: current })}
    />
  );

  return (
    <div
      className={classes.root}
      style={{ "--chat-banner": theme.palette.tkv.brand.main }}
    >
      {showList && railEl}
      {showList && sideEl}
      {showMain && mainEl}
      {current && showDetails && !isPhone && isWide && (
        <aside className={classes.details}>{detailsEl}</aside>
      )}
      {current && (isPhone || !isWide) && (
        <Drawer
          anchor="right"
          open={showDetails}
          onClose={() => setShowDetails(false)}
          classes={{ paper: classes.detailsDrawer }}
        >
          {detailsEl}
        </Drawer>
      )}

      <ChatSearch
        open={search.open}
        initialTab={search.tab}
        onClose={() => setSearch(s => ({ ...s, open: false }))}
        onOpenUser={chat => {
          setSearch(s => ({ ...s, open: false }));
          open(chat);
        }}
        onOpenGroup={async group => {
          setSearch(s => ({ ...s, open: false }));
          const known = chats.find(c => c.id === group.id);
          if (known) open(known);
          else {
            await loadChats();
            history.push(`/chats/${group.uuid}`);
          }
        }}
      />
      <GroupDialog
        open={groupDialog.open}
        chat={groupDialog.chat}
        onClose={() => setGroupDialog({ open: false, chat: null })}
        onSaved={chat => {
          setGroupDialog({ open: false, chat: null });
          open(chat);
        }}
      />
      <ConfirmationModal
        title={
          confirm?.kind === "leave"
            ? `Sair de “${confirm?.chat?.title}”?`
            : `Excluir “${confirm?.chat?.title}”?`
        }
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      >
        {confirm?.kind === "leave"
          ? "Você deixa de ver as mensagens da sala. Se ela for pública, dá para entrar de novo pela busca."
          : "A sala e todas as mensagens dela são apagadas para todos os membros."}
      </ConfirmationModal>
    </div>
  );
}

export default Chat;
