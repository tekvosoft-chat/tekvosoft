import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";

import { toast } from "react-toastify";
import clsx from "clsx";

import {
  Badge,
  IconButton,
  Paper,
  Tooltip,
  makeStyles,
  useMediaQuery,
  useTheme
} from "@material-ui/core";
import { alpha } from "@material-ui/core/styles";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";

import ContactDrawer from "../ContactDrawer";
import AiCopilot, { AI_ACTION_EVENT } from "../AiCopilot";
import MessageInput from "../MessageInputCustom/";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import TicketActionButtons from "../TicketActionButtonsCustom";
import MessagesList from "../MessagesList";
import api from "../../services/api";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { EditMessageProvider } from "../../context/EditingMessage/EditingMessageContext";
import { overlayOpen } from "../../helpers/escapeKey";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TagsContainer } from "../TagsContainer";
import { SocketContext } from "../../context/Socket/SocketContext";
import useSettings from "../../hooks/useSettings";
import { cachedTicket, rememberTicket } from "../../helpers/conversationCache";

const useStyles = makeStyles(theme => ({
  // o papel de parede cobre a conversa E a gaveta de dados do contato: as
  // barras e a gaveta são de vidro fosco e deixam ele aparecer de leve
  root: {
    display: "flex",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: theme.palette.tkv.chat.wallpaper,
    backgroundImage: theme.palette.tkv.chat.wallpaperImage,
    backgroundSize: theme.palette.tkv.chat.wallpaperSize,
    backgroundPosition: "center",
    backgroundBlendMode: theme.palette.tkv.chat.wallpaperBlend,
    "& #messagesList": {
      backgroundColor: "transparent",
      backgroundImage: "none"
    },
    // celular: a conversa entra deslizando da direita, como no WhatsApp
    [theme.breakpoints.down("xs")]: {
      animation: "$slideIn .24s cubic-bezier(.2, .8, .2, 1)"
    }
  },
  "@keyframes slideIn": {
    from: { transform: "translateX(38%)", opacity: 0.4 },
    to: { transform: "translateX(0)", opacity: 1 }
  },

  // faixa de tags: fixa no desktop, recolhível no celular
  tagsBar: {
    flex: "none",
    borderBottom: `1px solid ${theme.palette.tkv.border}`,
    "& .MuiAutocomplete-root .MuiOutlinedInput-root": {
      borderRadius: 0,
      backgroundColor: "transparent",
      "& fieldset": { border: "none" }
    }
  },
  // só existe no celular: na cor da marca, como os outros ícones do topo
  tagsToggle: {
    flex: "none",
    padding: 8,
    color: theme.palette.tkv.brand.text,
    "& .MuiBadge-badge": {
      backgroundColor: theme.palette.tkv.brand.main,
      color: theme.palette.tkv.brand.contrastText
    }
  },

  mainWrapper: {
    position: "relative",
    backgroundColor: "transparent",
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeft: "0",
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },

  // celular: a conversa ocupa a tela de ponta a ponta, sem moldura
  mainWrapperPhone: {
    position: "relative",
    border: "none",
    borderRadius: 0
  },
  // topo e barra de digitar flutuam sobre a conversa, em vidro fosco
  // levemente transparente; as mensagens passam por trás deles
  phoneTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 6,
    "& > .MuiCard-root, & > .MuiPaper-root": {
      backgroundColor: alpha(theme.palette.tkv.surface, 0.72),
      backdropFilter: "saturate(1.6) blur(18px)",
      WebkitBackdropFilter: "saturate(1.6) blur(18px)"
    }
  },
  phoneBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    "& > .MuiPaper-root": {
      backgroundColor: alpha(theme.palette.tkv.chat.bar, 0.72),
      backdropFilter: "saturate(1.6) blur(18px)",
      WebkitBackdropFilter: "saturate(1.6) blur(18px)"
    }
  },

  mainWrapperShift: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginRight: 0
  },
  drawerShade: {
    display: "none",
    [theme.breakpoints.down(1400)]: {
      display: "block",
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backdropFilter: "blur(2px)",
      zIndex: 100
    }
  }
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const classes = useStyles();

  const { user } = useContext(AuthContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  // o que a carinha da barra pediu: só o resumo, só as respostas, ou tudo
  const [copilotFocus, setCopilotFocus] = useState(null);

  useEffect(() => {
    const onAction = event => {
      setCopilotFocus(event.detail || null);
      setCopilotOpen(true);
    };
    window.addEventListener(AI_ACTION_EVENT, onAction);
    return () => window.removeEventListener(AI_ACTION_EVENT, onAction);
  }, []);
  const wrapperRef = useRef(null);
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  // No celular a faixa de tags ocupava uma linha inteira entre o cabeçalho e
  // as mensagens, mesmo quando o ticket não tinha tag nenhuma. Ela passa a
  // abrir por um botão no cabeçalho; no desktop continua sempre visível.
  const [tagsOpen, setTagsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});
  const [showTabGroups, setShowTabGroups] = useState(false);
  const [tagsMode, setTagsMode] = useState("ticket");
  const { getSetting } = useSettings();

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    Promise.all([getSetting("CheckMsgIsGroup"), getSetting("groupsTab")]).then(
      ([ignoreGroups, groupsTab]) => {
        setShowTabGroups(
          ignoreGroups === "disabled" && groupsTab === "enabled"
        );
      }
    );

    getSetting("tagsMode", "ticket").then(tagsMode => {
      setTagsMode(tagsMode);
    });
  }, []);

  useEffect(() => {
    // veio da lista: mostra na hora e atualiza com o servidor em seguida
    const cached = cachedTicket(ticketId);
    if (cached) {
      setContact(cached.contact || {});
      setTicket(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        try {
          const { data } = await api.get("/tickets/u/" + ticketId);
          const { queueId } = data;
          const { queues, profile } = user;

          const queueAllowed = queues.find(q => q.id === queueId);
          if (queueAllowed === undefined && profile !== "admin") {
            toast.error("Acesso não permitido");
            history.push("/tickets");
            return;
          }

          setContact(data.contact);
          setTicket(data);
          rememberTicket(data);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchTicket();
    }, 0);
    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, user, history]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");

    const socket = socketManager.GetSocket(companyId);

    const onConnectTicket = () => {
      socket.emit("joinChatBox", `${ticket.id}`);
    };

    socketManager.onConnect(onConnectTicket);

    const onCompanyTicket = data => {
      if (data.action === "update" && data.ticket.id === ticket.id) {
        setTicket(data.ticket);
      }

      if (data.action === "delete" && data.ticketId === ticket.id) {
        history.push("/tickets");
      }
    };

    const onCompanyContact = data => {
      if (data.action === "update") {
        setContact(prevState => {
          if (prevState.id === data.contact?.id) {
            return { ...prevState, ...data.contact };
          }
          return prevState;
        });
      }
    };

    socket.on(`company-${companyId}-ticket`, onCompanyTicket);
    socket.on(`company-${companyId}-contact`, onCompanyContact);

    return () => {
      socket.disconnect();
    };
  }, [ticketId, ticket, history, socketManager]);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // a lista de mensagens reserva o espaço do topo e da barra que
  // flutuam por cima dela (as alturas mudam: tags, resposta, painéis…)
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === "undefined") {
      wrapper?.style.removeProperty("--chat-top");
      wrapper?.style.removeProperty("--chat-bottom");
      return undefined;
    }
    const measure = () => {
      wrapper.style.setProperty(
        "--chat-top",
        `${topRef.current?.offsetHeight || 0}px`
      );
      wrapper.style.setProperty(
        "--chat-bottom",
        `${bottomRef.current?.offsetHeight || 0}px`
      );
    };
    const observer = new ResizeObserver(measure);
    if (topRef.current) observer.observe(topRef.current);
    if (bottomRef.current) observer.observe(bottomRef.current);
    measure();
    return () => observer.disconnect();
  }, [isPhone, loading]);

  // ESC fecha a conversa (ou antes o painel do contato, se estiver aberto).
  // Digitando em outro campo da tela, como a busca, o ESC é daquele campo.
  useEffect(() => {
    const onKey = e => {
      if (e.key !== "Escape" || e.defaultPrevented || overlayOpen()) return;
      const target = e.target;
      const typing =
        target?.matches?.("input, textarea, select, [contenteditable=true]") &&
        !wrapperRef.current?.contains(target);
      if (typing) return;
      if (drawerOpen) {
        setDrawerOpen(false);
      } else {
        history.push("/tickets");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, history]);

  const renderTicketInfo = () => {
    if (ticket.user !== undefined) {
      return (
        <TicketInfo
          contact={contact}
          ticket={ticket}
          onClick={handleDrawerOpen}
        />
      );
    }
  };

  const renderMessagesList = () => {
    return (
      <>
        <MessagesList
          ticket={ticket}
          ticketId={ticket.id}
          isGroup={ticket.isGroup}
          markAsRead={true}
        ></MessagesList>
        <div ref={bottomRef} className={classes.phoneBottom}>
          <AiCopilot
            open={copilotOpen}
            onClose={() => setCopilotOpen(false)}
            ticket={ticket}
            focus={copilotFocus}
          />
          <MessageInput ticket={ticket} showTabGroups />
        </div>
      </>
    );
  };

  return (
    <div className={classes.root} id="drawer-container">
      <Paper
        ref={wrapperRef}
        variant="outlined"
        elevation={0}
        className={clsx(classes.mainWrapper, {
          [classes.mainWrapperShift]: drawerOpen,
          [classes.mainWrapperPhone]: isPhone
        })}
      >
        <div
          className={clsx({
            [classes.drawerShade]: drawerOpen
          })}
          onClick={() => setDrawerOpen(false)}
        ></div>
        <div ref={topRef} className={classes.phoneTop}>
          <TicketHeader loading={loading} showBack>
            {renderTicketInfo()}
            {isPhone && (
              <Tooltip title="Tags">
                <IconButton
                  size="small"
                  className={classes.tagsToggle}
                  onClick={() => setTagsOpen(open => !open)}
                  aria-expanded={tagsOpen}
                  aria-label="Tags"
                >
                  <Badge
                    badgeContent={
                      (tagsMode === "contact" ? contact?.tags : ticket?.tags)
                        ?.length || 0
                    }
                  >
                    <LocalOfferOutlinedIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
            <TicketActionButtons
              ticket={ticket}
              showTabGroups={showTabGroups}
            />
          </TicketHeader>
          {(!isPhone || tagsOpen) && (
            <Paper square elevation={0} className={classes.tagsBar}>
              <TagsContainer
                ticket={["ticket", "both"].includes(tagsMode) && ticket}
                contact={tagsMode === "contact" && contact}
              />
            </Paper>
          )}
        </div>
        <ReplyMessageProvider>
          <EditMessageProvider>{renderMessagesList()}</EditMessageProvider>
        </ReplyMessageProvider>
      </Paper>
      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
        ticket={ticket}
      />
    </div>
  );
};

export default Ticket;
