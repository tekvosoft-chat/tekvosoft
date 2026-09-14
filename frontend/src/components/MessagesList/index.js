import React, {
  useState,
  useEffect,
  useReducer,
  useRef,
  useContext,
  useMemo
} from "react";

import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";

import { blue } from "@material-ui/core/colors";
import {
  Avatar,
  Button,
  Divider,
  IconButton,
  makeStyles,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@material-ui/core";

import {
  AccessTime,
  Block,
  ErrorOutline,
  Warning,
  Done,
  DoneAll,
  ExpandMore,
  GetApp,
  Facebook,
  Instagram,
  Description,
  Forward,
  Launch,
  Reply,
  LocationOn,
  PlayArrow,
  Pause,
  CropFree
} from "@material-ui/icons";

import WhatsMarked from "react-whatsmarked";
import PdfPreview from "../PdfPreview";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.png";
import whatsBackgroundDark from "../../assets/wa-background-dark.png";
import MediaGalleryLightbox, {
  buildMediaGalleryData
} from "../MediaGalleryLightbox";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { i18n } from "../../translate/i18n";
import vCard from "vcard-parser";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import { downloadFile } from "../../helpers/downloadFile";
import { Mutex } from "async-mutex";
import BoxLoader from "../ui/BoxLoader";
import AudioBubble from "./AudioBubble";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";

// seta de responder (branca), usada no gesto de arrastar a mensagem
const REPLY_ICON = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>'
)}")`;

const loadPageMutex = new Mutex();

const useStyles = makeStyles(theme => ({
  messageContainer: {
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: "bold",
      textDecoration: "none"
    },
    "& span.tekvosoftMention": {
      color: theme.palette.primary.main,
      fontWeight: "bold",
      cursor: "pointer"
    },
    marginBottom: 5
  },

  stickedMessages: {
    backgroundImage:
      theme.mode === "light"
        ? `url(${whatsBackground})`
        : `url(${whatsBackgroundDark})`,
    flexDirection: "column",
    flexGrow: 1,
    padding: "5px 20px 20px 20px",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    maxHeight: "250px",
    zIndex: 10,
    borderTop: `1px solid ${theme.palette.divider}`
  },

  messagesListWrapper: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    minWidth: 300,
    minHeight: 150,
    // minWidth de 300px empurrava a conversa para fora de celulares estreitos
    [theme.breakpoints.down("xs")]: { minWidth: 0, minHeight: 0 }
  },

  messagesList: {
    // Papel de parede e cor de fundo do WhatsApp oficial. A imagem de
    // rabiscos saiu das telas de listagem, mas aqui ela é o ambiente certo:
    // quem atende está conversando com alguém que vê exatamente isto.
    backgroundColor: theme.palette.tkv.chat.wallpaper,
    backgroundImage:
      theme.mode === "light"
        ? `url(${whatsBackground})`
        : `url(${whatsBackgroundDark})`,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: "20px 20px 20px 20px",
    overflowY: "scroll",
    overscrollBehavior: "contain",
    ...theme.scrollbarStyles,
    [theme.breakpoints.down("xs")]: {
      padding: "10px 8px 12px",
      "-webkit-overflow-scrolling": "touch"
    }
  },

  // carregando mensagens: no meio da área da conversa, grande e visível
  circleLoading: {
    position: "absolute",
    zIndex: 2,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none"
  },

  messageLeft: {
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: "min(600px, 100%)",
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover [id^='messageActionsButton']": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0
    },

    whiteSpace: "pre-wrap",
    backgroundColor: theme.palette.tkv.chat.bubbleIn,
    color: theme.palette.tkv.chat.text,
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: theme.palette.tkv.chat.bubbleShadow,
    transition: "background-color 0.5s ease-in-out",
    [theme.breakpoints.down("xs")]: {
      marginRight: 0,
      maxWidth: "86%",
      minWidth: 72
    }
  },

  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: theme.palette.tkv.chat.quoteIn,
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
    cursor: "pointer"
  },

  quotedMsg: {
    padding: 10,
    // maxWidth: 300,
    width: "100%",
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden"
  },

  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef"
  },

  quotedThumbnail: {
    maxWidth: "180px",
    height: "90px"
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: "min(600px, 100%)",
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover [id^='messageActionsButton']": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0
    },
    whiteSpace: "pre-wrap",
    backgroundColor: theme.palette.tkv.chat.bubbleOut,
    color: theme.palette.tkv.chat.text,
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: theme.palette.tkv.chat.bubbleShadow,
    transition: "background-color 0.5s ease-in-out",
    [theme.breakpoints.down("xs")]: {
      marginLeft: 0,
      maxWidth: "86%",
      minWidth: 72
    }
  },

  quotedContainerRight: {
    margin: "-3px -80px 6px -6px",
    overflowY: "hidden",
    backgroundColor: theme.palette.tkv.chat.quoteOut,
    borderRadius: "7.5px",
    display: "flex",
    position: "relative"
  },

  quotedMsgRight: {
    padding: 10,
    // maxWidth: 300,
    height: "auto",
    whiteSpace: "pre-wrap"
  },

  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96"
  },

  messageActionsButton: {
    display: "none",
    position: "relative",
    color: "#999",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" }
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
    cursor: "pointer"
  },

  forwardedMessage: {
    display: "flex",
    color: theme.mode === "light" ? "#999" : "#d0d0d0",
    fontSize: 11,
    fontWeight: "bold"
  },

  forwardedIcon: {
    color: theme.mode === "light" ? "#999" : "#d0d0d0",
    fontSize: 15,
    verticalAlign: "middle",
    marginLeft: 4
  },

  textContentItem: {
    fontSize: "0.9063rem",
    lineHeight: 1.4,
    [theme.breakpoints.down("xs")]: { padding: "3px 66px 6px 6px" },
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px"
  },

  messageLocation: {
    display: "flex",
    padding: 5,
    cursor: "pointer"
  },

  messageLocationText: {
    verticalAlign: "middle",
    paddingLeft: 5,
    minWidth: 200,
    marginTop: "auto",
    marginBottom: "auto"
  },

  textContentItemDeleted: {
    fontStyle: "italic",
    color: "rgba(0, 0, 0, 0.36)",
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px"
  },

  textContentItemEdited: {
    overflowWrap: "break-word",
    padding: "3px 120px 6px 6px"
  },
  messageMediaDeleted: {
    filter: "grayscale(1)",
    opacity: 0.4
  },

  messageVideo: {
    width: 250,
    maxHeight: 445,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8
  },
  videoPreviewWrapper: {
    width: 250,
    maxHeight: 445,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000"
  },
  videoPreviewMedia: {
    width: "100%",
    maxHeight: 445,
    display: "block"
  },
  videoPreviewActions: {
    position: "absolute",
    right: 8,
    bottom: 8,
    display: "flex",
    gap: 8,
    zIndex: 1
  },
  videoPreviewActionButton: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    color: "#fff",
    "&:hover": {
      backgroundColor: "rgba(15, 23, 42, 0.82)"
    }
  },

  messageMedia: {
    objectFit: "cover",
    width: "100%",
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8
  },

  messageMediaClickable: {
    cursor: "pointer"
  },

  messageMediaSticker: {
    backgroundColor: "unset",
    boxShadow: "unset"
  },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: theme.palette.tkv.chat.meta
  },

  timestampStickerLeft: {
    backgroundColor: theme.palette.tkv.chat.bubbleIn,
    borderRadius: 8,
    padding: 5,
    boxShadow:
      theme.mode === "light" ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
  },

  timestampStickerRight: {
    backgroundColor: theme.palette.tkv.chat.bubbleOut,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow:
      theme.mode === "light" ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
  },

  dailyTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "auto",
    minWidth: 90,
    backgroundColor: theme.palette.tkv.chat.datePill,
    margin: "10px",
    borderRadius: 8,
    boxShadow: theme.palette.tkv.chat.bubbleShadow
  },

  dailyTimestampText: {
    color: theme.palette.tkv.chat.datePillText,
    fontSize: "0.75rem",
    fontWeight: 500,
    padding: "5px 12px",
    alignSelf: "center",
    marginLeft: "0px"
  },

  ackIcons: {
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4
  },

  deletedIcon: {
    fontSize: 18,
    verticalAlign: "middle",
    marginRight: 4
  },

  ackDoneReadIcon: {
    color: blue[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4
  },

  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10
  },
  imageLocation: {
    position: "relative",
    color: "red",
    width: 100,
    height: 100,
    borderRadius: 5
  },

  "@global": {
    "@keyframes wave": {
      "0%, 60%, 100%": {
        transform: "initial"
      },
      "30%": {
        transform: "translateY(-15px)"
      }
    },
    "@keyframes quiet": {
      "25%": {
        transform: "scaleY(.6)"
      },
      "50%": {
        transform: "scaleY(.4)"
      },
      "75%": {
        transform: "scaleY(.8)"
      }
    },
    "@keyframes normal": {
      "25%": {
        transform: "scaleY(.1)"
      },
      "50%": {
        transform: "scaleY(.4)"
      },
      "75%": {
        transform: "scaleY(.6)"
      }
    },
    "@keyframes loud": {
      "25%": {
        transform: "scaleY(1)"
      },
      "50%": {
        transform: "scaleY(.4)"
      },
      "75%": {
        transform: "scaleY(1.2)"
      }
    }
  },
  wave: {
    position: "relative",
    textAlign: "center",
    height: "30px",
    marginTop: "10px",
    marginLeft: "auto",
    marginRight: "auto"
  },
  dot: {
    display: "inline-block",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    marginRight: "3px",
    background: theme.mode === "light" ? "#303030" : "#ffffff",
    animation: "wave 1.3s linear infinite",
    "&:nth-child(2)": {
      animationDelay: "-1.1s"
    },
    "&:nth-child(3)": {
      animationDelay: "-0.9s"
    }
  },

  wavebarsContainer: {
    display: "flex",
    justifyContent: "space-between",
    height: "30px",
    marginTop: "5px",
    marginBottom: "5px",
    marginLeft: "auto",
    marginRight: "auto",
    "--boxSize": "5px",
    "--gutter": "4px",
    width: "calc((var(--boxSize) + var(--gutter)) * 5)"
  },

  wavebars: {
    transform: "scaleY(.4)",
    height: "100%",
    width: "var(--boxSize)",
    animationDuration: "1.2s",
    backgroundColor: theme.mode === "light" ? "#303030" : "#ffffff",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    borderRadius: "8px"
  },

  wavebar1: {
    animationName: "quiet"
  },
  wavebar2: {
    animationName: "normal"
  },
  wavebar3: {
    animationName: "quiet"
  },
  wavebar4: {
    animationName: "loud"
  },
  wavebar5: {
    animationName: "quiet"
  },
  linkPreviewThumbnail: {
    width: "328px",
    height: "172px"
  },
  linkPreviewTitle: {
    fontWeight: "bold",
    marginBottom: "4px"
  },
  linkPreviewDescription: {
    marginBottom: "4px"
  },
  linkPreviewUrl: {
    opacity: 0.6
  },
  linkPreviewAnchor: {
    textDecoration: "none",
    color: theme.mode === "light" ? "#303030" : "#ffffff"
  },
  messageHighlighted: {
    backgroundColor: theme.palette.primary.main
  },
  previewThumbnail: {
    width: "383px",
    maxWidth: "100%"
  },
  audioBottom: {
    marginBottom: "12px"
  },
  /**
   * Reações no desenho do WhatsApp: uma pílula pequena presa na borda de
   * baixo do balão, com o contorno da cor do fundo da conversa (parece
   * "recortada" do balão), emojis agrupados e a contagem quando repete.
   */
  // o contêiner não ocupa altura dentro do balão; a margem de baixo "vaza"
  // para fora dele e abre o espaço onde a pílula fica pendurada
  reactionsContainer: {
    display: "block",
    height: 0,
    marginBottom: 18
  },
  reactions: {
    position: "absolute",
    bottom: -19,
    left: 8,
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    maxWidth: "calc(100% - 12px)",
    height: 24,
    padding: "0 7px",
    borderRadius: 12,
    backgroundColor: theme.palette.tkv.chat.bubbleIn,
    border: `2px solid ${theme.palette.tkv.chat.wallpaper}`,
    boxShadow: "0 1px 2px rgba(11, 20, 26, 0.18)",
    cursor: "default",
    whiteSpace: "nowrap",
    animation: "$reactionPop .28s cubic-bezier(.34, 1.56, .64, 1)"
  },
  reactionsRight: {
    left: "auto",
    right: 8
  },
  reactionEmoji: {
    fontSize: 15,
    lineHeight: 1
  },
  reactionCount: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: theme.palette.tkv.chat.meta,
    marginLeft: 1
  },
  "@keyframes reactionPop": {
    from: { transform: "scale(0.4)", opacity: 0 },
    to: { transform: "scale(1)", opacity: 1 }
  },

  // arrastar a mensagem para a direita responde (celular)
  swipeable: {
    touchAction: "pan-y",
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: -40,
      width: 30,
      height: 30,
      marginTop: -15,
      borderRadius: "50%",
      backgroundColor: "rgba(0, 0, 0, 0.28)",
      backgroundImage: REPLY_ICON,
      backgroundSize: "18px 18px",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      opacity: "var(--swipe, 0)",
      transform: "scale(calc(0.5 + var(--swipe, 0) * 0.5))",
      pointerEvents: "none"
    }
  },
  mediaDescription: {
    padding: 5,
    marginBottom: 5,
    borderLeft: "5px solid",
    borderColor: theme.mode === "light" ? "#000" : "#fff"
  },
  messageButton: {
    display: "flex",
    width: "100%",
    textTransform: "none",
    margin: "auto"
  },
  messageErrorBand: {
    marginTop: 6,
    marginLeft: -5,
    marginRight: -5,
    overflow: "hidden",
    backgroundColor: "#c62828",
    color: "#ffeb3b",
    textAlign: "center",
    padding: "4px 6px",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    lineHeight: 1.3,
    fontWeight: 700
  }
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_MESSAGES") {
    const messages = action.payload;
    const newMessages = [];

    messages.forEach(message => {
      const messageIndex = state.findIndex(m => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = message;
      } else {
        newMessages.push(message);
      }
    });

    return [...newMessages, ...state];
  }

  if (action.type === "ADD_MESSAGE") {
    const newMessage = action.payload;
    const messageIndex = state.findIndex(m => m.id === newMessage.id);

    if (messageIndex !== -1) {
      state[messageIndex] = newMessage;
    } else {
      state.push(newMessage);
    }

    if (newMessage.mediaType === "reactionMessage") {
      const reactionIndex = state.findIndex(
        m => m.id === newMessage.quotedMsgId
      );
      if (reactionIndex !== -1) {
        state[reactionIndex].replies = state[reactionIndex].replies || [];
        state[reactionIndex].replies.push(newMessage);
      }
    }

    return [...state];
  }

  if (action.type === "RESET_STICKY") {
    state.forEach(message => {
      delete message.bottomStick;
    });
    return [...state];
  }

  if (action.type === "UPDATE_MESSAGE") {
    const messageToUpdate = action.payload;
    const messageIndex = state.findIndex(m => m.id === messageToUpdate.id);

    if (messageIndex !== -1) {
      state[messageIndex] = messageToUpdate;
    }

    return [...state];
  }

  if (action.type === "MERGE_MESSAGES") {
    const messages = action.payload;

    messages.forEach(message => {
      const messageIndex = state.findIndex(m => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = message;
      } else {
        const idx = state.findIndex(
          m => new Date(m.createdAt) > new Date(message.createdAt)
        );
        state.splice(idx < 0 ? state.length : idx, 0, message);
      }
    });

    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const MessagesList = ({ ticket, ticketId, isGroup, markAsRead, readOnly }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const replyContext = useContext(ReplyMessageContext);
  const canReply = !readOnly && !!replyContext?.setReplyingMessage;
  const swipeRef = useRef(null);

  const replyTo = (message, element) => {
    replyContext.setReplyingMessage(message);
    element?.animate?.(
      [{ filter: "brightness(0.88)" }, { filter: "brightness(1)" }],
      { duration: 380, easing: "ease-out" }
    );
  };

  const finishSwipe = message => {
    const swipe = swipeRef.current;
    swipeRef.current = null;
    if (!swipe || swipe.axis !== "x") return;
    const { el } = swipe;
    el.style.transition = "transform .28s cubic-bezier(.2, .8, .2, 1)";
    el.style.transform = "";
    el.style.setProperty("--swipe", "0");
    setTimeout(() => {
      el.style.transition = "";
    }, 320);
    if (message && swipe.dx >= 56) replyTo(message, el);
  };

  /**
   * Responder em cima de uma mensagem sem abrir menu: no celular, arrastando
   * o balão para a direita (como no WhatsApp); no computador, com dois
   * cliques. Continua existindo o "Responder" no menu da mensagem.
   */
  const replyGestures = message => {
    if (!canReply || message.isDeleted) return {};
    return {
      onTouchStart: e => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        swipeRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          dx: 0,
          axis: null,
          buzzed: false,
          el: e.currentTarget
        };
      },
      onTouchMove: e => {
        const swipe = swipeRef.current;
        if (!swipe) return;
        const touch = e.touches[0];
        const dx = touch.clientX - swipe.x;
        const dy = touch.clientY - swipe.y;
        if (!swipe.axis) {
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
          swipe.axis = dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.4 ? "x" : "y";
          if (swipe.axis === "x") swipe.el.style.transition = "none";
        }
        if (swipe.axis !== "x") return;
        swipe.dx = Math.max(0, dx);
        const pull = swipe.dx < 64 ? swipe.dx : 64 + (swipe.dx - 64) * 0.3;
        swipe.el.style.transform = `translateX(${Math.min(pull, 90)}px)`;
        swipe.el.style.setProperty(
          "--swipe",
          String(Math.min(1, swipe.dx / 56))
        );
        if (swipe.dx >= 56 && !swipe.buzzed) {
          swipe.buzzed = true;
          if (navigator.vibrate) navigator.vibrate(12);
        } else if (swipe.dx < 56) {
          swipe.buzzed = false;
        }
      },
      onTouchEnd: () => finishSwipe(message),
      onTouchCancel: () => finishSwipe(null),
      onDoubleClick: e => {
        if (!window.matchMedia?.("(pointer: fine)").matches) return;
        if (
          e.target.closest?.(
            "a, button, img, video, audio, input, textarea, [role=button]"
          )
        ) {
          return;
        }
        window.getSelection?.()?.removeAllRanges();
        replyTo(message, e.currentTarget);
      }
    };
  };

  const [messagesList, dispatch] = useReducer(reducer, []);
  const messagesListRef = useRef(messagesList);
  useEffect(() => {
    messagesListRef.current = messagesList;
  }, [messagesList]);
  const [nextId, setNextId] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();
  const stickedRef = useRef();
  const previewVideoRefs = useRef({});

  const [selectedMessage, setSelectedMessage] = useState({});
  const [selectedMessageData, setSelectedMessageData] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [previewVideoPlayingById, setPreviewVideoPlayingById] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const currentTicketId = useRef(ticketId);
  const [contactPresence, setContactPresence] = useState("available");

  const socketManager = useContext(SocketContext);

  function loadData(incrementPage = false) {
    if (incrementPage && !nextId) {
      return;
    }

    setLoading(true);
    const thisNextId = incrementPage ? nextId : undefined;
    const delayDebounceFn = setTimeout(() => {
      const fetchMessages = async () => {
        if (ticketId === undefined) return;
        try {
          const { data } = await api.get("/messages/" + ticketId, {
            params: { nextId: thisNextId, markAsRead }
          });

          if (currentTicketId.current === ticketId) {
            dispatch({ type: "LOAD_MESSAGES", payload: data.messages });
            setHasMore(data.hasMore);
            setNextId(data.nextId || null);
            setLoading(false);
          }

          if (!incrementPage && data.messages.length > 1) {
            scrollToBottom();
          }
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchMessages();
    }, 500);
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }

  function refreshMessagesList() {
    dispatch({ type: "RESET" });
    setNextId(null);
    setHasMore(false);
    loadData();
  }

  useEffect(async () => {
    dispatch({ type: "RESET" });
    setContactPresence("available");

    currentTicketId.current = ticketId;

    await loadPageMutex.runExclusive(async () => {
      loadData();
    });
  }, [ticketId]);

  useEffect(() => {
    if (!ticket.id) {
      return;
    }

    const companyId = localStorage.getItem("companyId");

    const socket = socketManager.GetSocket(companyId);

    const onConnect = () => {
      socket.emit("joinChatBox", `${ticket.id}`);
    };

    socketManager.onConnect(onConnect);

    const onAppMessage = data => {
      if (data.message.ticketId === currentTicketId.current) {
        setContactPresence("available");
        if (data.action === "create") {
          const message = data.message;
          const { scrollTop, clientHeight, scrollHeight } = scrollRef.current;
          const isAtBottom =
            scrollTop + clientHeight >= scrollHeight - clientHeight / 4;
          message.bottomStick = (!isAtBottom && !message.fromMe) || undefined;
          dispatch({ type: "ADD_MESSAGE", payload: message });
          if (
            (isAtBottom || data.message.fromMe) &&
            data.message.mediaType !== "reactionMessage"
          ) {
            scrollToBottom();
          }
          if (message.bottomStick) {
            scrollStickedToBottom();
          }
        }

        if (data.action === "update") {
          dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
        }
      }
    };

    socket.on(`company-${companyId}-appMessage`, onAppMessage);
    socket.on("wsRefreshRequired", refreshRequired => {
      if (!refreshRequired || !currentTicketId.current) {
        return;
      }

      loadPageMutex.runExclusive(async () => {
        const currentList = messagesListRef.current;
        if (currentList.length > 0) {
          const maxUpdatedAt = currentList.reduce(
            (max, msg) => (msg.updatedAt > max ? msg.updatedAt : max),
            currentList[0].updatedAt
          );

          try {
            const { data } = await api.get(
              "/messages/" + currentTicketId.current,
              {
                params: { minUpdatedAt: maxUpdatedAt }
              }
            );
            const currentIds = new Set(currentList.map(m => m.id));
            const newMessages = data.messages.filter(
              m => !currentIds.has(m.id)
            );
            let isAtBottom = false;
            let newestMessage = null;

            if (newMessages.length > 0) {
              const { scrollTop, clientHeight, scrollHeight } =
                scrollRef.current;
              isAtBottom =
                scrollTop + clientHeight >= scrollHeight - clientHeight / 4;
              newestMessage = newMessages.reduce((latest, msg) =>
                new Date(msg.createdAt) > new Date(latest.createdAt)
                  ? msg
                  : latest
              );
              newestMessage.bottomStick =
                (!isAtBottom && !newestMessage.fromMe) || undefined;
            }

            dispatch({ type: "MERGE_MESSAGES", payload: data.messages });

            if (newMessages.length > 0) {
              if (
                (isAtBottom || newestMessage.fromMe) &&
                newestMessage.mediaType !== "reactionMessage"
              ) {
                scrollToBottom();
              }
              if (newestMessage.bottomStick) {
                scrollStickedToBottom();
              }
            }
          } catch (err) {
            toastError(err);
          }
        } else {
          refreshMessagesList();
        }
      });
    });

    socket.on(`company-${companyId}-presence`, data => {
      const { scrollTop, clientHeight, scrollHeight } = scrollRef.current;
      console.log({
        presence: data.presence,
        scrollTop,
        clientHeight,
        scrollHeight
      });
      const isAtBottom =
        scrollTop + clientHeight >= scrollHeight - clientHeight / 4;
      if (data?.ticketId === ticket.id) {
        setContactPresence(data.presence);
        if (["composing", "recording"].includes(data.presence)) {
          if (isAtBottom) {
            scrollToBottom();
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticketId, ticket, socketManager]);

  const loadMore = async () => {
    await loadPageMutex.runExclusive(async () => {
      loadData(true);
    });
  };

  // Quando a lista encolhe (teclado abrindo, barra do navegador aparecendo,
  // giro da tela) e a pessoa estava lendo o fim da conversa, ela continua no
  // fim — como no WhatsApp. Sem isto, abrir o teclado escondia justamente as
  // últimas mensagens atrás dele.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    let nearBottom = true;
    const onScroll = () => {
      nearBottom = el.scrollHeight - el.clientHeight - el.scrollTop < 120;
    };
    const observer = new ResizeObserver(() => {
      if (nearBottom) el.scrollTop = el.scrollHeight;
    });
    el.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [ticketId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      dispatch({ type: "RESET_STICKY" });
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const scrollStickedToBottom = () => {
    if (stickedRef.current) {
      stickedRef.current.scrollTop = stickedRef.current.scrollHeight;
    }
  };

  const handleScroll = e => {
    const messagesList = e.currentTarget;
    const sticky = document.querySelector(`.${classes.stickedMessages}`);
    if (sticky && sticky.style.display !== "none") {
      const { scrollTop, clientHeight, scrollHeight } = messagesList;
      const stickyHeight = sticky.offsetHeight;
      // If any part of sticky is visible at the bottom
      if (scrollTop + clientHeight >= scrollHeight - stickyHeight) {
        dispatch({ type: "RESET_STICKY" });
      }
    }

    if (!hasMore) return;
    const { scrollTop } = e.currentTarget;

    if (scrollTop === 0) {
      document.getElementById("messagesList").scrollTop = 1;
    }

    if (loading) {
      return;
    }

    if (scrollTop < 50) {
      loadMore();
    }
  };

  const handleOpenMessageOptionsMenu = (e, message, data) => {
    setAnchorEl(e.currentTarget);
    setSelectedMessage(message);
    setSelectedMessageData(data);
  };

  const handleCloseMessageOptionsMenu = e => {
    setAnchorEl(null);
  };

  const lightboxMedia = useMemo(() => {
    return buildMediaGalleryData(messagesList);
  }, [messagesList]);

  const openLightboxForMessage = messageId => {
    const index = lightboxMedia.byMessageId[messageId];
    if (index === undefined) {
      return;
    }

    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const handleVideoPreviewPlayClick = (event, messageId) => {
    event.stopPropagation();

    const previewVideo = previewVideoRefs.current[messageId];
    if (!previewVideo) {
      return;
    }

    if (previewVideo.paused) {
      previewVideo.play().catch(() => {});
      return;
    }

    previewVideo.pause();
  };

  const pausePreviewVideo = messageId => {
    const previewVideo = previewVideoRefs.current[messageId];
    if (!previewVideo) {
      return;
    }

    previewVideo.pause();
  };

  const checkMessageMedia = (message, data, isSticker = false) => {
    const document =
      data?.message?.documentMessage ||
      data?.message?.documentWithCaptionMessage?.message?.documentMessage;
    if (isSticker) {
      return (
        <img
          className={clsx(classes.messageMedia, {
            [classes.messageMediaDeleted]: message.isDeleted
          })}
          src={message.mediaUrl}
          alt="sticker"
        />
      );
    }

    if (!document && message.mediaType === "image") {
      return (
        <>
          <img
            className={clsx(
              classes.messageMedia,
              classes.messageMediaClickable,
              {
                [classes.messageMediaDeleted]: message.isDeleted
              }
            )}
            src={message.mediaUrl}
            alt="midia da mensagem"
            onClick={() => openLightboxForMessage(message.id)}
          />
          <>
            <div
              className={[
                clsx({
                  [classes.textContentItemDeleted]: message.isDeleted,
                  [classes.textContentItem]: !message.isDeleted
                })
              ]}
            >
              {message.body && (
                <>
                  <WhatsMarked>{message.body}</WhatsMarked>
                </>
              )}
            </div>
          </>
        </>
      );
    }
    if (!document && message.mediaType === "audio" && isPhone) {
      return (
        <>
          <AudioBubble
            id={message.id}
            src={message.mediaUrl}
            fromMe={message.fromMe}
            avatarUrl={
              message.contact?.profilePicUrl || ticket?.contact?.profilePicUrl
            }
            whatsappId={ticket?.whatsappId}
            name={
              message.fromMe
                ? ticket?.whatsapp?.name
                : message.contact?.name || ticket?.contact?.name
            }
            color={
              message.fromMe
                ? theme.palette.tkv.brand.main
                : generateColor(
                    message.contact?.number || ticket?.contact?.number
                  )
            }
          />
          {message.body && !["🔊", "Áudio"].includes(message.body) && (
            <div className={classes.mediaDescription}>{message.body}</div>
          )}
        </>
      );
    }
    if (!document && message.mediaType === "audio") {
      return (
        <>
          <audio className={classes.audioBottom} controls>
            <source src={message.mediaUrl} type="audio/ogg"></source>
          </audio>
          {message.body && !["🔊", "Áudio"].includes(message.body) && (
            <div className={classes.mediaDescription}>{message.body}</div>
          )}
        </>
      );
    }

    if (!document || message.mediaType === "video") {
      return (
        <>
          <div
            className={clsx(classes.videoPreviewWrapper, {
              [classes.messageMediaDeleted]: message.isDeleted
            })}
          >
            <video
              ref={element => {
                if (element) {
                  previewVideoRefs.current[message.id] = element;
                } else {
                  delete previewVideoRefs.current[message.id];
                }
              }}
              className={classes.videoPreviewMedia}
              src={message.mediaUrl}
              preload="metadata"
              playsInline
              onPlay={() => {
                setPreviewVideoPlayingById(previous => ({
                  ...previous,
                  [message.id]: true
                }));
              }}
              onPause={() => {
                setPreviewVideoPlayingById(previous => ({
                  ...previous,
                  [message.id]: false
                }));
              }}
              onEnded={() => {
                setPreviewVideoPlayingById(previous => ({
                  ...previous,
                  [message.id]: false
                }));
              }}
            />
            <div className={classes.videoPreviewActions}>
              <IconButton
                className={classes.videoPreviewActionButton}
                aria-label="play preview"
                onClick={event =>
                  handleVideoPreviewPlayClick(event, message.id)
                }
              >
                {previewVideoPlayingById[message.id] ? (
                  <Pause />
                ) : (
                  <PlayArrow />
                )}
              </IconButton>
              <IconButton
                className={classes.videoPreviewActionButton}
                aria-label="open video lightbox"
                onClick={event => {
                  event.stopPropagation();
                  pausePreviewVideo(message.id);
                  openLightboxForMessage(message.id);
                }}
              >
                <CropFree />
              </IconButton>
            </div>
          </div>
          <div
            className={[
              clsx({
                [classes.textContentItemDeleted]: message.isDeleted,
                [classes.textContentItem]: !message.isDeleted
              })
            ]}
          >
            {message.body && (
              <>
                <WhatsMarked>{message.body}</WhatsMarked>
              </>
            )}
          </div>
        </>
      );
    } else {
      const fileName = document?.fileName || message.body || "";
      const isPdf =
        fileName.toLowerCase().endsWith(".pdf") ||
        (document?.mimetype || "").toLowerCase().includes("pdf") ||
        (message.mediaUrl || "").toLowerCase().includes(".pdf");
      return (
        <>
          {isPdf && message.mediaUrl && (
            <PdfPreview url={message.mediaUrl} fileName={fileName} />
          )}
          <div className={classes.downloadMedia}>
            <Button
              startIcon={<Description />}
              endIcon={<GetApp />}
              color="primary"
              variant="outlined"
              onClick={() => downloadFile(message.mediaUrl)}
            >
              {document?.fileName || message.body}
            </Button>
          </div>
          {message.body !== document?.fileName && (
            <>
              <div
                className={[
                  clsx({
                    [classes.textContentItemDeleted]: message.isDeleted
                  })
                ]}
              >
                <WhatsMarked>{message.body}</WhatsMarked>
              </div>
            </>
          )}
        </>
      );
    }
  };

  const renderMessageAck = message => {
    if (message.ack === -1) {
      return <ErrorOutline fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 0) {
      return <Warning fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 1) {
      return <AccessTime fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 2) {
      return <Done fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 3) {
      return <DoneAll fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 4) {
      return <DoneAll fontSize="small" className={classes.ackDoneReadIcon} />;
    }
  };

  const renderDailyTimestamps = (message, index) => {
    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`timestamp-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
      );
    }
    if (index < messagesList.length) {
      let messageDay = parseISO(messagesList[index].createdAt);
      let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

      if (!isSameDay(messageDay, previousMessageDay)) {
        return (
          <span
            className={classes.dailyTimestamp}
            key={`timestamp-${message.id}`}
          >
            <div className={classes.dailyTimestampText}>
              {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
        );
      }
    }
  };

  const renderMessageDivider = (message, index) => {
    if (index < messagesList.length && index > 0) {
      let messageUser = messagesList[index].fromMe;
      let previousMessageUser = messagesList[index - 1].fromMe;

      if (messageUser !== previousMessageUser) {
        return (
          <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>
        );
      }
    }
  };

  const scrollToMessage = id => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });

      // Add the highlight class
      element.classList.add(classes.messageHighlighted);

      // Remove the highlight class after 2 seconds
      setTimeout(() => {
        element.classList.remove(classes.messageHighlighted);
      }, 2000);
    }
  };

  const getQuotedMessageText = quotedMsg => {
    if (!quotedMsg?.body && quotedMsg?.mediaUrl) {
      return "📎 " + quotedMsg.mediaUrl.split("/").pop();
    }

    if (isVCard(quotedMsg?.body)) {
      return "🪪";
    }

    return quotedMsg?.body;
  };

  const renderQuotedMessage = message => {
    const data = JSON.parse(message.quotedMsg.dataJson);

    const thumbnail = data?.message?.imageMessage?.jpegThumbnail;
    const mediaUrl =
      message.quotedMsg?.mediaType === "image"
        ? message.quotedMsg.mediaUrl
        : null;
    const imageUrl = thumbnail
      ? "data:image/png;base64, " + thumbnail
      : mediaUrl;
    return (
      <div
        className={clsx(classes.quotedContainerLeft, {
          [classes.quotedContainerRight]: message.fromMe
        })}
        onClick={() => scrollToMessage(message.quotedMsg.id)}
      >
        <span
          className={clsx(classes.quotedSideColorLeft, {
            [classes.quotedSideColorRight]: message.quotedMsg?.fromMe
          })}
        ></span>
        <div className={classes.quotedMsg}>
          {!message.quotedMsg?.fromMe && (
            <span className={classes.messageContactName}>
              {message.quotedMsg?.contact?.name}
            </span>
          )}
          <WhatsMarked>{getQuotedMessageText(message.quotedMsg)}</WhatsMarked>
        </div>
        {imageUrl && <img className={classes.quotedThumbnail} src={imageUrl} />}
      </div>
    );
  };

  const renderReplies = (replies, fromMe) => {
    const reactions = (replies || []).filter(
      reply => reply?.mediaType === "reactionMessage" && reply.body
    );
    if (!reactions.length) return null;

    // agrupa o mesmo emoji: "❤️ 2" em vez de dois corações soltos
    const groups = [];
    reactions.forEach(reply => {
      const group = groups.find(g => g.emoji === reply.body);
      const who = reply.fromMe
        ? i18n.t("messagesList.reactions.you")
        : reply.contact?.name;
      if (group) {
        group.count += 1;
        if (who) group.names.push(who);
      } else {
        groups.push({ emoji: reply.body, count: 1, names: who ? [who] : [] });
      }
    });
    const total = reactions.length;
    const names = [...new Set(groups.flatMap(g => g.names))].join(", ");

    return (
      <div className={classes.reactionsContainer}>
        <Tooltip
          title={names}
          placement="top"
          arrow
          disableHoverListener={!names}
        >
          <div
            className={clsx(classes.reactions, {
              [classes.reactionsRight]: fromMe
            })}
          >
            {groups.slice(0, 3).map(group => (
              <span key={group.emoji} className={classes.reactionEmoji}>
                {group.emoji}
              </span>
            ))}
            {total > 1 && (
              <span className={classes.reactionCount}>{total}</span>
            )}
          </div>
        </Tooltip>
      </div>
    );
  };

  const getMessageErrorData = message => {
    if (!message?.error) {
      return null;
    }

    if (typeof message.error === "string") {
      const text = message.error.trim();
      if (!text) {
        return null;
      }
      return {
        code: "ERROR",
        message: text,
        title: `[ERROR] ${text}`
      };
    }

    const errorCode =
      typeof message.error.code === "string" && message.error.code.trim()
        ? message.error.code.trim()
        : "ERROR";
    const errorMessage =
      typeof message.error.message === "string" && message.error.message.trim()
        ? message.error.message.trim()
        : "Unknown error";

    return {
      code: errorCode,
      message: errorMessage,
      title: `[${errorCode}] ${errorMessage}`
    };
  };

  const renderLinkPreview = message => {
    const data = JSON.parse(message.dataJson);

    const title = data?.message?.extendedTextMessage?.title;
    const description = data?.message?.extendedTextMessage?.description;
    const canonicalUrl = data?.message?.extendedTextMessage?.canonicalUrl;
    const url = canonicalUrl && new URL(canonicalUrl);

    if (!title && !description && !url) {
      return <></>;
    }

    const thumbnail = data?.message?.extendedTextMessage?.jpegThumbnail;
    const imageUrl = thumbnail ? "data:image/png;base64, " + thumbnail : "";
    return (
      <a
        href={canonicalUrl}
        className={classes.linkPreviewAnchor}
        target="_blank"
        rel="noreferrer"
      >
        <div
          className={clsx(classes.quotedContainerLeft, {
            [classes.quotedContainerRight]: message.fromMe
          })}
        >
          <div className={classes.quotedMsg}>
            {title && <div className={classes.linkPreviewTitle}>{title}</div>}
            {description && (
              <div className={classes.linkPreviewDescription}>
                {description}
              </div>
            )}
            {url?.hostname && (
              <div className={classes.linkPreviewUrl}>{url.hostname}</div>
            )}
          </div>
          {!message.thumbnailUrl && imageUrl && (
            <img className={classes.quotedThumbnail} src={imageUrl} />
          )}
        </div>
      </a>
    );
  };

  const sendReply = async body => {
    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body
    };

    api.post(`/messages/${ticketId}`, message).catch(err => {
      toastError(err);
    });
  };

  const renderReplyButton = text => {
    return (
      <Button
        className={classes.messageButton}
        color="primary"
        startIcon={<Reply />}
        disabled={!!readOnly}
        onClick={() => {
          if (!readOnly) {
            sendReply(text);
          }
        }}
      >
        {text}
      </Button>
    );
  };

  const renderUrlButton = ({ displayText, url }) => (
    <Button
      className={classes.messageButton}
      color="primary"
      startIcon={
        displayText === "Facebook" ? (
          <Facebook />
        ) : displayText === "Instagram" ? (
          <Instagram />
        ) : (
          <Launch />
        )
      }
    >
      <a
        href={url}
        target="_blank"
        style={{ textDecoration: "none", color: "inherit" }}
        rel="noreferrer"
      >
        {displayText}
      </a>
    </Button>
  );

  const renderButtons = message => {
    const objects =
      message?.buttonsMessage?.buttons ||
      message?.listMessage?.sections ||
      message?.templateMessage?.hydratedTemplate?.hydratedButtons ||
      message?.interactiveMessage?.nativeFlowMessage?.buttons ||
      message?.templateMessage?.interactiveMessageTemplate?.nativeFlowMessage
        ?.buttons;

    if (!objects) return <></>;

    return objects.map(item => {
      if (item.urlButton) {
        return renderUrlButton({
          displayText: item.urlButton.displayText,
          url: item.urlButton.url
        });
      } else if (item.quickReplyButton) {
        return renderReplyButton(item.quickReplyButton.displayText);
      } else if (item.type === "RESPONSE" && item.buttonText) {
        return renderReplyButton(item.buttonText.displayText);
      } else if (item.buttonParamsJson) {
        const params = JSON.parse(item.buttonParamsJson);
        if (params?.payment_setting?.payment_link?.uri) {
          return renderUrlButton({
            displayText: i18n.t("messagesList.openPaymentLink"),
            url: params.payment_setting.payment_link.uri
          });
        }
        if (params?.url && params.display_text) {
          return renderUrlButton({
            displayText: params.display_text,
            url: params.url
          });
        }
        if (params?.display_text) {
          return renderReplyButton(params.display_text);
        }
      } else if (item.rows) {
        return item.rows.map(row => {
          return renderReplyButton(row.title);
        });
      }

      return <></>;
    });
  };

  const formatVCardN = n => {
    return (
      (n[3] ? n[3] + " " : "") +
      (n[1] ? n[1] + " " : "") +
      (n[2] ? n[2] + " " : "") +
      (n[0] ? n[0] + " " : "") +
      (n[4] ? n[4] + " " : "")
    );
  };

  const isVCard = message => {
    return message.startsWith('{"ticketzvCard":');
  };

  const stringOrFirstElement = data => {
    if (!data) {
      return "";
    }
    if (Array.isArray(data)) {
      return data[0];
    }
    return data;
  };

  const handleContactClick = (name, number) => {
    api
      .post(`/contacts/findOrInsert`, {
        name,
        number
      })
      .then(response => {
        if (response?.data?.id) {
          window.mentionClick(response.data);
        }
      })
      .catch(err => {
        toastError(err);
      });
  };

  const renderVCard = vcardJson => {
    const cardArray = JSON.parse(vcardJson)?.ticketzvCard;

    if (!cardArray || !Array.isArray(cardArray)) {
      return <div>Invalid VCARD data</div>;
    }

    return cardArray.map(item => {
      const message = item?.vcard;
      if (!message) {
        return <></>;
      }
      const parsedVCard = vCard.parse(message);
      console.debug("vCard data:", { message, parsedVCard });

      const name = stringOrFirstElement(
        parsedVCard["X-WA-BIZ-NAME"]?.[0]?.value ||
          parsedVCard.fn?.[0]?.value ||
          formatVCardN(parsedVCard.n?.[0]?.value)
      );
      const description = stringOrFirstElement(
        parsedVCard["X-WA-BIZ-DESCRIPTION"]?.[0]?.value || ""
      );
      const number = stringOrFirstElement(parsedVCard?.tel?.[0]?.value);
      const metaNumber =
        parsedVCard?.tel?.[0]?.meta?.waid?.[0] || number || "unknown";

      return (
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginTop: 20,
              marginBottom: 20
            }}
          >
            <Avatar
              style={{
                backgroundColor: generateColor(metaNumber),
                marginRight: 10,
                marginLeft: 20,
                width: 60,
                height: 60,
                color: "white",
                fontWeight: "bold"
              }}
            >
              {getInitials(name)}
            </Avatar>
            <div style={{ width: 350 }}>
              <div>
                <Typography
                  noWrap
                  component="h4"
                  variant="body2"
                  color="textPrimary"
                  style={{ fontWeight: "700" }}
                >
                  {name}
                </Typography>
              </div>

              <div style={{ width: 350 }}>
                <Typography
                  component="span"
                  variant="body2"
                  color="textPrimary"
                  style={{ display: "flex" }}
                >
                  {description}
                </Typography>
              </div>

              <div style={{ width: 350 }}>
                <Typography
                  component="span"
                  variant="body2"
                  color="textPrimary"
                  style={{ display: "flex" }}
                >
                  <span
                    class="tekvosoftMention"
                    onClick={() => handleContactClick(name, metaNumber)}
                  >
                    {number}
                  </span>
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  const convertToDMS = degrees => {
    const deg = Math.floor(degrees);
    const minFloat = (degrees - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.floor((minFloat - min) * 60);
    const frac = ((minFloat - min) * 60 - sec).toFixed(2).substring(1);
    return `${deg}°${min}'${sec}${frac}"`;
  };

  const convertCoordinates = (lat, lon) => {
    const latitude = convertToDMS(Math.abs(lat)) + (lat >= 0 ? " N" : " S");
    const longitude = convertToDMS(Math.abs(lon)) + (lon >= 0 ? " E" : " W");
    return `${latitude}, ${longitude}`;
  };

  const messageLocation = (data, createdAt) => {
    const location = data?.message?.locationMessage;
    if (!location) {
      return <></>;
    }

    const mapUrl = `https://www.google.com/maps?q=${location?.degreesLatitude},${location?.degreesLongitude}`;

    return (
      <div
        onClick={() => {
          window.open(mapUrl, "_blank");
        }}
        className={[clsx(classes.textContentItem, classes.messageLocation)]}
      >
        <div>
          {location?.jpegThumbnail ? (
            <img
              src={`data:image/png;base64, ${location.jpegThumbnail}`}
              className={classes.imageLocation}
            />
          ) : (
            <LocationOn
              className={classes.imageLocation}
              fontSize="large"
              color="red"
            />
          )}
        </div>
        <div className={classes.messageLocationText}>
          {location.name ? (
            <>
              <b>{location.name}</b>
              <br />
            </>
          ) : (
            ""
          )}
          {location.url ? (
            <>
              <a href={location.url} target="_blank" rel="noreferrer">
                {location.url}
              </a>
              <br />
            </>
          ) : (
            ""
          )}
          {location.address ? (
            <>
              {location.address}
              <br />
            </>
          ) : (
            ""
          )}
          {convertCoordinates(
            location.degreesLatitude,
            location.degreesLongitude
          )}
        </div>
        <span className={classes.timestamp}>
          {format(parseISO(createdAt), "HH:mm")}
        </span>
      </div>
    );
  };

  const getDataContextInfo = data => {
    if (!data) {
      return null;
    }

    return (
      data.message?.extendedTextMessage?.contextInfo ||
      data.message?.imageMessage?.contextInfo ||
      data.message?.videoMessage?.contextInfo ||
      data.message?.audioMessage?.contextInfo ||
      data.message?.documentMessage?.contextInfo ||
      data.message?.stickerMessage?.contextInfo ||
      data.message?.productMessage?.contextInfo ||
      data.message?.locationMessage?.contextInfo ||
      data.message?.liveLocationMessage?.contextInfo ||
      data.message?.contactMessage?.contextInfo ||
      data.message?.listMessage?.contextInfo ||
      data.message?.buttonsResponseMessage?.contextInfo ||
      data.message?.paymentMessage?.contextInfo ||
      data.message?.orderMessage?.contextInfo ||
      data.message?.productCatalogMessage?.contextInfo ||
      data.message?.templateButtonReplyMessage?.contextInfo ||
      data.message?.templateMessage?.contextInfo ||
      data.message?.documentWithCaptionMessage?.contextInfo ||
      null
    );
  };

  const renderMessages = () => {
    const stickedMessages = [];
    const viewMessagesList = messagesList.map((message, index) => {
      if (message.mediaType === "reactionMessage") {
        return;
      }

      const data = JSON.parse(message.dataJson);
      const dataContext = getDataContextInfo(data);
      const messageError = getMessageErrorData(message);
      const isSticker = data?.message && "stickerMessage" in data.message;
      if (!message.fromMe) {
        const messageFragment = (
          <React.Fragment key={message.id}>
            {renderDailyTimestamps(message, index)}
            {renderMessageDivider(message, index)}
            <div
              id={message.id}
              className={[
                clsx(classes.messageContainer, classes.messageLeft, {
                  [classes.messageMediaSticker]: isSticker,
                  [classes.swipeable]: isPhone && canReply
                })
              ]}
              title={message.queueId && message.queue?.name}
              {...replyGestures(message)}
            >
              {readOnly || (
                <IconButton
                  variant="contained"
                  size="small"
                  id={`messageActionsButton-${message.id}`}
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={e => handleOpenMessageOptionsMenu(e, message, data)}
                >
                  <ExpandMore />
                </IconButton>
              )}
              {dataContext?.isForwarded && (
                <span className={classes.forwardedMessage}>
                  <Forward fontSize="small" className={classes.forwardedIcon} />{" "}
                  {i18n.t("message.forwarded")}
                </span>
              )}
              {isGroup && (
                <span
                  className={classes.messageContactName}
                  onClick={() => {
                    window.mentionClick({
                      contactId: message.contact?.id,
                      name: message.contact?.name,
                      number: message.contact?.number
                    });
                  }}
                >
                  {message.contact?.name}
                </span>
              )}

              {message.thumbnailUrl && !message.mediaUrl && (
                <img
                  className={classes.previewThumbnail}
                  src={message.thumbnailUrl}
                />
              )}

              {data?.message?.locationMessage ? (
                messageLocation(data, message.createdAt)
              ) : isVCard(message.body) ? (
                <div
                  className={[
                    clsx(classes.textContentItem, {
                      [classes.textContentItemEdited]: message.isEdited
                    }),
                    { marginRight: 0 }
                  ]}
                >
                  {renderVCard(message.body)}
                </div>
              ) : (
                <div
                  className={[
                    clsx(classes.textContentItem, {
                      [classes.textContentItemDeleted]: message.isDeleted,
                      [classes.textContentItemEdited]: message.isEdited
                    })
                  ]}
                >
                  {message.quotedMsg && renderQuotedMessage(message)}
                  {renderLinkPreview(message)}
                  {!isSticker &&
                    (message.mediaUrl && !data?.message?.extendedTextMessage ? (
                      ""
                    ) : (
                      <>
                        {message.isDeleted && (
                          <Block
                            color="disabled"
                            fontSize="small"
                            className={classes.deletedIcon}
                          />
                        )}
                        <WhatsMarked>{message.body}</WhatsMarked>
                      </>
                    ))}
                  <span
                    className={[
                      clsx(classes.timestamp, {
                        [classes.timestampStickerLeft]: isSticker
                      })
                    ]}
                  >
                    {message.isEdited && (
                      <span> {i18n.t("message.edited")} </span>
                    )}
                    {format(parseISO(message.createdAt), "HH:mm")}
                  </span>
                </div>
              )}
              {message.mediaUrl &&
                !data?.message?.extendedTextMessage &&
                checkMessageMedia(message, data, isSticker)}
              {renderButtons(data?.message)}
              {renderReplies(message.replies, false)}
            </div>
          </React.Fragment>
        );
        if (message.bottomStick) {
          stickedMessages.push(messageFragment);
        }
        return messageFragment;
      } else {
        return (
          <React.Fragment key={message.id}>
            {renderDailyTimestamps(message, index)}
            {renderMessageDivider(message, index)}
            <div
              id={message.id}
              className={[
                clsx(classes.messageContainer, classes.messageRight, {
                  [classes.messageMediaSticker]: isSticker,
                  [classes.swipeable]: isPhone && canReply
                })
              ]}
              title={message.queueId && message.queue?.name}
              {...replyGestures(message)}
            >
              {readOnly || (
                <IconButton
                  variant="contained"
                  size="small"
                  id={`messageActionsButton-${message.id}`}
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={e => handleOpenMessageOptionsMenu(e, message, data)}
                >
                  <ExpandMore />
                </IconButton>
              )}

              {dataContext?.isForwarded && (
                <span className={classes.forwardedMessage}>
                  <Forward fontSize="small" className={classes.forwardedIcon} />{" "}
                  {i18n.t("message.forwarded")}
                </span>
              )}

              {message.thumbnailUrl && !message.mediaUrl && (
                <img
                  className={classes.previewThumbnail}
                  src={message.thumbnailUrl}
                />
              )}

              <div
                className={clsx(classes.textContentItem, {
                  [classes.textContentItemDeleted]: message.isDeleted,
                  [classes.textContentItemEdited]: message.isEdited
                })}
              >
                {message.isDeleted && (
                  <Block
                    color="disabled"
                    fontSize="small"
                    className={classes.deletedIcon}
                  />
                )}

                {data?.message?.locationMessage ? (
                  messageLocation(data, message.createdAt)
                ) : isVCard(message.body) ? (
                  <div className={[classes.textContentItem]}>
                    {renderVCard(message.body)}
                  </div>
                ) : (
                  message.quotedMsg && renderQuotedMessage(message)
                )}
                {renderLinkPreview(message)}
                {!isSticker &&
                  (message.mediaUrl ? (
                    ""
                  ) : (
                    <WhatsMarked>{message.body}</WhatsMarked>
                  ))}
                <span
                  className={[
                    clsx(classes.timestamp, {
                      [classes.timestampStickerRight]: isSticker
                    })
                  ]}
                  style={{ bottom: messageError ? 24 : 0 }}
                >
                  {message.isEdited && (
                    <span> {i18n.t("message.edited")} </span>
                  )}
                  {format(parseISO(message.createdAt), "HH:mm")}
                  {renderMessageAck(message)}
                </span>
              </div>
              {message.mediaUrl && checkMessageMedia(message, data, isSticker)}
              {renderReplies(message.replies, true)}
              {messageError && (
                <div
                  className={classes.messageErrorBand}
                  title={messageError.title}
                >
                  {messageError.code} - {messageError.message}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      }
    });
    return (
      <>
        {viewMessagesList}
        <div
          ref={stickedRef}
          className={classes.stickedMessages}
          style={{ display: stickedMessages.length > 0 ? "flex" : "none" }}
        >
          {stickedMessages}
        </div>
      </>
    );
  };

  return (
    <div className={classes.messagesListWrapper}>
      <MessageOptionsMenu
        message={selectedMessage}
        data={selectedMessageData}
        anchorEl={anchorEl}
        menuOpen={messageOptionsMenuOpen}
        handleClose={handleCloseMessageOptionsMenu}
      />
      <div
        id="messagesList"
        className={classes.messagesList}
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {messagesList.length > 0 ? renderMessages() : []}
        {contactPresence === "composing" && (
          <div className={classes.messageLeft}>
            <div className={classes.wave}>
              <span className={classes.dot}></span>
              <span className={classes.dot}></span>
              <span className={classes.dot}></span>
            </div>
          </div>
        )}
        {contactPresence === "recording" && (
          <div className={classes.messageLeft}>
            <div className={classes.wavebarsContainer}>
              <div className={clsx(classes.wavebars, classes.wavebar1)}></div>
              <div className={clsx(classes.wavebars, classes.wavebar2)}></div>
              <div className={clsx(classes.wavebars, classes.wavebar3)}></div>
              <div className={clsx(classes.wavebars, classes.wavebar4)}></div>
              <div className={clsx(classes.wavebars, classes.wavebar5)}></div>
            </div>
          </div>
        )}
      </div>
      {ticket?.channel !== "whatsapp" ||
        (ticket.channel === undefined && (
          <div
            style={{
              width: "100%",
              display: "flex",
              padding: "10px",
              alignItems: "center",
              backgroundColor: "#E1F3FB"
            }}
          >
            {ticket?.channel === "facebook" ? (
              <Facebook small />
            ) : (
              <Instagram small />
            )}

            <span>
              Você tem 24h para responder após receber uma mensagem, de acordo
              com as políticas do Facebook.
            </span>
          </div>
        ))}
      {loading && (
        <div>
          <BoxLoader className={classes.circleLoading} />
        </div>
      )}
      <MediaGalleryLightbox
        open={lightboxOpen}
        onClose={closeLightbox}
        index={lightboxIndex}
        slides={lightboxMedia.slides}
      />
    </div>
  );
};

export default MessagesList;
