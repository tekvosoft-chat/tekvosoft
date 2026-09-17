import React, {
  useState,
  useEffect,
  useReducer,
  useRef,
  useContext,
  useMemo,
  useCallback,
  useLayoutEffect
} from "react";
import { toast } from "react-toastify";

import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";

import { blue } from "@material-ui/core/colors";
import {
  Avatar,
  Button,
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
import DocumentAnnotator from "../DocumentAnnotator";
import MessageOptionsMenu from "../MessageOptionsMenu";
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
import LocationMessage, { readLocation } from "./LocationMessage";
import ReactionBar from "./ReactionBar";
import {
  CONFIRMED_EVENT,
  FAILED_EVENT,
  PROGRESS_EVENT,
  SENDING_EVENT,
  flyFromComposer,
  matchesPending,
  pendingMessage
} from "./optimisticSend";
import MessageForwardModal from "../MessageForwardModal";
import InsertEmoticonOutlinedIcon from "@material-ui/icons/InsertEmoticonOutlined";
import HistoryRoundedIcon from "@material-ui/icons/HistoryRounded";
import ButtonBase from "@material-ui/core/ButtonBase";
import ReplyRoundedIcon from "@material-ui/icons/ReplyRounded";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import ConfirmDeleteModal from "../ConfirmationModal";
import ShortcutRoundedIcon from "@material-ui/icons/ForwardRounded";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import {
  cachedMessages,
  rememberMessages
} from "../../helpers/conversationCache";

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
    backgroundColor: theme.palette.tkv.chat.wallpaper,
    backgroundImage: theme.palette.tkv.chat.wallpaperImage,
    backgroundSize: theme.palette.tkv.chat.wallpaperSize,
    backgroundBlendMode: theme.palette.tkv.chat.wallpaperBlend,
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
    // papel de parede do tema (Configurações > Aparência): fica parado
    // enquanto as mensagens rolam por cima
    backgroundColor: theme.palette.tkv.chat.wallpaper,
    backgroundImage: theme.palette.tkv.chat.wallpaperImage,
    backgroundSize: theme.palette.tkv.chat.wallpaperSize,
    backgroundPosition: "center bottom",
    backgroundBlendMode: theme.palette.tkv.chat.wallpaperBlend,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: "20px 20px 20px 20px",
    // topo e barra de digitar flutuam por cima (Ticket): a lista começa
    // abaixo de um e termina acima da outra
    paddingTop: "calc(var(--chat-top, 0px) + 20px)",
    paddingBottom: "calc(var(--chat-bottom, 0px) + 20px)",
    scrollPaddingTop: "var(--chat-top, 0px)",
    scrollPaddingBottom: "var(--chat-bottom, 0px)",
    overflowY: "scroll",
    // o gesto de responder move o balão para o lado; a lista não acompanha
    overflowX: "hidden",
    overscrollBehavior: "contain",
    overscrollBehaviorX: "none",
    ...theme.scrollbarStyles,
    [theme.breakpoints.down("xs")]: {
      padding: "10px 8px 12px",
      paddingTop: "calc(var(--chat-top, 0px) + 10px)",
      paddingBottom: "calc(var(--chat-bottom, 0px) + 12px)",
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

  // fotinho do contato ao lado das mensagens recebidas (computador)
  inAvatar: {
    position: "absolute",
    top: 0,
    left: -36,
    width: 26,
    height: 26,
    fontSize: 12,
    fontWeight: 700,
    color: theme.palette.tkv.brand.text,
    backgroundColor: theme.palette.tkv.brand.textSoft,
    boxShadow: "0 1px 3px rgba(12, 10, 20, 0.2)"
  },
  messageLeft: {
    flexShrink: 0,
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: "min(600px, calc(100% - 48px))",
    // computador: espaço à esquerda para a fotinho do contato e, à direita,
    // para rostinho, setinha e encaminhar (numa regra só — duas regras
    // iguais se sobrescreviam e a foto ficava cortada na borda)
    [theme.breakpoints.up("sm")]: {
      marginLeft: 38,
      maxWidth: "min(600px, calc(100% - 150px))"
    },
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover [id^='messageActionsButton']": { display: "flex" },
    "&:hover [data-react-trigger], &:hover [data-forward-trigger]": {
      opacity: 1,
      transform: "scale(1)"
    },

    whiteSpace: "pre-wrap",
    backgroundColor: theme.palette.tkv.chat.bubbleIn,
    color: theme.palette.tkv.chat.text,
    alignSelf: "flex-start",
    // redondo, com o canto do lado de quem fala mais fechado (a "ponta")
    borderRadius: "18px 18px 18px 6px",
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 6,
    paddingBottom: 1,
    boxShadow: theme.palette.tkv.chat.bubbleShadow,
    transition: "background-color 0.5s ease-in-out",
    [theme.breakpoints.down("xs")]: {
      marginRight: 0,
      maxWidth: "86%",
      minWidth: 72
    }
  },

  quotedContainerLeft: {
    margin: "-1px -1px 6px -1px",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    backgroundColor: theme.palette.tkv.chat.quoteIn,
    borderRadius: 12,
    display: "flex",
    position: "relative",
    cursor: "pointer"
  },

  // texto citado: até 3 linhas e quebra palavras longas (links, números)
  quotedMsg: {
    padding: 10,
    width: "100%",
    minWidth: 0,
    height: "auto",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    overflow: "hidden"
  },

  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef"
  },

  quotedThumbnail: {
    flex: "none",
    maxWidth: 72,
    height: 72,
    objectFit: "cover"
  },

  messageRight: {
    flexShrink: 0,
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: "min(600px, 100%)",
    [theme.breakpoints.up("sm")]: {
      maxWidth: "min(600px, calc(100% - 116px))"
    },
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover [id^='messageActionsButton']": { display: "flex" },
    "&:hover [data-forward-trigger]": { opacity: 1, transform: "scale(1)" },
    whiteSpace: "pre-wrap",
    backgroundColor: theme.palette.tkv.chat.bubbleOut,
    backgroundImage: theme.palette.tkv.chat.bubbleOutSheen,
    color: theme.palette.tkv.chat.text,
    alignSelf: "flex-end",
    borderRadius: "18px 18px 6px 18px",
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 6,
    paddingBottom: 1,
    boxShadow: theme.palette.tkv.chat.bubbleShadow,
    transition: "background-color 0.5s ease-in-out",
    [theme.breakpoints.down("xs")]: {
      marginLeft: 0,
      maxWidth: "86%",
      minWidth: 72
    }
  },

  quotedContainerRight: {
    margin: "-1px -1px 6px -1px",
    maxWidth: "100%",
    minWidth: 0,
    overflowY: "hidden",
    backgroundColor: theme.palette.tkv.chat.quoteOut,
    borderRadius: 12,
    display: "flex",
    position: "relative"
  },

  quotedMsgRight: {
    padding: 10,
    minWidth: 0,
    height: "auto",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    overflow: "hidden"
  },

  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96"
  },

  /**
   * Setinha de ações da mensagem (responder, encaminhar…).
   *
   * Agora é um botão redondo com fundo próprio — antes era um ícone cinza
   * "colado" no texto, difícil de ver em cima de foto ou de balão colorido.
   * Ela cresce ao passar o mouse e gira ao abrir o menu.
   */
  messageActionsButton: {
    // no celular não aparece: lá se segura a mensagem para abrir as ações
    "@media (hover: none)": { display: "none !important" },
    [theme.breakpoints.down("xs")]: { display: "none !important" },
    // fica fora do balão, ao lado do rostinho (não cobre mais o horário)
    display: "none",
    position: "absolute",
    top: "50%",
    right: -72,
    width: 28,
    height: 28,
    marginTop: -14,
    padding: 0,
    zIndex: 2,
    color: theme.palette.tkv.chat.icon,
    backgroundColor: theme.palette.tkv.chat.datePill,
    boxShadow: "0 1px 4px rgba(11, 20, 26, 0.22)",
    transition:
      "transform .18s cubic-bezier(.34,1.56,.64,1), background-color .15s",
    "& svg": { fontSize: 18, transition: "transform .2s ease" },
    "&::before": {
      content: '""',
      position: "absolute",
      top: -6,
      bottom: -6,
      left: -8,
      right: -8
    },
    "&:hover, &.Mui-focusVisible": {
      backgroundColor: theme.palette.tkv.chat.datePill,
      transform: "scale(1.12)",
      color: theme.palette.tkv.brand.text
    }
  },
  // minhas mensagens: a setinha fica DENTRO do balão, no canto de cima,
  // sobre um degradê da cor do balão (fora dele o mouse "caía" no vão)
  messageActionsButtonSent: {
    left: "auto",
    right: 4,
    top: 4,
    marginTop: 0,
    width: 26,
    height: 26,
    backgroundColor: theme.palette.tkv.chat.bubbleOut,
    boxShadow: `-8px 0 10px 2px ${theme.palette.tkv.chat.bubbleOut}`,
    "&::before": { display: "none" },
    "&:hover, &.Mui-focusVisible": {
      backgroundColor: theme.palette.tkv.chat.bubbleOut,
      transform: "scale(1.1)"
    }
  },
  // mensagem que está sendo respondida: anel na cor da marca enquanto dura
  replyingTarget: {
    boxShadow: `0 0 0 2px ${theme.palette.tkv.brand.main}, 0 6px 20px -6px ${theme.palette.tkv.brand.main} !important`,
    transition: "box-shadow .2s ease"
  },
  messageActionsButtonOpen: {
    display: "flex !important",
    backgroundColor: theme.palette.tkv.brand.textSoft,
    color: theme.palette.tkv.brand.text,
    "& svg": { transform: "rotate(180deg)" }
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
  gifWrapper: {
    width: "100%",
    borderRadius: 13,
    overflow: "hidden",
    lineHeight: 0,
    marginBottom: 4
  },
  gifMedia: { width: "100%", display: "block", pointerEvents: "none" },
  videoPreviewWrapper: {
    width: "100%",
    maxHeight: 445,
    borderRadius: 13,
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
    height: "auto",
    maxHeight: 440,
    borderRadius: 13,
    display: "block"
  },
  // balão de foto/vídeo: largura própria, no tamanho do WhatsApp Web
  // foto/vídeo sem moldura: a imagem ocupa o balão de ponta a ponta
  bubbleMedia: {
    // CRÍTICO: com overflow escondido, o item da lista (coluna flex) podia
    // ser espremido até altura zero quando a conversa passava da tela — a
    // foto/GIF ficava lá, mas invisível
    flexShrink: 0,
    width: 340,
    maxWidth: "100%",
    padding: "0 !important",
    overflow: "hidden",
    "& $messageMedia": { borderRadius: 0 },
    "& $textContentItem": { padding: "6px 70px 6px 10px" },
    [theme.breakpoints.down("xs")]: { width: "78%", minWidth: 200 }
  },
  // foto/vídeo sem legenda: só a imagem, arredondada, sem balão em volta;
  // o horário fica numa pílula escura por cima da foto
  mediaOnly: {
    backgroundColor: "transparent !important",
    backgroundImage: "none !important",
    boxShadow: "none !important",
    border: "none !important",
    "&::before, &::after": { display: "none" },
    "& $messageMedia": { borderRadius: 14 },
    "& $videoPreviewWrapper": { borderRadius: 14 },
    "& $mediaWrap": {
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 2px 10px -4px rgba(12, 10, 20, 0.35)"
    },
    "& $textContentItem, & $textContentItemDeleted": { display: "none" },
    "& $timestamp": {
      right: 8,
      bottom: 8,
      padding: "1px 8px",
      borderRadius: 999,
      color: "#fff",
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      "& svg": { color: "#fff !important" }
    }
  },
  // 8. encaminhar direto da foto, sempre visível (sem precisar do mouse em cima)
  mediaForward: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    width: 32,
    height: 32,
    color: "#FFFFFF",
    backgroundColor: "rgba(12, 10, 20, 0.45)",
    backdropFilter: "blur(3px)",
    transition: "transform .15s ease, background-color .15s ease",
    "& svg": { fontSize: 18 },
    "&:hover": {
      backgroundColor: "rgba(12, 10, 20, 0.7)",
      transform: "scale(1.08)"
    }
  },
  mediaWrap: { position: "relative", display: "block" },
  mediaCaption: {
    padding: "7px 12px 20px 12px",
    fontSize: "0.9063rem",
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    textAlign: "left"
  },
  uploadRing: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 56,
    height: 56,
    margin: "-28px 0 0 -28px",
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    backgroundColor: "rgba(12, 10, 20, 0.45)",
    backdropFilter: "blur(4px)",
    pointerEvents: "none",
    animation: "$ringIn .25s ease",
    "& svg": { transform: "rotate(-90deg)" }
  },
  uploadRingSmall: {
    top: "auto",
    left: "auto",
    right: 52,
    bottom: 5,
    width: 16,
    height: 16,
    margin: 0,
    backgroundColor: "transparent",
    backdropFilter: "none",
    "& circle": { strokeWidth: 2 },
    "& circle:first-child": {
      stroke: theme.palette.tkv.chat.meta,
      opacity: 0.35
    },
    "& circle:last-child": { stroke: theme.palette.tkv.brand.text }
  },
  uploadRingTrack: {
    fill: "none",
    stroke: "rgba(255,255,255,0.25)",
    strokeWidth: 3
  },
  uploadRingBar: {
    fill: "none",
    stroke: "#fff",
    strokeWidth: 3,
    strokeLinecap: "round",
    transition: "stroke-dashoffset .25s ease"
  },
  "@keyframes ringIn": {
    from: { opacity: 0, transform: "scale(.6)" },
    to: { opacity: 1, transform: "none" }
  },
  // 3. encaminhar: seta fora do balão, aparece ao passar o mouse
  forwardTrigger: {
    position: "absolute",
    top: "50%",
    right: -104,
    width: 30,
    height: 30,
    marginTop: -15,
    padding: 0,
    color: theme.palette.tkv.chat.icon,
    backgroundColor: theme.palette.tkv.chat.datePill,
    boxShadow: "0 1px 3px rgba(11, 20, 26, 0.18)",
    opacity: 0,
    transform: "scale(0.6)",
    transition:
      "opacity .15s ease, transform .2s cubic-bezier(.34, 1.56, .64, 1)",
    "& svg": { fontSize: 18 },
    "&:hover": {
      backgroundColor: theme.palette.tkv.chat.datePill,
      color: theme.palette.tkv.brand.text
    },
    "&::before": {
      content: '""',
      position: "absolute",
      top: -6,
      bottom: -6,
      left: -6,
      right: -6
    }
  },
  forwardTriggerSent: { right: "auto", left: -40 },

  messageMediaClickable: {
    cursor: "pointer"
  },

  messageMediaSticker: {
    backgroundColor: "transparent",
    boxShadow: "none",
    minWidth: 0,
    padding: 0,
    "& $messageMedia": {
      width: 160,
      height: "auto",
      maxWidth: "48vw",
      borderRadius: 0,
      backgroundColor: "transparent",
      display: "block"
    }
  },
  // figurinha enviada respondendo uma mensagem: o balão fica largo por causa
  // da citação e a figurinha ia para a esquerda; encosta no lado de quem enviou
  stickerRight: { "& $messageMedia": { marginLeft: "auto" } },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    // um respiro do canto: colado em 0 o horário passava da borda do balão
    bottom: 3,
    lineHeight: "16px",
    right: 5,
    color: theme.palette.tkv.chat.meta
  },

  timestampStickerLeft: {
    backgroundColor: theme.palette.tkv.chat.bubbleIn,
    borderRadius: 12,
    padding: 5,
    boxShadow:
      theme.mode === "light" ? "0 1px 1px #b3b3b3" : "0 1px 1px #000000"
  },

  timestampStickerRight: {
    backgroundColor: theme.palette.tkv.chat.bubbleOut,
    borderRadius: "12px 12px 4px 12px",
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
  // mídia que ainda não baixou: prévia grande e desfocada, não uma miniatura
  previewThumbnail: {
    display: "block",
    width: 340,
    maxWidth: "100%",
    height: "auto",
    borderRadius: 13,
    filter: "blur(1.5px)"
  },
  audioBottom: {
    marginBottom: "12px"
  },
  /**
   * Reações no desenho do WhatsApp: uma pílula pequena presa na borda de
   * baixo do balão, com o contorno da cor do fundo da conversa (parece
   * "recortada" do balão), emojis agrupados e a contagem quando repete.
   */
  // a pílula fica metade dentro, metade fora da borda de baixo do balão.
  // O espaço reservado aqui é exatamente o que ela cobre: assim não sobra
  // vão nenhum e a mensagem não fica mais alta do que precisa (com 24 a
  // bolha crescia e ficava um buraco embaixo do texto)
  reactionsContainer: {
    display: "block",
    height: 0,
    marginBottom: 10
  },
  reactions: {
    position: "absolute",
    bottom: -10,
    left: 8,
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    maxWidth: "calc(100% - 12px)",
    height: 20,
    padding: "0 6px",
    borderRadius: 10,
    backgroundColor: theme.palette.tkv.chat.bubbleIn,
    border: `2px solid ${theme.palette.tkv.chat.wallpaper}`,
    boxShadow: "0 1px 2px rgba(11, 20, 26, 0.18)",
    cursor: "default",
    whiteSpace: "nowrap",
    // entrada discreta: aparece suave, sem salto
    animation: "$reactionFade .22s ease-out both"
  },
  // sempre no canto de baixo à esquerda: no lado direito ela cobria o
  // horário e os tiquinhos das suas mensagens
  reactionsRight: {},
  reactionEmoji: {
    display: "inline-block",
    fontSize: 13,
    lineHeight: 1
  },
  reactionCount: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: theme.palette.tkv.chat.meta,
    marginLeft: 1
  },
  "@keyframes reactionPop": {
    from: { transform: "scale(0.4) translateY(6px)", opacity: 0 },
    to: { transform: "scale(1)", opacity: 1 }
  },
  "@keyframes reactionFade": {
    from: { opacity: 0, transform: "translateY(3px) scale(0.94)" },
    to: { opacity: 1, transform: "none" }
  },

  historyButton: {
    alignSelf: "center",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    margin: "4px 0 12px",
    padding: "8px 16px",
    borderRadius: 999,
    fontSize: "0.8125rem",
    fontWeight: 700,
    color: theme.palette.tkv.brand.text,
    backgroundColor: theme.palette.tkv.chat.datePill,
    boxShadow: theme.palette.tkv.chat.bubbleShadow,
    animation: "$reactionPop .3s ease both",
    "& svg": { fontSize: 18 }
  },
  ticketBoundary: {
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "18px 0 6px",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: theme.palette.tkv.chat.meta,
    "&::before, &::after": {
      content: '""',
      flex: 1,
      height: 1,
      backgroundColor: theme.palette.tkv.chat.meta,
      opacity: 0.35
    },
    "& span": {
      padding: "4px 12px",
      borderRadius: 999,
      backgroundColor: theme.palette.tkv.chat.datePill,
      boxShadow: theme.palette.tkv.chat.bubbleShadow
    }
  },

  // rostinho ao lado da mensagem recebida (computador)
  reactTrigger: {
    position: "absolute",
    top: "50%",
    right: -40,
    width: 30,
    height: 30,
    marginTop: -15,
    padding: 0,
    color: theme.palette.tkv.chat.icon,
    backgroundColor: theme.palette.tkv.chat.datePill,
    boxShadow: "0 1px 3px rgba(11, 20, 26, 0.18)",
    opacity: 0,
    transform: "scale(0.6)",
    transition:
      "opacity .15s ease, transform .2s cubic-bezier(.34, 1.56, .64, 1)",
    "& svg": { fontSize: 19 },
    "&:hover": {
      backgroundColor: theme.palette.tkv.chat.datePill,
      color: theme.palette.tkv.brand.text
    },
    // ponte invisível entre o balão e o botão, para o mouse não "cair"
    "&::before": {
      content: '""',
      position: "absolute",
      top: -6,
      bottom: -6,
      left: -14,
      right: 0
    }
  },
  reactTriggerOn: { opacity: 1, transform: "scale(1)" },
  // mensagens seguidas da mesma pessoa ficam "coladas": o canto de cima do
  // lado de quem fala também fecha, e o espaço entre elas diminui
  joinedLeft: { borderTopLeftRadius: 6 },
  joinedRight: { borderTopRightRadius: 6 },

  // mensagem que acabou de chegar ou sair entra com um leve "pulo"
  justArrived: {
    animation: "$messageIn .32s cubic-bezier(.34, 1.4, .64, 1) backwards"
  },
  "@keyframes messageIn": {
    from: { opacity: 0, transform: "translateY(10px) scale(.96)" },
    to: { opacity: 1, transform: "none" }
  },
  bubblePressed: {
    transform: "scale(1.03)",
    boxShadow: "0 8px 24px rgba(11, 20, 26, 0.22)",
    transition:
      "transform .2s cubic-bezier(.34, 1.56, .64, 1), box-shadow .2s ease",
    zIndex: 3
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

// a mensagem confirmada herda a chave do balão provisório (sem remontar)
const keepClientKey = (previous, next) => {
  if (previous?.clientKey && next && !next.clientKey) {
    next.clientKey = previous.clientKey;
  }
  return next;
};

const reducer = (state, action) => {
  if (action.type === "ADD_PENDING") {
    return [...state, action.payload];
  }

  if (action.type === "PENDING_PROGRESS") {
    const { id, progress } = action.payload;
    return state.map(m =>
      m.id === id ? { ...m, uploadProgress: progress } : m
    );
  }

  if (action.type === "REMOVE_PENDING") {
    return state.filter(m => m.id !== action.payload);
  }

  if (action.type === "LOAD_MESSAGES") {
    const messages = action.payload;
    const newMessages = [];
    // provisório que já veio confirmado na recarga sai da lista
    state = state.filter(
      m => !m.pending || !messages.some(message => matchesPending(m, message))
    );

    messages.forEach(message => {
      const messageIndex = state.findIndex(m => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = keepClientKey(state[messageIndex], message);
      } else {
        newMessages.push(message);
      }
    });

    // Sempre em ordem de envio. Antes as mensagens que chegavam na recarga
    // iam para o topo da lista: quando a conversa já tinha mensagens na tela
    // (memória ou página anterior), as mais novas sumiam lá em cima.
    return [...newMessages, ...state].sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return diff || String(a.id).localeCompare(String(b.id));
    });
  }

  if (action.type === "ADD_MESSAGE") {
    const newMessage = action.payload;
    const messageIndex = state.findIndex(m => m.id === newMessage.id);
    const pendingIndex =
      messageIndex === -1
        ? state.findIndex(m => matchesPending(m, newMessage))
        : -1;

    if (messageIndex !== -1) {
      state[messageIndex] = keepClientKey(state[messageIndex], newMessage);
    } else if (pendingIndex !== -1) {
      // a confirmação ocupa o lugar do balão que já está na tela
      newMessage.clientKey = state[pendingIndex].clientKey;
      state[pendingIndex] = newMessage;
    } else {
      state.push(newMessage);
    }

    if (newMessage.mediaType === "reactionMessage") {
      const reactionIndex = state.findIndex(
        m => m.id === newMessage.quotedMsgId
      );
      if (reactionIndex !== -1) {
        state[reactionIndex] = {
          ...state[reactionIndex],
          replies: [
            ...(state[reactionIndex].replies || []).filter(
              r => !(r.localReaction && newMessage.fromMe)
            ),
            newMessage
          ]
        };
      }
    }

    return [...state];
  }

  // reação aparece na hora; a confirmação do WhatsApp chega depois
  if (action.type === "LOCAL_REACTION") {
    const { messageId, reply, remove } = action.payload;
    const index = state.findIndex(m => m.id === messageId);
    if (index === -1) return state;
    const replies = (state[index].replies || []).filter(
      r => !remove || r.id !== remove
    );
    state[index] = {
      ...state[index],
      replies: reply ? [...replies, reply] : replies
    };
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
      state[messageIndex] = keepClientKey(state[messageIndex], messageToUpdate);
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

/**
 * Figurinha (sticker) x imagem.
 *
 * A figurinha chega como imagem webp, e a marca de que é figurinha pode vir
 * embrulhada (mensagem efêmera, "ver uma vez", encaminhada). Aqui a busca é
 * em profundidade e, na falta da marca, o próprio arquivo .webp resolve —
 * assim ela aparece solta no fundo, sem balão, como no WhatsApp.
 */
/**
 * Foto da conversa com lugar reservado enquanto carrega e aviso visível se
 * não carregar (antes a foto quebrada ficava invisível no balão sem fundo).
 * Tenta de novo sozinha algumas vezes: logo depois do envio o arquivo pode
 * ainda não estar disponível no servidor.
 */
const ChatImage = ({ src, className, onClick }) => {
  const [attempt, setAttempt] = React.useState(0);
  const [state, setState] = React.useState("loading");
  React.useEffect(() => {
    setAttempt(0);
    setState("loading");
  }, [src]);
  const url =
    attempt && src ? `${src}${src.includes("?") ? "&" : "?"}r=${attempt}` : src;
  if (!src || state === "error") {
    return (
      <a
        href={src || undefined}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: 120,
          padding: 16,
          borderRadius: 14,
          fontSize: 13,
          color: "inherit",
          textDecoration: "none",
          background: "rgba(127,127,127,0.15)"
        }}
        onClick={e => {
          if (!src) return;
          e.preventDefault();
          setAttempt(a => a + 1);
          setState("loading");
        }}
      >
        🖼️ Não foi possível carregar a imagem · toque para tentar de novo
      </a>
    );
  }
  return (
    <img
      key={url}
      className={className}
      src={url}
      alt="midia da mensagem"
      onClick={onClick}
      onLoad={() => setState("ok")}
      onError={() => {
        // eslint-disable-next-line no-console
        console.warn("[chat] imagem não carregou:", url);
        if (attempt < 3) {
          setTimeout(() => setAttempt(a => a + 1), 1500 * (attempt + 1));
        } else {
          setState("error");
        }
      }}
      style={
        state === "loading"
          ? { minHeight: 160, background: "rgba(127,127,127,0.15)" }
          : undefined
      }
    />
  );
};

/** GIF em loop, com lugar reservado e nova tentativa se não carregar. */
const ChatGif = ({ src, className }) => {
  const [attempt, setAttempt] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  const url =
    attempt && src ? `${src}${src.includes("?") ? "&" : "?"}r=${attempt}` : src;
  if (!src || failed) {
    return (
      <a
        href={src || undefined}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
          padding: 16,
          borderRadius: 14,
          fontSize: 13,
          color: "inherit",
          textDecoration: "none",
          background: "rgba(127,127,127,0.15)"
        }}
        onClick={e => {
          if (!src) return;
          e.preventDefault();
          setFailed(false);
          setAttempt(a => a + 1);
        }}
      >
        👾 GIF não carregou · toque para tentar de novo
      </a>
    );
  }
  return (
    <video
      key={url}
      className={className}
      src={url}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      style={{ minHeight: 80, background: "rgba(127,127,127,0.12)" }}
      onError={() => {
        // eslint-disable-next-line no-console
        console.warn("[chat] gif não carregou:", url);
        if (attempt < 3) {
          setTimeout(() => setAttempt(a => a + 1), 1500 * (attempt + 1));
        } else {
          setFailed(true);
        }
      }}
    />
  );
};

// corpo de mídia que é só o nome do arquivo (não é legenda de verdade)
const isFileName = text =>
  /^[^\s]+\.[a-z0-9]{2,5}$/i.test(String(text || "").trim());

const detectSticker = (message, data) => {
  const find = (node, depth = 0) => {
    if (!node || typeof node !== "object" || depth > 5) return false;
    if ("stickerMessage" in node) return true;
    return Object.values(node).some(value => find(value, depth + 1));
  };
  if (find(data?.message)) return true;
  return (
    message?.mediaType === "image" &&
    /\.webp($|\?)/i.test(message.mediaUrl || "")
  );
};

const MessagesList = ({ ticket, ticketId, isGroup, markAsRead, readOnly }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const replyContext = useContext(ReplyMessageContext);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const canReply = !readOnly && !!replyContext?.setReplyingMessage;
  const swipeRef = useRef(null);

  // barra de reações: {message, data, anchor, align, phone, el}
  const [reactTarget, setReactTarget] = useState(null);
  const [forwarding, setForwarding] = useState(null);
  const [annotating, setAnnotating] = useState(null);
  const longPressRef = useRef({ timer: null, fired: false });

  const closeReactions = useCallback(() => setReactTarget(null), []);

  const sendReaction = (message, emoji) => {
    const localId = `local-reaction-${Date.now()}`;
    dispatch({
      type: "LOCAL_REACTION",
      payload: {
        messageId: message.id,
        reply: {
          id: localId,
          localReaction: true,
          mediaType: "reactionMessage",
          fromMe: true,
          body: emoji,
          createdAt: new Date().toISOString()
        }
      }
    });
    api
      .post(`/messages/react/${message.id}`, {
        ticketId: message.ticketId,
        emoji
      })
      .catch(err => {
        dispatch({
          type: "LOCAL_REACTION",
          payload: { messageId: message.id, remove: localId }
        });
        toastError(err);
      });
  };

  // reações em ordem de envio: a mais recente de cada pessoa é a que vale
  const sortedReplies = replies =>
    [...(replies || [])].sort(
      (a, b) =>
        new Date(a?.createdAt || 0).getTime() -
        new Date(b?.createdAt || 0).getTime()
    );

  // a última reação minha nesta mensagem (para marcar na barra)
  const myReaction = message => {
    const mine = sortedReplies(message?.replies).filter(
      r => r?.mediaType === "reactionMessage" && r.fromMe
    );
    return mine.length ? mine[mine.length - 1].body || null : null;
  };

  const openReactions = (message, data, bubble, phone) => {
    if (!bubble) return;
    const rect = bubble.getBoundingClientRect();
    setReactTarget({
      message,
      data,
      phone,
      el: bubble,
      align: message.fromMe ? "right" : "left",
      anchor: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      }
    });
  };

  // duplo clique na linha (fora do balão) também responde à mensagem dela
  const handleRowDoubleClick = e => {
    if (isPhone || !canReply) return;
    if (
      e.target.closest?.(
        "[data-bubble], a, button, img, video, audio, input, textarea, [role=button]"
      )
    ) {
      return;
    }
    const y = e.clientY;
    const bubble = Array.from(
      e.currentTarget.querySelectorAll("[data-bubble]")
    ).find(el => {
      const rect = el.getBoundingClientRect();
      return y >= rect.top - 4 && y <= rect.bottom + 4;
    });
    if (!bubble) return;
    const message = messagesListRef.current.find(
      m => String(m.id) === bubble.id
    );
    if (!message) return;
    window.getSelection?.()?.removeAllRanges();
    replyTo(message, bubble);
  };

  const replyTo = (message, element) => {
    replyContext.setReplyingMessage(message);
    // "pulinho" no balão escolhido: fica claro qual mensagem foi selecionada
    element?.animate?.(
      [
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.035)", filter: "brightness(0.9)", offset: 0.35 },
        { transform: "scale(0.99)", offset: 0.7 },
        { transform: "scale(1)", filter: "brightness(1)" }
      ],
      { duration: 520, easing: "cubic-bezier(.3, 1.4, .5, 1)" }
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
  const cancelLongPress = () => {
    clearTimeout(longPressRef.current.timer);
    longPressRef.current.timer = null;
  };

  const replyGestures = (message, data) => {
    if (!canReply || message.isDeleted || message.pending) return {};
    return {
      "data-bubble": "1",
      onContextMenu: e => {
        if (isPhone) e.preventDefault();
      },
      onTouchStart: e => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        // segurar a mensagem abre as reações (celular)
        const bubble = e.currentTarget;
        cancelLongPress();
        longPressRef.current.fired = false;
        longPressRef.current.timer = setTimeout(() => {
          longPressRef.current.timer = null;
          longPressRef.current.fired = true;
          swipeRef.current = null;
          if (navigator.vibrate) navigator.vibrate(14);
          window.getSelection?.()?.removeAllRanges();
          openReactions(message, data, bubble, true);
        }, 430);
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
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) cancelLongPress();
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
      onTouchEnd: e => {
        cancelLongPress();
        if (longPressRef.current.fired) {
          // o toque que abriu as reações não vira clique (abrir foto etc.)
          longPressRef.current.fired = false;
          e.preventDefault();
          return;
        }
        finishSwipe(message);
      },
      onTouchCancel: () => {
        cancelLongPress();
        finishSwipe(null);
      },
      onDoubleClick: e => {
        if (isPhone) return;
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

  // histórico dos atendimentos anteriores do contato (carregado sob pedido)
  const EMPTY_HISTORY = {
    items: [],
    tickets: 0,
    nextBefore: null,
    hasMore: false,
    loading: false,
    loaded: false
  };
  const [history, setHistory] = useState(EMPTY_HISTORY);
  const historyAnchorRef = useRef(null);

  useEffect(() => {
    setHistory(EMPTY_HISTORY);
    if (!ticketId) return undefined;
    let alive = true;
    api
      .get(`/messages/${ticketId}/previous`, { params: { peek: true } })
      .then(
        ({ data }) =>
          alive && setHistory(h => ({ ...h, tickets: data?.tickets || 0 }))
      )
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const loadHistory = async () => {
    if (history.loading) return;
    const el = scrollRef.current;
    historyAnchorRef.current = el ? el.scrollHeight - el.scrollTop : null;
    setHistory(h => ({ ...h, loading: true }));
    try {
      const { data } = await api.get(`/messages/${ticketId}/previous`, {
        params: { before: history.nextBefore || undefined }
      });
      if (currentTicketId.current !== ticketId) return;
      setHistory(h => ({
        ...h,
        items: [...(data.messages || []), ...h.items],
        nextBefore: data.nextBefore,
        hasMore: !!data.hasMore,
        loading: false,
        loaded: true
      }));
      if (!data.messages?.length) {
        toast.info(i18n.t("messagesList.history.none"), { autoClose: 1800 });
      }
    } catch (err) {
      setHistory(h => ({ ...h, loading: false }));
      toastError(err);
    }
  };

  // mantém a posição de leitura quando o histórico entra por cima
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && historyAnchorRef.current !== null) {
      el.scrollTop = el.scrollHeight - historyAnchorRef.current;
      historyAnchorRef.current = null;
    }
  }, [history.items]);

  useEffect(() => {
    if (ticketId && messagesList.length)
      rememberMessages(
        ticketId,
        messagesList.filter(m => !m.pending)
      );
  }, [messagesList, ticketId]);

  function loadData(incrementPage = false) {
    if (incrementPage && !nextId) {
      return;
    }

    // com mensagens guardadas desta conversa, não mostra o carregando
    if (incrementPage || !cachedMessages(ticketId)) setLoading(true);
    const thisNextId = incrementPage ? nextId : undefined;
    const delayDebounceFn = setTimeout(
      () => {
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
        // primeira página na hora; só a rolagem para cima espera um pouco
      },
      incrementPage ? 300 : 0
    );
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }

  // Voltou para o app depois de um tempo: recarrega a conversa aberta. No
  // celular o navegador pausa a conexão em segundo plano e mensagens que
  // chegaram nesse meio tempo não apareciam.
  const reloadLatestRef = useRef(null);
  reloadLatestRef.current = () => {
    if (ticketId) loadData();
  };
  // reconectou (ou o servidor reiniciou): entra de novo na sala do
  // atendimento e busca o que chegou enquanto estávamos fora
  useEffect(() => {
    if (!ticketId) return undefined;
    const socket = socketManager.GetSocket();
    const onReady = () => {
      socket.emit("joinChatBox", `${ticketId}`);
      reloadLatestRef.current?.();
    };
    const unsubscribe = socketManager.onEveryReady?.(onReady);
    return () => {
      unsubscribe?.();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, socketManager]);

  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > 2000) {
        reloadLatestRef.current?.();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onVisibility);
    };
  }, []);

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

    const cached = cachedMessages(ticketId);
    if (cached) {
      dispatch({ type: "LOAD_MESSAGES", payload: cached });
      setLoading(false);
      scrollToBottom();
    }

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

    let connectedOnce = false;
    const onConnect = () => {
      socket.emit("joinChatBox", `${ticket.id}`);
      // reconectou (rede caiu, app voltou do fundo): busca o que chegou
      if (connectedOnce) reloadLatestRef.current?.();
      connectedOnce = true;
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

  // envio: o balão provisório entra na hora e desliza da barra até aqui
  const flightRef = useRef(null);
  useEffect(() => {
    const timers = [];
    const onSending = event => {
      const detail = event.detail || {};
      if (!detail.id || detail.ticketId !== currentTicketId.current) return;
      flightRef.current = { id: detail.id, from: detail.from };
      dispatch({ type: "ADD_PENDING", payload: pendingMessage(detail) });
      // sem confirmação em 25 s, o provisório sai (a real chega pela recarga);
      // mídia pesada demora mais para subir
      timers.push(
        setTimeout(
          () => dispatch({ type: "REMOVE_PENDING", payload: detail.id }),
          detail.media ? 180000 : 25000
        )
      );
    };
    const onProgress = event =>
      dispatch({ type: "PENDING_PROGRESS", payload: event.detail || {} });
    // enviado com sucesso: se o aviso em tempo real não trouxe a mensagem
    // (conexão oscilou, aba em segundo plano…), busca a conversa de novo e a
    // recarga troca o provisório pela mensagem real
    const onConfirmed = event => {
      const id = event.detail?.id;
      if (!id) return;
      dispatch({ type: "PENDING_PROGRESS", payload: { id, progress: 100 } });
      timers.push(
        setTimeout(async () => {
          const stillPending = messagesListRef.current.some(m => m.id === id);
          const ticket = currentTicketId.current;
          if (!stillPending || !ticket) return;
          try {
            const { data } = await api.get(`/messages/${ticket}`);
            if (currentTicketId.current !== ticket) return;
            dispatch({ type: "LOAD_MESSAGES", payload: data.messages || [] });
          } catch (err) {
            // tenta de novo na próxima atualização da conversa
          }
        }, 2500)
      );
    };
    const onFailed = event =>
      dispatch({ type: "REMOVE_PENDING", payload: event.detail?.id });
    window.addEventListener(SENDING_EVENT, onSending);
    window.addEventListener(FAILED_EVENT, onFailed);
    window.addEventListener(PROGRESS_EVENT, onProgress);
    window.addEventListener(CONFIRMED_EVENT, onConfirmed);
    return () => {
      window.removeEventListener(CONFIRMED_EVENT, onConfirmed);
      window.removeEventListener(PROGRESS_EVENT, onProgress);
      window.removeEventListener(SENDING_EVENT, onSending);
      window.removeEventListener(FAILED_EVENT, onFailed);
      timers.forEach(clearTimeout);
    };
  }, []);

  useLayoutEffect(() => {
    const flight = flightRef.current;
    if (!flight) return;
    const element = document.getElementById(flight.id);
    if (!element) return;
    flightRef.current = null;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    flyFromComposer(element, flight.from);
  }, [messagesList]);

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
    // a barra de reações fica presa à posição da mensagem: rolou, fecha
    if (reactTarget) closeReactions();
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

  // anel de envio sobre a foto/vídeo que ainda está subindo
  const renderUploadRing = message => {
    const progress = Math.max(4, Math.min(100, message.uploadProgress || 0));
    // áudio: só um anelzinho discreto no canto, sem cobrir o player
    const small = message.mediaType === "audio";
    const size = small ? 16 : 48;
    const r = small ? 6 : 18;
    const c = 2 * Math.PI * r;
    return (
      <div
        className={`${classes.uploadRing}${small ? ` ${classes.uploadRingSmall}` : ""}`}
        aria-label={`${progress}%`}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            className={classes.uploadRingTrack}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            className={classes.uploadRingBar}
            strokeDasharray={c}
            strokeDashoffset={c - (progress / 100) * c}
          />
        </svg>
      </div>
    );
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
          <div className={classes.mediaWrap}>
            <ChatImage
              className={clsx(
                classes.messageMedia,
                classes.messageMediaClickable,
                {
                  [classes.messageMediaDeleted]: message.isDeleted
                }
              )}
              src={message.mediaUrl}
              onClick={() => openLightboxForMessage(message.id)}
            />
          </div>
          {/* legenda da foto: com respiro dos lados e embaixo (o horário
              fica no canto e não come o texto) */}
          {message.body && !isFileName(message.body) && (
            <div
              className={clsx(classes.mediaCaption, {
                [classes.textContentItemDeleted]: message.isDeleted
              })}
            >
              <WhatsMarked>{message.body}</WhatsMarked>
            </div>
          )}
        </>
      );
    }
    if (!document && message.mediaType === "audio") {
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

    // GIF do WhatsApp chega como vídeo; em conversa temporária ou de
    // visualização única ele vem embrulhado — desembrulha antes de checar
    const inner =
      data?.message?.deviceSentMessage?.message ||
      data?.message?.ephemeralMessage?.message ||
      data?.message?.viewOnceMessage?.message ||
      data?.message?.viewOnceMessageV2?.message ||
      data?.message;
    const isGif =
      message.mediaType === "video" &&
      (!!inner?.videoMessage?.gifPlayback ||
        /\/gif-[^/]*\.mp4/i.test(message.mediaUrl || ""));
    if (isGif) {
      return (
        <div
          className={clsx(classes.gifWrapper, {
            [classes.messageMediaDeleted]: message.isDeleted
          })}
        >
          <ChatGif className={classes.gifMedia} src={message.mediaUrl} />
        </div>
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
            <PdfPreview
              url={message.mediaUrl}
              fileName={fileName}
              ticketId={readOnly ? undefined : ticketId}
            />
          )}
          {!isPdf && (
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
          )}
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

  const timeline = history.items.length
    ? [...history.items, ...messagesList]
    : messagesList;

  // aviso entre um atendimento e outro, dentro do histórico
  const renderTicketBoundary = (message, index) => {
    if (!history.items.length || index === 0) return null;
    const previous = timeline[index - 1];
    if (!previous || previous.ticketId === message.ticketId) return null;
    const current = message.ticketId === ticket?.id;
    return (
      <div className={classes.ticketBoundary} key={`boundary-${message.id}`}>
        <span>
          {current
            ? i18n.t("messagesList.history.current")
            : i18n.t("messagesList.history.ticket", { id: message.ticketId })}
        </span>
      </div>
    );
  };

  const renderDailyTimestamps = (message, index) => {
    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`timestamp-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            {format(parseISO(timeline[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
      );
    }
    if (index < timeline.length) {
      let messageDay = parseISO(timeline[index].createdAt);
      let previousMessageDay = parseISO(timeline[index - 1].createdAt);

      if (!isSameDay(messageDay, previousMessageDay)) {
        return (
          <span
            className={classes.dailyTimestamp}
            key={`timestamp-${message.id}`}
          >
            <div className={classes.dailyTimestampText}>
              {format(parseISO(timeline[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
        );
      }
    }
  };

  const renderMessageDivider = (message, index) => {
    if (index < timeline.length && index > 0) {
      let messageUser = timeline[index].fromMe;
      let previousMessageUser = timeline[index - 1].fromMe;

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
    // cada pessoa tem uma reação só: vale a última (vazia = tirou a reação)
    const byPerson = new Map();
    sortedReplies(replies).forEach(reply => {
      if (reply?.mediaType !== "reactionMessage") return;
      const who = reply.fromMe
        ? "me"
        : `c${reply.contactId || reply.contact?.id || reply.participant || reply.id}`;
      byPerson.set(who, reply);
    });
    const reactions = [...byPerson.values()].filter(reply => reply.body);
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

  // posição mais recente enviada ao vivo nesta conversa (o mapa acompanha)
  const latestLiveLocation = (() => {
    for (let i = messagesList.length - 1; i >= 0; i -= 1) {
      const m = messagesList[i];
      if (m.fromMe || !m.dataJson || !m.dataJson.includes("liveLocation"))
        continue;
      try {
        const loc = readLocation(JSON.parse(m.dataJson));
        if (loc?.live) return loc;
      } catch (e) {
        // mensagem sem JSON válido
      }
    }
    return null;
  })();

  const messageLocation = (data, message) => (
    <LocationMessage
      data={data}
      latest={message?.fromMe ? null : latestLiveLocation}
      contactName={ticket?.contact?.name}
    />
  );

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
    const viewMessagesList = timeline.map((message, index) => {
      if (message.mediaType === "reactionMessage") {
        return;
      }

      let previous = null;
      for (let i = index - 1; i >= 0; i -= 1) {
        if (timeline[i].mediaType !== "reactionMessage") {
          previous = timeline[i];
          break;
        }
      }
      const joined =
        !!previous &&
        previous.fromMe === message.fromMe &&
        previous.ticketId === message.ticketId &&
        isSameDay(parseISO(previous.createdAt), parseISO(message.createdAt));

      const data = JSON.parse(message.dataJson);
      const dataContext = getDataContextInfo(data);
      const messageError = getMessageErrorData(message);
      const isSticker = detectSticker(message, data);
      if (!message.fromMe) {
        const messageFragment = (
          <React.Fragment key={message.clientKey || message.id}>
            {renderTicketBoundary(message, index)}
            {renderDailyTimestamps(message, index)}
            {renderMessageDivider(message, index)}
            <div
              id={message.id}
              className={[
                clsx(classes.messageContainer, classes.messageLeft, {
                  [classes.joinedLeft]: joined && !isSticker,
                  [classes.bubbleMedia]:
                    !isSticker &&
                    !!message.mediaUrl &&
                    ["image", "video"].includes(message.mediaType),
                  [classes.mediaOnly]:
                    !isSticker &&
                    !!message.mediaUrl &&
                    ["image", "video"].includes(message.mediaType) &&
                    (!String(message.body || "").trim() ||
                      isFileName(message.body)),
                  [classes.messageMediaSticker]: isSticker,
                  [classes.swipeable]: isPhone && canReply,
                  [classes.bubblePressed]:
                    reactTarget?.phone && reactTarget.message.id === message.id,
                  [classes.replyingTarget]:
                    replyContext?.replyingMessage?.id === message.id,
                  [classes.justArrived]:
                    !message.clientKey &&
                    Date.now() - new Date(message.createdAt).getTime() < 6000
                })
              ]}
              title={message.queueId && message.queue?.name}
              {...replyGestures(message, data)}
            >
              {/* computador: fotinho de quem mandou, na primeira da sequência */}
              {!isPhone && (
                <Avatar
                  className={classes.inAvatar}
                  src={
                    (isGroup
                      ? message.contact?.profilePicUrl
                      : ticket?.contact?.profilePicUrl) || undefined
                  }
                  style={{ visibility: joined ? "hidden" : "visible" }}
                >
                  {(
                    (isGroup ? message.contact?.name : ticket?.contact?.name) ||
                    "?"
                  )
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </Avatar>
              )}
              {readOnly || message.pending || (
                <IconButton
                  variant="contained"
                  size="small"
                  id={`messageActionsButton-${message.id}`}
                  disabled={message.isDeleted}
                  className={clsx(classes.messageActionsButton, {
                    [classes.messageActionsButtonSent]: message.fromMe,
                    [classes.messageActionsButtonOpen]:
                      selectedMessage?.id === message.id &&
                      messageOptionsMenuOpen
                  })}
                  onClick={e => handleOpenMessageOptionsMenu(e, message, data)}
                >
                  <ExpandMore />
                </IconButton>
              )}
              {!readOnly &&
                !isPhone &&
                !message.isDeleted &&
                message.mediaUrl && (
                  <IconButton
                    size="small"
                    data-forward-trigger="1"
                    aria-label={i18n.t("messageOptionsMenu.forward")}
                    className={clsx(classes.forwardTrigger, {
                      [classes.forwardTriggerSent]: message.fromMe
                    })}
                    onClick={() => setForwarding(message)}
                  >
                    <ShortcutRoundedIcon />
                  </IconButton>
                )}

              {!readOnly && !isPhone && !message.isDeleted && (
                <IconButton
                  size="small"
                  data-react-trigger="1"
                  aria-label={i18n.t("messagesList.reactions.react")}
                  className={clsx(classes.reactTrigger, {
                    [classes.reactTriggerOn]:
                      reactTarget?.message?.id === message.id
                  })}
                  onClick={e =>
                    openReactions(
                      message,
                      data,
                      e.currentTarget.parentElement,
                      false
                    )
                  }
                >
                  <InsertEmoticonOutlinedIcon />
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

              {data?.message?.locationMessage ||
              data?.message?.liveLocationMessage ? (
                messageLocation(data, message)
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
                    !data?.message?.locationMessage &&
                    !data?.message?.liveLocationMessage &&
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
          <React.Fragment key={message.clientKey || message.id}>
            {renderTicketBoundary(message, index)}
            {renderDailyTimestamps(message, index)}
            {renderMessageDivider(message, index)}
            <div
              id={message.id}
              className={[
                clsx(classes.messageContainer, classes.messageRight, {
                  [classes.joinedRight]: joined && !isSticker,
                  [classes.bubbleMedia]:
                    !isSticker &&
                    !!message.mediaUrl &&
                    ["image", "video"].includes(message.mediaType),
                  [classes.mediaOnly]:
                    !isSticker &&
                    !!message.mediaUrl &&
                    ["image", "video"].includes(message.mediaType) &&
                    (!String(message.body || "").trim() ||
                      isFileName(message.body)),
                  [classes.messageMediaSticker]: isSticker,
                  [classes.stickerRight]: isSticker,
                  [classes.swipeable]: isPhone && canReply,
                  [classes.bubblePressed]:
                    reactTarget?.phone && reactTarget.message.id === message.id,
                  [classes.replyingTarget]:
                    replyContext?.replyingMessage?.id === message.id,
                  [classes.justArrived]:
                    !message.clientKey &&
                    Date.now() - new Date(message.createdAt).getTime() < 6000
                })
              ]}
              title={message.queueId && message.queue?.name}
              {...replyGestures(message, data)}
            >
              {readOnly || message.pending || (
                <IconButton
                  variant="contained"
                  size="small"
                  id={`messageActionsButton-${message.id}`}
                  disabled={message.isDeleted}
                  className={clsx(classes.messageActionsButton, {
                    [classes.messageActionsButtonSent]: message.fromMe,
                    [classes.messageActionsButtonOpen]:
                      selectedMessage?.id === message.id &&
                      messageOptionsMenuOpen
                  })}
                  onClick={e => handleOpenMessageOptionsMenu(e, message, data)}
                >
                  <ExpandMore />
                </IconButton>
              )}
              {!readOnly &&
                !isPhone &&
                !message.isDeleted &&
                message.mediaUrl && (
                  <IconButton
                    size="small"
                    data-forward-trigger="1"
                    aria-label={i18n.t("messageOptionsMenu.forward")}
                    className={clsx(classes.forwardTrigger, {
                      [classes.forwardTriggerSent]: message.fromMe
                    })}
                    onClick={() => setForwarding(message)}
                  >
                    <ShortcutRoundedIcon />
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

                {data?.message?.locationMessage ||
                data?.message?.liveLocationMessage ? (
                  messageLocation(data, message)
                ) : isVCard(message.body) ? (
                  <div className={[classes.textContentItem]}>
                    {renderVCard(message.body)}
                  </div>
                ) : (
                  message.quotedMsg && renderQuotedMessage(message)
                )}
                {renderLinkPreview(message)}
                {!isSticker &&
                  !data?.message?.locationMessage &&
                  !data?.message?.liveLocationMessage &&
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
              {message.pending && message.mediaUrl && renderUploadRing(message)}
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
      <ConfirmDeleteModal
        title={i18n.t("messageOptionsMenu.confirmationModal.title")}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target) api.delete(`/messages/${target.id}`).catch(toastError);
        }}
      >
        {i18n.t("messageOptionsMenu.confirmationModal.message")}
      </ConfirmDeleteModal>
      <ReactionBar
        open={!!reactTarget}
        anchor={reactTarget?.anchor}
        align={reactTarget?.align}
        dim={!!reactTarget?.phone}
        current={myReaction(reactTarget?.message)}
        onClose={closeReactions}
        onPick={emoji =>
          reactTarget && sendReaction(reactTarget.message, emoji)
        }
        actions={
          reactTarget?.phone
            ? [
                canReply && {
                  key: "reply",
                  label: i18n.t("messageOptionsMenu.reply"),
                  icon: <ReplyRoundedIcon />,
                  onClick: () => replyTo(reactTarget.message, reactTarget.el)
                },
                reactTarget.message.body &&
                  !reactTarget.message.mediaUrl && {
                    key: "copy",
                    label: i18n.t("messagesList.reactions.copy"),
                    icon: <FileCopyOutlinedIcon />,
                    onClick: () =>
                      navigator.clipboard
                        ?.writeText(reactTarget.message.body)
                        .then(() =>
                          toast.success(
                            i18n.t("messagesList.reactions.copied"),
                            {
                              autoClose: 1200
                            }
                          )
                        )
                        .catch(() => {})
                  },
                {
                  key: "forward",
                  label: i18n.t("messageOptionsMenu.forward"),
                  icon: <ShortcutRoundedIcon />,
                  onClick: () => setForwarding(reactTarget.message)
                },
                reactTarget.message.fromMe &&
                  !reactTarget.message.isDeleted && {
                    key: "delete",
                    danger: true,
                    label: i18n.t("messageOptionsMenu.delete"),
                    icon: <DeleteOutlineRoundedIcon />,
                    onClick: () => setDeleteTarget(reactTarget.message)
                  }
              ].filter(Boolean)
            : reactTarget?.message?.fromMe && !reactTarget.message.isDeleted
              ? [
                  {
                    key: "delete",
                    danger: true,
                    label: i18n.t("messageOptionsMenu.delete"),
                    icon: <DeleteOutlineRoundedIcon />,
                    onClick: () => setDeleteTarget(reactTarget.message)
                  }
                ]
              : []
        }
      />
      {forwarding && (
        <MessageForwardModal
          modalOpen={!!forwarding}
          onClose={() => setForwarding(null)}
          ticketId={forwarding.ticketId}
          messageId={forwarding.id}
          message={forwarding}
        />
      )}
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
        onDoubleClick={handleRowDoubleClick}
        ref={scrollRef}
      >
        {!hasMore &&
          !loading &&
          messagesList.length > 0 &&
          (history.loaded ? history.hasMore : history.tickets > 0) && (
            <ButtonBase
              className={classes.historyButton}
              onClick={loadHistory}
              disabled={history.loading}
            >
              {history.loading ? (
                <BoxLoader size={18} color="currentColor" />
              ) : (
                <HistoryRoundedIcon />
              )}
              {history.loaded
                ? i18n.t("messagesList.history.more")
                : i18n.t("messagesList.history.load")}
            </ButtonBase>
          )}
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
        onAnnotate={slide => {
          closeLightbox();
          setAnnotating({
            src: slide.src,
            name: slide.download?.filename
          });
        }}
      />
      {annotating && (
        <DocumentAnnotator
          open={!!annotating}
          onClose={() => setAnnotating(null)}
          src={annotating.src}
          type="image"
          fileName={annotating.name}
          ticketId={readOnly ? undefined : ticketId}
        />
      )}
    </div>
  );
};

export default MessagesList;
