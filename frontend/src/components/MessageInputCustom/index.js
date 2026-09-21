import React, { useState, useEffect, useContext, useRef } from "react";
import withWidth from "@material-ui/core/withWidth";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import { emojiMartI18n } from "../../helpers/emojiMartI18n";
import MicRecorder from "mic-recorder-to-mp3";
import clsx from "clsx";

import {
  Code,
  FormatListNumbered,
  FormatListBulleted,
  FormatQuote
} from "@material-ui/icons";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import IconButton from "@material-ui/core/IconButton";
import MoodIcon from "@material-ui/icons/Mood";
import SendIcon from "@material-ui/icons/Send";
import ClearIcon from "@material-ui/icons/Clear";
import MicIcon from "@material-ui/icons/Mic";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import CameraAltIcon from "@material-ui/icons/CameraAlt";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import PhotoCameraOutlinedIcon from "@material-ui/icons/PhotoCameraOutlined";
import FlashOnRoundedIcon from "@material-ui/icons/FlashOnRounded";
import SendRoundedIcon from "@material-ui/icons/SendRounded";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { Tooltip, InputAdornment, Typography, Popper } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { isString, isEmpty, isObject, has } from "lodash";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import RecordingTimer from "./RecordingTimer";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import toastError from "../../errors/toastError";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";

import useQuickMessages from "../../hooks/useQuickMessages";

import Compressor from "compressorjs";
import WhatsMarked from "react-whatsmarked";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignature } from "@fortawesome/free-solid-svg-icons";
import { isMobile } from "../../helpers/isMobile";
import MediaPreview from "../ui/MediaPreview";
import { AttachPanel, RecordingPanel } from "./PhoneComposer";
import QuickRepliesModal from "../QuickRepliesModal";
import ExpressionPanel from "./ExpressionPanel";
import { overlayOpen } from "../../helpers/escapeKey";
import {
  announceFailed,
  announceConfirmed,
  announceProgress,
  announceSending
} from "../MessagesList/optimisticSend";
import Popover from "@material-ui/core/Popover";
import Collapse from "@material-ui/core/Collapse";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import InsertEmoticonRoundedIcon from "@material-ui/icons/InsertEmoticonRounded";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import PhotoLibraryOutlinedIcon from "@material-ui/icons/PhotoLibraryOutlined";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";
import RoomOutlinedIcon from "@material-ui/icons/RoomOutlined";
import { SendLocationDialog } from "../MessagesList/LocationMessage";
import { SocketContext } from "../../context/Socket/SocketContext";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const useStyles = makeStyles(theme => ({
  /**
   * Barra de digitação no desenho do WhatsApp: faixa cinza clara, campo em
   * pílula branca sem borda e o botão principal redondo e verde, que vira
   * enviar quando há texto e microfone quando não há. É o mesmo arranjo que
   * a pessoa do outro lado usa, então ninguém precisa procurar onde clicar.
   */
  mainWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: "none",
    backgroundColor: theme.palette.tkv.chat.bar,
    borderTop: "none",
    // aparelhos sem botão físico: a barra não fica atrás da faixa de gestos
    paddingBottom: "var(--safe-bottom, 0px)"
  },

  newMessageBox: {
    width: "100%",
    display: "flex",
    gap: 2,
    padding: "6px 8px",
    alignItems: "flex-end",
    [theme.breakpoints.down("xs")]: {
      padding: "6px 4px 8px",
      gap: 0,
      // No celular o texto do campo sobe para 16px (abaixo disso o iPhone dá
      // zoom). Com os ícones no respiro padrão de 12px, "Digite uma mensagem"
      // não cabia numa linha e o campo nascia com o dobro da altura.
      "& .MuiIconButton-root:not($roundAction)": { padding: 8 }
    }
  },

  messageInputWrapper: {
    padding: "4px 6px 4px 12px",
    [theme.breakpoints.down("xs")]: { padding: "2px 2px 2px 12px" },
    marginRight: 4,
    backgroundColor: theme.palette.tkv.chat.input,
    border: "none",
    display: "flex",
    alignItems: "center",
    minHeight: 44,
    borderRadius: 22,
    flex: 1,
    minWidth: 0
  },

  messageInput: {
    paddingLeft: 2,
    flex: 1,
    border: "none",
    fontSize: "0.9375rem",
    color: theme.palette.tkv.chat.text
  },

  cameraIcon: {
    color: theme.palette.tkv.chat.icon
  },

  sendMessageIcons: {
    color: theme.palette.tkv.chat.icon
  },

  // botão principal: enviar / gravar
  roundAction: {
    flex: "none",
    width: 44,
    height: 44,
    padding: 0,
    marginBottom: 0,
    borderRadius: "50%",
    backgroundColor: theme.palette.tkv.chat.accent,
    color: theme.palette.tkv.brand.contrastText,
    "&:hover": { backgroundColor: theme.palette.tkv.chat.accentHover },
    "&.Mui-disabled": {
      backgroundColor: theme.palette.tkv.chat.accent,
      opacity: 0.5,
      color: theme.palette.tkv.brand.contrastText
    },
    "& svg": { color: theme.palette.tkv.brand.contrastText, fontSize: 22 },
    // celular: compacto, do tamanho dos outros ícones da barra
    [theme.breakpoints.down("xs")]: {
      width: 38,
      height: 38,
      margin: "2px 2px 2px 0",
      "& svg": { fontSize: 20 }
    }
  },

  uploadInput: {
    display: "none"
  },

  /**
   * Computador: a barra do WhatsApp Web. "+" abre o menu de anexos (com
   * respostas rápidas e assinatura), o rosto abre emoji, figurinhas e GIFs,
   * e à direita fica o microfone, que vira enviar quando há texto.
   */
  webBar: {
    width: "100%",
    display: "flex",
    alignItems: "flex-end",
    gap: 4,
    padding: "8px 12px 10px"
  },
  webIcon: {
    flex: "none",
    width: 44,
    height: 44,
    padding: 0,
    color: theme.palette.tkv.chat.icon,
    "& svg": { fontSize: 26 }
  },
  webIconOn: { color: theme.palette.tkv.brand.text },
  plusRotate: {
    transition: "transform .2s ease"
  },
  exprPopover: {
    width: 420,
    maxWidth: "calc(100vw - 32px)",
    marginTop: -8,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(12, 10, 20, 0.28)"
  },
  attachMenu: {
    "& .MuiPaper-root": {
      borderRadius: 14,
      minWidth: 230,
      padding: "4px 0"
    },
    "& .MuiMenuItem-root": {
      gap: 4,
      minHeight: 44,
      fontSize: "0.9375rem"
    },
    "& .MuiListItemIcon-root": {
      minWidth: 36,
      color: theme.palette.tkv.brand.text
    }
  },

  /**
   * Celular: o arranjo do WhatsApp do iPhone. "+" à esquerda abre o painel
   * de anexos no lugar do teclado; o campo é uma pílula com o atalho de
   * respostas rápidas dentro; câmera e microfone à direita. Os ícones usam a
   * cor da marca, então mudam junto com o tema da empresa.
   */
  phoneBox: {
    width: "100%",
    display: "flex",
    alignItems: "flex-end",
    gap: 0,
    padding: "4px 4px 5px"
  },
  phoneIconButton: {
    flex: "none",
    width: 38,
    height: 42,
    padding: 0,
    color: theme.palette.tkv.brand.text,
    "& svg": { fontSize: 23 }
  },
  plusIcon: {
    transition: "transform .25s cubic-bezier(.34, 1.56, .64, 1)",
    fontSize: "27px !important"
  },
  plusOpen: { transform: "rotate(45deg)" },
  phoneInputWrapper: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    minHeight: 38,
    margin: "2px 2px",
    padding: "0 2px 0 12px",
    borderRadius: 19,
    backgroundColor: theme.palette.tkv.chat.input,
    boxShadow: `inset 0 0 0 1px ${theme.palette.tkv.border}`
  },
  pillAction: {
    padding: 6,
    color: theme.palette.tkv.brand.text,
    "& svg": { fontSize: 21 }
  },
  roundBrand: {
    backgroundColor: theme.palette.tkv.brand.main,
    color: theme.palette.tkv.brand.contrastText,
    animation: "$popIn .22s cubic-bezier(.34, 1.56, .64, 1)",
    "&:hover": { backgroundColor: theme.palette.tkv.brand.hover },
    "&.Mui-disabled": {
      backgroundColor: theme.palette.tkv.brand.main,
      color: theme.palette.tkv.brand.contrastText
    },
    "& svg": { color: theme.palette.tkv.brand.contrastText }
  },
  "@keyframes popIn": {
    from: { transform: "scale(0.6)", opacity: 0.4 },
    to: { transform: "scale(1)", opacity: 1 }
  },

  viewMediaInputWrapper: {
    display: "flex",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.palette.tkv.chat.bar,
    borderTop: "none"
  },

  emojiBox: {
    position: "absolute",
    bottom: 63,
    width: 40,
    borderTop: "1px solid #e8e8e8"
  },

  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12
  },

  audioLoading: {
    color: green[500],
    opacity: "70%"
  },

  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    alignContent: "middle"
  },

  cancelAudioIcon: {
    color: "red"
  },

  sendAudioIcon: {
    color: "green"
  },

  /**
   * Prévia da mensagem que está sendo respondida ou editada.
   *
   * Mensagem longa não pode empurrar a barra de envio para fora da tela:
   * o texto fica preso em duas linhas, com reticências, como no WhatsApp.
   */
  // o X ao lado da prévia: pequeno, para a barra não ficar alta
  replyClose: {
    flex: "none",
    [theme.breakpoints.down("xs")]: {
      padding: 6,
      "& svg": { fontSize: 20 }
    }
  },

  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: 6,
    padding: "10px 12px 2px",
    animation: "$replySlide .34s cubic-bezier(.3, 1.35, .5, 1) both",
    [theme.breakpoints.down("xs")]: { padding: "6px 6px 0" }
  },

  "@keyframes replySlide": {
    from: { opacity: 0, transform: "translateY(14px) scale(.97)" },
    to: { opacity: 1, transform: "none" }
  },

  // prévia da resposta: mais visível no computador, com a cor da marca
  replyginMsgContainer: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    backgroundColor: theme.palette.tkv.chat.quoteIn,
    borderRadius: 12,
    [theme.breakpoints.down("xs")]: { borderRadius: 9 },
    display: "flex",
    position: "relative",
    [theme.breakpoints.up("sm")]: {
      backgroundColor: theme.palette.tkv.brand.soft,
      boxShadow: `inset 0 0 0 1px ${theme.palette.tkv.brand.softHover}`,
      "& $replyginMsgBody": { padding: "10px 14px", fontSize: "0.9375rem" },
      "& $messageContactName": {
        color: theme.palette.tkv.brand.text,
        fontWeight: 700
      }
    }
  },

  replyginMsgBody: {
    flex: 1,
    minWidth: 0,
    padding: "6px 10px",
    // no celular a prévia é baixinha e de uma linha só, como no WhatsApp
    [theme.breakpoints.down("xs")]: {
      padding: "5px 9px",
      fontSize: "0.8125rem",
      "& > div, & > p": { WebkitLineClamp: 1, maxHeight: "1.35em" }
    },
    display: "flex",
    flexDirection: "column",
    gap: 2,
    fontSize: "0.875rem",
    color: theme.palette.tkv.chat.text,
    "& > div, & > p": {
      margin: 0,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      overflowWrap: "anywhere",
      whiteSpace: "pre-wrap",
      maxHeight: "2.6em"
    }
  },

  replyginContactMsgSideColor: {
    flex: "none",
    width: "3px",
    backgroundColor: theme.palette.tkv.brand.main
  },

  replyginSelfMsgSideColor: {
    flex: "none",
    width: "3px",
    backgroundColor: theme.palette.tkv.semantic.success
  },

  messageContactName: {
    display: "flex",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: theme.palette.tkv.brand.text
  },

  iconSwitch: {
    color: props => (props.value ? theme.palette.primary.main : "gray"),
    width: 48,
    height: 48
  },

  formatMenu: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderRadius: 30,
    boxShadow: theme.shadows[2],
    padding: "4px 8px",
    display: "flex",
    alignItems: "center"
  }
}));

const EmojiOptions = props => {
  const { disabled, showEmoji, setShowEmoji, handleAddEmoji } = props;
  const classes = useStyles();
  return (
    <>
      <IconButton
        aria-label="emojiPicker"
        component="span"
        disabled={disabled}
        onClick={e => setShowEmoji(prevState => !prevState)}
      >
        <MoodIcon className={classes.sendMessageIcons} />
      </IconButton>
      {showEmoji ? (
        <div className={classes.emojiBox}>
          <Picker
            i18n={emojiMartI18n()}
            perLine={16}
            showPreview={false}
            showSkinTones={false}
            onSelect={handleAddEmoji}
          />
        </div>
      ) : null}
    </>
  );
};

const IconSwitch = props => {
  const { setter, value, icon, tooltip } = props;
  const classes = useStyles({ value });

  return (
    <Tooltip title={tooltip}>
      <IconButton onClick={() => setter(!value)} className={classes.iconSwitch}>
        <FontAwesomeIcon icon={icon} />
      </IconButton>
    </Tooltip>
  );
};

const FileInput = props => {
  const { handleChangeMedias, disableOption } = props;
  const classes = useStyles();
  return (
    <>
      <input
        multiple
        type="file"
        id="upload-button"
        disabled={disableOption}
        className={classes.uploadInput}
        onChange={handleChangeMedias}
      />
      <label htmlFor="upload-button">
        <IconButton
          aria-label="upload"
          component="span"
          disabled={disableOption}
        >
          <AttachFileIcon className={classes.sendMessageIcons} />
        </IconButton>
      </label>
    </>
  );
};

const ActionButtons = props => {
  const {
    inputMessage,
    loading,
    recording,
    ticketStatus,
    handleSendMessage,
    handleCancelAudio,
    handleUploadAudio,
    handleStartRecording,
    disableOption,
    phone,
    web
  } = props;
  const classes = useStyles();
  const roundClass = phone
    ? `${classes.roundAction} ${classes.roundBrand}`
    : web
      ? classes.webIcon
      : classes.roundAction;
  if (inputMessage) {
    return (
      <IconButton
        key="send"
        aria-label="sendMessage"
        component="span"
        onClick={handleSendMessage}
        disabled={disableOption}
        className={roundClass}
      >
        {phone ? <SendRoundedIcon /> : <SendIcon />}
      </IconButton>
    );
  } else if (recording) {
    return (
      <div className={classes.recorderWrapper}>
        <IconButton
          aria-label="cancelRecording"
          component="span"
          fontSize="large"
          disabled={disableOption}
          onClick={handleCancelAudio}
        >
          <HighlightOffIcon className={classes.cancelAudioIcon} />
        </IconButton>
        {loading ? (
          <div>
            <CircularProgress className={classes.audioLoading} />
          </div>
        ) : (
          <RecordingTimer />
        )}

        <IconButton
          aria-label="sendRecordedAudio"
          component="span"
          onClick={handleUploadAudio}
          disabled={disableOption}
        >
          <CheckCircleOutlineIcon className={classes.sendAudioIcon} />
        </IconButton>
      </div>
    );
  } else {
    return (
      <IconButton
        key="mic"
        aria-label="showRecorder"
        component="span"
        disabled={disableOption}
        onClick={handleStartRecording}
        className={roundClass}
      >
        <MicIcon />
      </IconButton>
    );
  }
};

function UpwardPopper(props) {
  return (
    <Popper
      {...props}
      placement="top-start" // force always upwards
      modifiers={{
        flip: { enabled: false }, // disable flipping
        preventOverflow: { enabled: false } // disable overflow adjustment
      }}
    />
  );
}

const CustomInput = props => {
  const {
    loading,
    inputRef,
    ticketStatus,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleInputPaste,
    handleChangeMedias,
    handlePresenceUpdate,
    disableOption,
    phone,
    onQuickReplies,
    onFocusInput,
    quickVersion,
    quickIcon
  } = props;
  const classes = useStyles();
  const [quickMessages, setQuickMessages] = useState([]);
  const [options, setOptions] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);

  const { user } = useContext(AuthContext);

  const { list: listQuickMessages } = useQuickMessages();

  useEffect(() => {
    const handleClickAway = event => {
      const menu = document.getElementById("format-menu");
      if (menu && !menu.contains(event.target)) {
        menu.style.display = "none";
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const messages = await listQuickMessages();
      const options = messages.map(m => {
        let truncatedMessage = m.message;
        if (isString(truncatedMessage) && truncatedMessage.length > 35) {
          truncatedMessage = m.message.substring(0, 35) + "...";
        }
        return {
          value: m.message,
          label: `/${m.shortcode} - ${truncatedMessage}`
        };
      });
      setQuickMessages(options);
    }
    fetchData();
    // recarrega o atalho "/" quando as respostas mudam no modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickVersion]);

  useEffect(() => {
    if (
      isString(inputMessage) &&
      !isEmpty(inputMessage) &&
      inputMessage.length
    ) {
      const firstWord = inputMessage.charAt(0);
      setPopupOpen(firstWord.indexOf("/") > -1);

      const filteredOptions = quickMessages.filter(
        m => m.label.toLowerCase().indexOf(inputMessage.toLowerCase()) > -1
      );
      setOptions(filteredOptions);
    } else {
      setPopupOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMessage]);

  const onKeyPress = e => {
    if (loading) return;
    else if (!e.shiftKey && e.key === "Enter" && !isMobile()) {
      e.preventDefault();
      handleSendMessage();
      return;
    }
    handlePresenceUpdate && handlePresenceUpdate("composing");
  };

  const onPaste = e => {
    if (ticketStatus === "open") {
      handleInputPaste(e);
    }
  };

  const renderPlaceholder = () => {
    if (ticketStatus === "open") {
      return i18n.t("messagesInput.placeholderOpen");
    }
    return i18n.t("messagesInput.placeholderClosed");
  };

  const setInputRef = input => {
    if (input) {
      inputRef.current = input;
      inputRef.current.spellcheck = true;
    }
  };

  const showFormatMenu = () => {
    const selection = window.getSelection();
    const menuElement = document.getElementById("format-menu");
    if (!selection?.toString()) {
      menuElement.style.display = "none";
    } else {
      menuElement.style.display = "flex";
      menuElement.style.top = `${selection.anchorNode.offsetTop - 40}px`;
      menuElement.style.left = `${selection.anchorNode.offsetLeft}px`;
    }
  };

  const formatText = (prefix, suffix) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText) {
      let formattedText = `${prefix}${selectedText}${suffix}`;
      const textArea = inputRef.current;
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const textBefore = inputMessage.substring(0, start);
      const textAfter = inputMessage.substring(end);

      const prevChar = textBefore.charAt(start - 1);
      if (prevChar && prevChar !== " " && prevChar !== "\n") {
        formattedText = ` ${formattedText}`;
      }

      const nextChar = textAfter.charAt(0);
      if (nextChar && nextChar !== " " && nextChar !== "\n") {
        formattedText = `${formattedText} `;
      }

      setInputMessage(textBefore + formattedText + textAfter);
      document.getElementById("format-menu").style.display = "none";
      setTimeout(() => {
        textArea.focus();
        textArea.setSelectionRange(
          start + prefix.length - 1,
          start + prefix.length + formattedText.length - 1
        );
        showFormatMenu();
      }, 0);
    }
  };

  const splitSelectionLines = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
      const textArea = inputRef.current;
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;

      const firstLineStart =
        inputMessage.substring(0, start).lastIndexOf("\n") + 1;
      const lastLineEnd = end + inputMessage.substring(end).indexOf("\n");
      const textBefore = inputMessage.substring(0, firstLineStart);
      const textAfter = inputMessage.substring(lastLineEnd);

      const lines = inputMessage
        .substring(firstLineStart, lastLineEnd)
        .split("\n");
      return { lines, textBefore, textAfter };
    }
    return { lines: [], textBefore: inputMessage, textAfter: "" };
  };

  const formatCode = () => {
    const selection = window.getSelection();
    if (selection.toString().indexOf("\n") === -1) {
      formatText("`", "`");
      return;
    }

    const { lines, textBefore, textAfter } = splitSelectionLines();
    if (lines.length > 0) {
      const formattedText = "```\n" + lines.join("\n") + "\n```\n";
      setInputMessage(textBefore + formattedText + textAfter);
      setTimeout(() => {
        const textArea = inputRef.current;
        textArea.focus();
        textArea.setSelectionRange(
          textBefore.length,
          textBefore.length + formattedText.length
        );
        showFormatMenu();
      }, 0);
    }
  };

  const formatListNumbered = () => {
    const { lines, textBefore, textAfter } = splitSelectionLines();
    if (lines.length > 0) {
      const formattedLines = lines.map(
        (line, index) => `${index + 1}. ${line}`
      );
      const formattedText = formattedLines.join("\n");

      setInputMessage(textBefore + formattedText + textAfter);
      setTimeout(() => {
        const textArea = inputRef.current;
        textArea.focus();
        textArea.setSelectionRange(
          textBefore.length,
          textBefore.length + formattedText.length
        );
        showFormatMenu();
      }, 0);
    }
  };

  const formatListBulleted = () => {
    const { lines, textBefore, textAfter } = splitSelectionLines();
    if (lines.length > 0) {
      const formattedLines = lines.map(line => `* ${line}`);
      const formattedText = formattedLines.join("\n");

      setInputMessage(textBefore + formattedText + textAfter);
      setTimeout(() => {
        const textArea = inputRef.current;
        textArea.focus();
        textArea.setSelectionRange(
          textBefore.length,
          textBefore.length + formattedText.length
        );
        showFormatMenu();
      }, 0);
    }
  };

  const formatQuote = () => {
    const { lines, textBefore, textAfter } = splitSelectionLines();
    if (lines.length > 0) {
      const formattedLines = lines.map(line => `> ${line}`);
      const formattedText = formattedLines.join("\n");

      setInputMessage(textBefore + formattedText + textAfter);
      setTimeout(() => {
        const textArea = inputRef.current;
        textArea.focus();
        textArea.setSelectionRange(
          textBefore.length,
          textBefore.length + formattedText.length
        );
        showFormatMenu();
      }, 0);
    }
  };

  return (
    <div
      className={
        phone ? classes.phoneInputWrapper : classes.messageInputWrapper
      }
    >
      <Autocomplete
        disabled={disableOption}
        freeSolo
        open={popupOpen}
        PopperComponent={UpwardPopper}
        id="grouped-demo"
        value={inputMessage}
        options={options}
        closeIcon={null}
        getOptionLabel={option => {
          if (isObject(option)) {
            return option.label;
          } else {
            return option;
          }
        }}
        onChange={(event, opt) => {
          if (isObject(opt) && has(opt, "value")) {
            setInputMessage(opt.value);
            setTimeout(() => {
              inputRef.current.scrollTop = inputRef.current.scrollHeight;
            }, 200);
          }
        }}
        onInputChange={(event, opt, reason) => {
          if (reason === "input") {
            setInputMessage(event.target.value);
          }
        }}
        onPaste={onPaste}
        onKeyPress={onKeyPress}
        style={{ width: "100%" }}
        renderInput={params => {
          const { InputLabelProps, InputProps, ...rest } = params;
          return (
            <>
              <InputBase
                {...params.InputProps}
                {...rest}
                disabled={disableOption}
                inputRef={input => setInputRef(input)}
                placeholder={renderPlaceholder()}
                multiline
                className={classes.messageInput}
                maxRows={5}
                onFocus={onFocusInput}
                endAdornment={
                  phone ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          quickIcon === "sticker"
                            ? i18n.t("expressions.stickers")
                            : i18n.t("messagesInput.phone.quickReplies")
                        }
                        className={classes.pillAction}
                        disabled={disableOption}
                        onMouseDown={e => e.preventDefault()}
                        onClick={e => {
                          e.stopPropagation();
                          onQuickReplies();
                        }}
                      >
                        {quickIcon === "sticker" ? (
                          <InsertEmoticonRoundedIcon />
                        ) : (
                          <FlashOnRoundedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ) : (
                    isMobile() && (
                      <InputAdornment position="end">
                        <input
                          type="file"
                          id="camera-button"
                          accept="image/*"
                          capture="camera"
                          className={classes.uploadInput}
                          onChange={handleChangeMedias}
                        />
                        <label htmlFor="camera-button">
                          <IconButton
                            aria-label="camera-upload"
                            component="span"
                            disabled={disableOption}
                          >
                            <CameraAltIcon className={classes.cameraIcon} />
                          </IconButton>
                        </label>
                      </InputAdornment>
                    )
                  )
                }
                onKeyDownCapture={e => {
                  if (
                    !popupOpen &&
                    (e.key === "ArrowUp" || e.key === "ArrowDown")
                  ) {
                    e.stopPropagation();
                  }
                }}
                onMouseUp={showFormatMenu}
                onKeyUp={showFormatMenu}
                onKeyDown={e => {
                  if (e.ctrlKey && e.key === "b") {
                    e.preventDefault();
                    formatText("*", "*");
                  } else if (e.ctrlKey && e.key === "i") {
                    e.preventDefault();
                    formatText("_", "_");
                  } else if (e.ctrlKey && e.key === "s") {
                    e.preventDefault();
                    formatText("~", "~");
                  } else if (e.ctrlKey && e.key === "m") {
                    e.preventDefault();
                    formatCode();
                  } else if (e.ctrlKey && e.key === "q") {
                    e.preventDefault();
                    formatQuote();
                  } else if (e.ctrlKey && e.key === "n") {
                    e.preventDefault();
                    formatListNumbered();
                  } else if (e.ctrlKey && e.key === "l") {
                    e.preventDefault();
                    formatListBulleted();
                  }
                }}
              />
              <div
                id="format-menu"
                className={classes.formatMenu}
                style={{ display: "none", position: "absolute", zIndex: 1000 }}
              >
                <IconButton
                  size="small"
                  onClick={() => formatText("*", "*")}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <Typography style={{ fontWeight: "bold", fontSize: "15px" }}>
                    B
                  </Typography>
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => formatText("_", "_")}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <Typography style={{ fontStyle: "italic", fontSize: "15px" }}>
                    I
                  </Typography>
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => formatText("~", "~")}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <Typography
                    style={{ textDecoration: "line-through", fontSize: "15px" }}
                  >
                    S
                  </Typography>
                </IconButton>
                <IconButton
                  size="small"
                  onClick={formatCode}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <Code fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={formatListNumbered}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <FormatListNumbered fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={formatListBulleted}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <FormatListBulleted fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={formatQuote}
                  style={{ padding: "6px", margin: "0 2px" }}
                >
                  <FormatQuote fontSize="small" />
                </IconButton>
              </div>
            </>
          );
        }}
      />
    </div>
  );
};

const MessageInputCustom = props => {
  const { ticket, showTabGroups } = props;
  const { status: ticketStatus, id: ticketId } = ticket;
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [attachOpen, setAttachOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [exprOpen, setExprOpen] = useState(false);
  const exprAnchorRef = useRef(null);
  // o painel só é montado na primeira vez que abre (o seletor de emoji pesa)
  const [exprMounted, setExprMounted] = useState(false);
  useEffect(() => {
    if (exprOpen) setExprMounted(true);
  }, [exprOpen]);
  const [attachAnchor, setAttachAnchor] = useState(null);
  const [quickVersion, setQuickVersion] = useState(0);

  const [medias, setMedias] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  const inputRef = useRef();
  const { setReplyingMessage, replyingMessage } =
    useContext(ReplyMessageContext);
  const { setEditingMessage, editingMessage } = useContext(EditMessageContext);
  const { user } = useContext(AuthContext);

  // assinatura desligada por padrão: só vai com o nome quando a pessoa ligar
  // (chave nova para todos começarem desligados)
  const [signMessage, setSignMessage] = useLocalStorage(
    "tkv:signMessage",
    false
  );
  const [locationOpen, setLocationOpen] = useState(false);

  const sendLocation = async point => {
    try {
      await api.post(`/messages/${ticketId}/location`, {
        latitude: point.lat,
        longitude: point.lon,
        name: point.name,
        address: point.address
      });
    } catch (err) {
      toastError(err);
      throw err;
    }
  };

  const locationDialog = (
    <SendLocationDialog
      open={locationOpen}
      onClose={() => setLocationOpen(false)}
      onSend={sendLocation}
    />
  );

  const socketManager = useContext(SocketContext);
  const [socket, setSocket] = useState(null);
  const [currentPresence, setCurrentPresence] = useState(null);
  const [presenceTimeout, setPresenceTimeout] = useState(null);

  useEffect(() => {
    if (!inputMessage) {
      sessionStorage.removeItem("messageDraft-" + ticketId);
      return;
    }
    sessionStorage.setItem("messageDraft-" + ticketId, inputMessage);
  }, [inputMessage]);

  useEffect(() => {
    const draftMessage = sessionStorage.getItem("messageDraft-" + ticketId);
    if (draftMessage) {
      setInputMessage(draftMessage);
    }
  }, [ticketId]);

  useEffect(() => {
    const socket = socketManager.GetSocket();
    if (socket) {
      setSocket(socket);
    }
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  // ESC desiste de responder (ou de editar) sem fechar a conversa
  useEffect(() => {
    if (!replyingMessage && !editingMessage) return undefined;
    const onKey = e => {
      if (e.key !== "Escape" || e.defaultPrevented || overlayOpen()) return;
      e.preventDefault();
      setReplyingMessage(null);
      if (editingMessage) {
        setEditingMessage(null);
        setInputMessage("");
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyingMessage, editingMessage]);

  useEffect(() => {
    if (editingMessage) {
      if (signMessage && editingMessage.body.startsWith(`*${user.name}:*\n`)) {
        setInputMessage(
          editingMessage.body.substr(editingMessage.body.indexOf("\n") + 1)
        );
      } else {
        setInputMessage(editingMessage.body);
      }
    }

    if (replyingMessage || editingMessage) {
      inputRef.current.focus();
    }
  }, [replyingMessage, editingMessage, signMessage, user.name]);

  useEffect(() => {
    // Foco automático só no computador. No celular ele abria o teclado assim
    // que a conversa carregava: o iPhone aproximava a tela, deslocava a área
    // visível e a pessoa caía num vazio abaixo das mensagens, tendo que rolar
    // de volta para cima. No WhatsApp o teclado só abre quando você toca no
    // campo — aqui agora também.
    const touch =
      window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (!touch) {
      inputRef.current.focus();
    }
    return () => {
      setShowEmoji(false);
      setAttachOpen(false);
      setExprOpen(false);
      setMedias([]);
      setReplyingMessage(null);
      setEditingMessage(null);
      setInputMessage("");
    };
  }, [ticketId]);

  // const handleChangeInput = e => {
  // 	if (isObject(e) && has(e, 'value')) {
  // 		setInputMessage(e.value);
  // 	} else {
  // 		setInputMessage(e.target.value)
  // 	}
  // };

  // emoji entra onde está o cursor (antes ia sempre para o fim do texto)
  const handleAddEmoji = e => {
    const emoji = e.native;
    const el = inputRef.current;
    const start = el ? el.selectionStart : null;
    const end = el ? el.selectionEnd : null;
    setInputMessage(prev => {
      if (start === null || start > prev.length) return prev + emoji;
      return prev.slice(0, start) + emoji + prev.slice(end ?? start);
    });
    if (el && start !== null) {
      requestAnimationFrame(() => {
        const caret = start + emoji.length;
        el.setSelectionRange(caret, caret);
      });
    }
  };

  // comprime a foto antes de subir (vídeo e outros vão como estão)
  const prepareMedia = file =>
    new Promise(resolve => {
      if (file?.type?.split("/")[0] !== "image" || /gif$/i.test(file.type)) {
        resolve(file);
        return;
      }
      // eslint-disable-next-line no-new
      new Compressor(file, {
        quality: 0.7,
        success: result => resolve(result),
        error: () => resolve(file)
      });
    });

  /**
   * Celular: foto e vídeo vão direto, como no WhatsApp. A mídia entra na
   * conversa na hora (com o anel de envio) e vai subindo em segundo plano —
   * sem tela de prévia no meio do caminho.
   */
  const sendMediaDirect = (files, captions = []) => {
    files.forEach((file, index) => {
      const type = file.type.split("/")[0];
      const text = (captions[index] || "").trim();
      // legenda assinada como as mensagens de texto
      const caption = text && signMessage ? `*${user?.name}:*\n${text}` : text;
      const visual = type === "image" || type === "video";
      const url = visual ? URL.createObjectURL(file) : null;
      const pendingId = visual
        ? announceSending({
            ticketId,
            body: caption,
            inputEl: inputRef.current,
            media: { url, type }
          })
        : null;
      prepareMedia(file)
        .then(media => {
          const formData = new FormData();
          formData.append("fromMe", true);
          formData.append("medias", media, media.name || file.name);
          formData.append("body", media.name || file.name);
          formData.append("captions", caption);
          return api.post(`/messages/${ticketId}`, formData, {
            onUploadProgress: event => {
              if (!event.total || !pendingId) return;
              announceProgress(
                pendingId,
                Math.round((event.loaded * 100) / event.total)
              );
            }
          });
        })
        .then(() => {
          if (pendingId) announceConfirmed(pendingId);
        })
        .catch(err => {
          if (pendingId) announceFailed(pendingId);
          toastError(err);
        })
        .finally(() => {
          if (url) setTimeout(() => URL.revokeObjectURL(url), 120000);
        });
    });
  };

  const handleChangeMedias = e => {
    if (!e.target.files) {
      return;
    }

    const selectedMedias = Array.from(e.target.files);
    // deixa escolher o mesmo arquivo de novo depois
    e.target.value = "";
    setAttachOpen(false);
    // abre a prévia (com legenda); o envio sai de lá
    setMedias(selectedMedias);
  };

  // celular: o painel do "+" abre no lugar do teclado, como no WhatsApp
  const toggleAttach = () => {
    setExprOpen(false);
    setAttachOpen(open => {
      if (!open) inputRef.current?.blur();
      return !open;
    });
  };

  const toggleExpressions = () => {
    setAttachOpen(false);
    setExprOpen(open => {
      if (!open && isPhone) inputRef.current?.blur();
      return !open;
    });
  };

  // respostas rápidas: modal para escolher, criar e editar sem sair da conversa
  const handleQuickReplies = () => {
    setAttachOpen(false);
    inputRef.current?.blur();
    setQuickOpen(true);
  };

  const handlePickQuickReply = text => {
    setInputMessage(prev =>
      prev && prev.trim() && !prev.startsWith("/")
        ? `${prev}${/\s$/.test(prev) ? "" : " "}${text}`
        : text
    );
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const quickRepliesModal = (
    <QuickRepliesModal
      open={quickOpen}
      onClose={() => setQuickOpen(false)}
      onPick={handlePickQuickReply}
      onChanged={() => setQuickVersion(v => v + 1)}
    />
  );

  const handleInputPaste = e => {
    if (e.clipboardData.files[0]) {
      setMedias([e.clipboardData.files[0]]);
    }
  };

  const handlePresenceUpdate = presence => {
    if (!socket || currentPresence === presence) return;

    if (presenceTimeout) {
      clearTimeout(presenceTimeout);
      setPresenceTimeout(null);
    }

    if (!presence) {
      setCurrentPresence(null);
      socket.emit("presenceUpdate", {
        ticketId,
        presence: "paused"
      });
      return;
    }

    setCurrentPresence(presence);
    socket.emit("presenceUpdate", {
      ticketId,
      presence
    });

    if (presence === "composing") {
      setPresenceTimeout(
        setTimeout(() => {
          setCurrentPresence(null);
          socket.emit("presenceUpdate", {
            ticketId,
            presence: "paused"
          });
        }, 5000)
      );
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
    //if (disableOption) return
    setLoading(true);

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: signMessage
        ? `*${user?.name}:*\n${inputMessage.trim()}`
        : inputMessage.trim(),
      quotedMsg: replyingMessage
    };

    handlePresenceUpdate(null);

    // o balão entra na conversa na hora, saindo da barra de envio
    const pendingId =
      editingMessage === null
        ? announceSending({
            ticketId,
            body: message.body,
            quotedMsg: replyingMessage,
            inputEl: inputRef.current
          })
        : null;

    const url =
      editingMessage !== null
        ? `/messages/edit/${editingMessage.id}`
        : `/messages/${ticketId}`;
    api.post(url, message).catch(err => {
      if (pendingId) announceFailed(pendingId);
      toastError(err);
    });

    setInputMessage("");
    setShowEmoji(false);
    setLoading(false);
    setReplyingMessage(null);
    setEditingMessage(null);
    inputRef.current.focus();
  };

  const handleStartRecording = async () => {
    if (disableOption) return;
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
      handlePresenceUpdate("recording");
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  // o áudio entra na conversa na hora (com o anel de envio) e sobe em
  // segundo plano: dá para sair da conversa enquanto ele carrega
  const handleUploadAudio = async () => {
    handlePresenceUpdate(null);
    let blob;
    try {
      [, blob] = await Mp3Recorder.stop().getMp3();
    } catch (err) {
      setRecording(false);
      toastError(err);
      return;
    }
    setRecording(false);
    if (!blob || blob.size < 10000) return;

    const url = URL.createObjectURL(blob);
    const pendingId = announceSending({
      ticketId,
      body: "",
      inputEl: inputRef.current,
      media: { url, type: "audio" }
    });
    const formData = new FormData();
    const filename = `audio-record-site-${new Date().getTime()}.mp3`;
    formData.append("medias", blob, filename);
    formData.append("body", filename);
    formData.append("fromMe", true);

    api
      .post(`/messages/${ticketId}`, formData, {
        onUploadProgress: event => {
          if (!event.total) return;
          announceProgress(
            pendingId,
            Math.round((event.loaded * 100) / event.total)
          );
        }
      })
      .then(() => announceConfirmed(pendingId))
      .catch(err => {
        announceFailed(pendingId);
        toastError(err);
      })
      .finally(() => setTimeout(() => URL.revokeObjectURL(url), 120000));
  };

  const handleCancelAudio = async () => {
    handlePresenceUpdate(null);
    try {
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  const isGroup = showTabGroups && ticket.isGroup;
  const disableOption =
    (!isGroup && loading) || recording || ticketStatus === "closed";

  const renderReplyingMessage = message => {
    return (
      <div className={classes.replyginMsgWrapper}>
        <div className={classes.replyginMsgContainer}>
          <span
            className={clsx(classes.replyginContactMsgSideColor, {
              [classes.replyginSelfMsgSideColor]: !message.fromMe
            })}
          ></span>
          {replyingMessage && (
            <div className={classes.replyginMsgBody}>
              <span className={classes.messageContactName}>
                {i18n.t("messagesInput.replying")} {message.contact?.name}
              </span>
              <WhatsMarked>
                {message.body.startsWith('{"ticketzvCard":')
                  ? "🪪"
                  : message.body}
              </WhatsMarked>
            </div>
          )}
          {editingMessage && (
            <div className={classes.replyginMsgBody}>
              <span className={classes.messageContactName}>
                {i18n.t("messagesInput.editing")}
              </span>
              <WhatsMarked>{message.body}</WhatsMarked>
            </div>
          )}
        </div>
        <IconButton
          aria-label="showRecorder"
          component="span"
          className={classes.replyClose}
          disabled={disableOption}
          onClick={() => {
            setReplyingMessage(null);
            setEditingMessage(null);
            setInputMessage("");
          }}
        >
          <ClearIcon className={classes.sendMessageIcons} />
        </IconButton>
      </div>
    );
  };

  if (medias.length > 0)
    return (
      <Paper elevation={0} square className={classes.mainWrapper}>
        <MediaPreview
          files={medias}
          accent={
            isPhone
              ? theme.palette.tkv.brand.main
              : theme.palette.tkv.chat.accent
          }
          accentText={theme.palette.tkv.brand.contrastText}
          disabled={disableOption}
          withCaption
          onAdd={added => setMedias(prev => [...prev, ...added])}
          onClear={() => setMedias([])}
          onRemove={index =>
            setMedias(prev => prev.filter((_, i) => i !== index))
          }
          onReplace={(index, file) =>
            setMedias(prev =>
              prev.map((item, i) => (i === index ? file : item))
            )
          }
          onSend={(event, captions) => {
            // fecha a prévia na hora: cada mídia entra na conversa com o anel
            // de envio e sobe em segundo plano
            sendMediaDirect(medias, captions);
            setMedias([]);
          }}
        />
      </Paper>
    );
  else if (isPhone) {
    return (
      <Paper square elevation={0} className={classes.mainWrapper}>
        {locationDialog}
        {(replyingMessage && renderReplyingMessage(replyingMessage)) ||
          (editingMessage && renderReplyingMessage(editingMessage))}
        {recording ? (
          <RecordingPanel
            recorder={Mp3Recorder}
            loading={loading}
            onCancel={handleCancelAudio}
            onSend={handleUploadAudio}
          />
        ) : (
          <div className={classes.phoneBox}>
            <IconButton
              className={classes.phoneIconButton}
              onClick={toggleAttach}
              disabled={disableOption}
              aria-label={i18n.t("messagesInput.phone.attach")}
              aria-expanded={attachOpen}
            >
              <AddRoundedIcon
                className={clsx(classes.plusIcon, {
                  [classes.plusOpen]: attachOpen
                })}
              />
            </IconButton>

            <CustomInput
              phone
              loading={loading}
              inputRef={inputRef}
              ticketStatus={(isGroup && "open") || ticketStatus}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              handleSendMessage={handleSendMessage}
              handleInputPaste={handleInputPaste}
              handleChangeMedias={handleChangeMedias}
              handlePresenceUpdate={handlePresenceUpdate}
              disableOption={disableOption}
              onQuickReplies={toggleExpressions}
              quickIcon="sticker"
              onFocusInput={() => {
                setAttachOpen(false);
                setExprOpen(false);
              }}
              quickVersion={quickVersion}
            />

            {!inputMessage && (
              <IconButton
                component="label"
                htmlFor="camera-button"
                className={classes.phoneIconButton}
                disabled={disableOption}
                aria-label={i18n.t("messagesInput.phone.camera")}
              >
                <PhotoCameraOutlinedIcon />
              </IconButton>
            )}

            <ActionButtons
              phone
              inputMessage={inputMessage}
              loading={loading}
              recording={recording}
              ticketStatus={ticketStatus}
              handleSendMessage={handleSendMessage}
              handleCancelAudio={handleCancelAudio}
              handleUploadAudio={handleUploadAudio}
              handleStartRecording={handleStartRecording}
            />
          </div>
        )}
        <Collapse
          in={exprOpen && !recording}
          timeout={200}
          unmountOnExit
          style={{ width: "100%", alignSelf: "stretch" }}
        >
          <ExpressionPanel
            compact
            ticketId={ticketId}
            disabled={disableOption}
          />
        </Collapse>
        <AttachPanel
          open={attachOpen && !recording}
          disabled={disableOption}
          onFiles={handleChangeMedias}
          onLocation={() => {
            setAttachOpen(false);
            setLocationOpen(true);
          }}
          onQuickReplies={handleQuickReplies}
          signMessage={signMessage}
          onToggleSign={() => setSignMessage(!signMessage)}
        />
        {quickRepliesModal}
      </Paper>
    );
  } else {
    const expressionPopover = (
      <Popover
        open={exprOpen && !recording && !!exprAnchorRef.current}
        anchorEl={exprAnchorRef.current}
        onClose={() => setExprOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{ className: classes.exprPopover }}
      >
        {/* no computador: emoji, figurinhas e GIFs (no celular o emoji vem
            do teclado do aparelho) */}
        <ExpressionPanel
          ticketId={ticketId}
          disabled={disableOption}
          showEmoji
          onEmoji={handleAddEmoji}
        />
      </Popover>
    );
    return (
      <Paper square elevation={0} className={classes.mainWrapper}>
        {locationDialog}
        {(replyingMessage && renderReplyingMessage(replyingMessage)) ||
          (editingMessage && renderReplyingMessage(editingMessage))}

        <div className={classes.webBar}>
          <input
            multiple
            type="file"
            id="upload-button"
            disabled={disableOption}
            className={classes.uploadInput}
            onChange={handleChangeMedias}
          />
          <input
            multiple
            type="file"
            id="gallery-button"
            accept="image/*,video/*"
            disabled={disableOption}
            className={classes.uploadInput}
            onChange={handleChangeMedias}
          />
          <Tooltip title={i18n.t("messagesInput.phone.attach")}>
            <span>
              <IconButton
                aria-label="upload"
                className={classes.webIcon}
                disabled={disableOption}
                onClick={e => setAttachAnchor(e.currentTarget)}
              >
                <AddRoundedIcon
                  className={classes.plusRotate}
                  style={{
                    transform: attachAnchor ? "rotate(45deg)" : "none"
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
          <Menu
            className={classes.attachMenu}
            anchorEl={attachAnchor}
            open={!!attachAnchor}
            onClose={() => setAttachAnchor(null)}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            transformOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <MenuItem
              component="label"
              htmlFor="upload-button"
              onClick={() => setAttachAnchor(null)}
            >
              <ListItemIcon>
                <InsertDriveFileOutlinedIcon />
              </ListItemIcon>
              {i18n.t("messagesInput.phone.document")}
            </MenuItem>
            <MenuItem
              component="label"
              htmlFor="gallery-button"
              onClick={() => setAttachAnchor(null)}
            >
              <ListItemIcon>
                <PhotoLibraryOutlinedIcon />
              </ListItemIcon>
              {i18n.t("messagesInput.phone.gallery")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAttachAnchor(null);
                setLocationOpen(true);
              }}
            >
              <ListItemIcon>
                <RoomOutlinedIcon />
              </ListItemIcon>
              {i18n.t("messagesInput.location", "Localização")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAttachAnchor(null);
                handleQuickReplies();
              }}
            >
              <ListItemIcon>
                <FlashOnRoundedIcon />
              </ListItemIcon>
              {i18n.t("quickReplies.title")}
            </MenuItem>
            <MenuItem onClick={() => setSignMessage(!signMessage)}>
              <ListItemIcon>
                <FontAwesomeIcon icon={faSignature} />
              </ListItemIcon>
              <span style={{ flex: 1 }}>
                {i18n.t("messagesInput.signMessage")}
              </span>
              {signMessage && <CheckRoundedIcon fontSize="small" />}
            </MenuItem>
          </Menu>

          <Tooltip title={i18n.t("expressions.title")}>
            <span>
              <IconButton
                ref={exprAnchorRef}
                aria-label={i18n.t("expressions.title")}
                className={`${classes.webIcon}${exprOpen ? ` ${classes.webIconOn}` : ""}`}
                disabled={disableOption}
                onClick={toggleExpressions}
              >
                <InsertEmoticonRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>

          <CustomInput
            loading={loading}
            inputRef={inputRef}
            ticketStatus={(isGroup && "open") || ticketStatus}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            handleInputPaste={handleInputPaste}
            handleChangeMedias={handleChangeMedias}
            handlePresenceUpdate={handlePresenceUpdate}
            disableOption={disableOption}
            quickVersion={quickVersion}
            onFocusInput={() => setExprOpen(false)}
          />

          <ActionButtons
            web
            inputMessage={inputMessage}
            loading={loading}
            recording={recording}
            ticketStatus={ticketStatus}
            disabeleOption={disableOption}
            handleSendMessage={handleSendMessage}
            handleCancelAudio={handleCancelAudio}
            handleUploadAudio={handleUploadAudio}
            handleStartRecording={handleStartRecording}
          />
        </div>
        {expressionPopover}
        {quickRepliesModal}
      </Paper>
    );
  }
};

export default withWidth()(MessageInputCustom);
