import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  IconButton,
  InputBase,
  makeStyles,
  Paper
} from "@material-ui/core";
import clsx from "clsx";
import { format, isToday, isYesterday } from "date-fns";
import SendIcon from "@material-ui/icons/Send";

import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

import AttachFileIcon from "@material-ui/icons/AttachFile";
import CancelIcon from "@material-ui/icons/Cancel";
import CircularProgress from "@material-ui/core/CircularProgress";
import { GetApp } from "@material-ui/icons";
import toastError from "../../errors/toastError";
import MicRecorder from "mic-recorder-to-mp3";
import MicIcon from "@material-ui/icons/Mic";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import CropFreeIcon from "@material-ui/icons/CropFree";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import RecordingTimer from "../../components/MessageInputCustom/RecordingTimer";
import MediaGalleryLightbox, {
  buildMediaGalleryData
} from "../../components/MediaGalleryLightbox";

/**
 * Mensagens do chat interno.
 *
 * Antes: fundo cinza chapado, balões com borda de 1px E sombra, o nome do
 * remetente repetido em cima de TODA mensagem (inclusive nas suas), a data e
 * hora completas numa linha própria embaixo de cada balão, e um campo de
 * digitar sublinhado com 20px de respiro que parecia formulário, não chat.
 *
 * Agora o desenho segue a lógica de um mensageiro, mas com a identidade da
 * casa — isto é conversa da equipe, não com cliente, então usa o roxo e não o
 * verde do WhatsApp:
 *
 *  - as suas mensagens à direita, na cor da marca; as dos outros à esquerda,
 *    em superfície clara;
 *  - o nome só aparece nas mensagens dos outros, e só na primeira de uma
 *    sequência da mesma pessoa;
 *  - a hora fica pequena dentro do balão; a data vira um separador quando o
 *    dia muda;
 *  - o campo de digitar é uma pílula com o botão de enviar redondo.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    mainContainer: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
      borderRadius: 0,
      boxShadow: "none",
      backgroundColor: t.canvas
    },
    messageList: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      overscrollBehavior: "contain",
      padding: theme.spacing(2, 3, 1),
      ...theme.scrollbarStyles,
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1.5, 1, 1) }
    },

    daySeparator: {
      alignSelf: "center",
      margin: theme.spacing(1.5, 0, 1),
      padding: "4px 12px",
      borderRadius: t.radius.pill,
      fontSize: "0.6875rem",
      fontWeight: 600,
      letterSpacing: "0.02em",
      color: theme.palette.text.secondary,
      backgroundColor: t.surface,
      border: `1px solid ${t.border}`
    },

    bubbleRow: {
      display: "flex",
      marginTop: 2
    },
    bubbleRowFirst: { marginTop: theme.spacing(1.25) },
    bubbleRowMine: { justifyContent: "flex-end" },

    bubble: {
      position: "relative",
      maxWidth: "min(560px, 78%)",
      minWidth: 64,
      padding: "7px 10px 6px",
      fontSize: "0.9063rem",
      lineHeight: 1.45,
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
      [theme.breakpoints.down("xs")]: { maxWidth: "86%" }
    },
    bubbleTheirs: {
      backgroundColor: t.surface,
      color: theme.palette.text.primary,
      border: `1px solid ${t.border}`,
      borderRadius: "4px 16px 16px 16px"
    },
    bubbleMine: {
      backgroundColor: t.brand.main,
      color: t.brand.contrastText,
      borderRadius: "16px 4px 16px 16px",
      "& a": { color: "inherit", textDecoration: "underline" }
    },
    // bolhas do meio de uma sequência ficam com os cantos todos arredondados
    bubbleTheirsFollow: { borderTopLeftRadius: 16 },
    bubbleMineFollow: { borderTopRightRadius: 16 },

    sender: {
      display: "block",
      marginBottom: 2,
      fontSize: "0.75rem",
      fontWeight: 700,
      color: t.brand.main
    },
    bubbleMeta: {
      display: "block",
      marginTop: 2,
      textAlign: "right",
      fontSize: "0.6875rem",
      lineHeight: 1.2,
      opacity: 0.72
    },

    // ── barra de digitar ──
    inputArea: {
      flex: "none",
      display: "flex",
      alignItems: "flex-end",
      gap: theme.spacing(0.75),
      padding: theme.spacing(1, 2, 1.5),
      backgroundColor: t.surface,
      borderTop: `1px solid ${t.border}`,
      paddingBottom: `calc(${theme.spacing(1.5)}px + var(--safe-bottom, 0px))`,
      [theme.breakpoints.down("xs")]: {
        padding: theme.spacing(0.75, 1),
        paddingBottom: `calc(${theme.spacing(1)}px + var(--safe-bottom, 0px))`
      }
    },
    inputPill: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      minHeight: 44,
      padding: "2px 6px 2px 4px",
      borderRadius: 22,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`,
      transition: "border-color .15s ease, box-shadow .15s ease",
      "&:focus-within": {
        borderColor: t.brand.main,
        boxShadow: `0 0 0 3px ${t.brand.focusRing}`
      }
    },
    input: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.9375rem",
      padding: "8px 4px",
      "& textarea": { maxHeight: 132, overflowY: "auto !important" }
    },
    roundAction: {
      flex: "none",
      width: 44,
      height: 44,
      padding: 0,
      borderRadius: "50%",
      backgroundColor: t.brand.main,
      color: t.brand.contrastText,
      "&:hover": { backgroundColor: t.brand.hover },
      "&.Mui-disabled": {
        backgroundColor: t.brand.main,
        color: t.brand.contrastText,
        opacity: 0.5
      }
    },

    sendMessageIcons: {
      color: theme.palette.text.secondary
    },
    uploadInput: {
      display: "none"
    },
    circleLoading: {
      color: t.brand.main,
      position: "absolute",
      top: "20%",
      left: "50%",
      marginLeft: -12
    },
    viewMediaInputWrapper: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      minHeight: 44,
      padding: "2px 4px",
      position: "relative",
      borderRadius: 22,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`
    },
    mediaName: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: "0.875rem"
    },

    downloadMedia: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "inherit",
      padding: 10
    },
    messageMedia: {
      display: "block",
      objectFit: "cover",
      width: 250,
      maxWidth: "100%",
      height: 200,
      marginBottom: 4,
      borderRadius: 12
    },
    videoPreviewWrapper: {
      width: 250,
      maxWidth: "100%",
      height: 200,
      marginBottom: 4,
      borderRadius: 12,
      overflow: "hidden",
      position: "relative",
      backgroundColor: "#000"
    },
    videoPreviewMedia: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
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

    recorderWrapper: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: theme.spacing(1),
      minHeight: 44
    },

    cancelAudioIcon: {
      color: t.semantic.danger
    },

    audioLoading: {
      color: t.brand.main
    },

    sendAudioIcon: {
      color: t.semantic.success
    }
  };
});

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

export default function ChatMessages({
  chat,
  messages,
  handleSendMessage,
  handleLoadMore,
  scrollToBottomRef,
  pageInfo
}) {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { datetimeToClient } = useDate();
  const baseRef = useRef();
  const previewVideoRefs = useRef({});

  const [contentMessage, setContentMessage] = useState("");
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [previewVideoPlayingById, setPreviewVideoPlayingById] = useState({});

  const lightboxMedia = useMemo(() => {
    return buildMediaGalleryData(messages, {
      getMediaUrl: message => message?.mediaPath
    });
  }, [messages]);

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

  const scrollToBottom = () => {
    if (baseRef.current) {
      baseRef.current.scrollIntoView({});
    }
  };

  const unreadMessages = chat => {
    if (chat !== undefined) {
      const currentUser = chat.users.find(u => u.userId === user.id);
      return currentUser.unreads > 0;
    }
    return 0;
  };

  useEffect(() => {
    if (unreadMessages(chat) > 0) {
      try {
        api.post(`/chats/${chat.id}/read`, { userId: user.id });
      } catch (err) {}
    }
    scrollToBottomRef.current = scrollToBottom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = e => {
    const { scrollTop } = e.currentTarget;
    if (!pageInfo.hasMore || loading) return;
    if (scrollTop < 600) {
      handleLoadMore();
    }
  };

  const handleChangeMedias = e => {
    if (!e.target.files) {
      return;
    }

    const selectedMedias = Array.from(e.target.files);
    setMedias(selectedMedias);
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

  const checkMessageMedia = message => {
    const mediaUrl = message.mediaPath;

    if (message.mediaType === "image") {
      return (
        <img
          className={classes.messageMedia}
          src={mediaUrl}
          alt="midia da mensagem"
          style={{ cursor: "pointer" }}
          onClick={() => openLightboxForMessage(message.id)}
        />
      );
    }
    if (message.mediaType === "audio") {
      return (
        <audio controls>
          <source src={mediaUrl} type="audio/ogg"></source>
        </audio>
      );
    }

    if (message.mediaType === "video") {
      return (
        <div className={classes.videoPreviewWrapper}>
          <video
            ref={element => {
              if (element) {
                previewVideoRefs.current[message.id] = element;
              } else {
                delete previewVideoRefs.current[message.id];
              }
            }}
            className={classes.videoPreviewMedia}
            src={mediaUrl}
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
              onClick={event => handleVideoPreviewPlayClick(event, message.id)}
            >
              {previewVideoPlayingById[message.id] ? (
                <PauseIcon />
              ) : (
                <PlayArrowIcon />
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
              <CropFreeIcon />
            </IconButton>
          </div>
        </div>
      );
    } else {
      return (
        <>
          <div className={classes.downloadMedia}>
            <Button
              startIcon={<GetApp />}
              color="primary"
              variant="outlined"
              target="_blank"
              href={mediaUrl}
            >
              Download
            </Button>
          </div>
          {/* <Divider /> */}
        </>
      );
    }
  };

  const handleSendMedia = async e => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("fromMe", true);
    medias.forEach(media => {
      formData.append("medias", media);
      formData.append("body", media.name);
    });

    try {
      await api.post(`/chats/${chat.id}/messages`, formData);
    } catch (err) {
      console.log(err);
      toastError(err);
    }

    setLoading(false);
    setMedias([]);
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleUploadAudio = async () => {
    setLoading(true);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();

      if (blob.size < 10000) {
        setLoading(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();
      const filename = `audio-${new Date().getTime()}.mp3`;

      formData.append("medias", blob, filename);
      formData.append("body", filename);
      formData.append("fromMe", true);

      await api.post(`/chats/${chat.id}/messages`, formData);
    } catch (err) {
      toastError(err);
    }

    setRecording(false);
    setLoading(false);
  };

  const handleCancelAudio = async () => {
    try {
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  const dayLabel = value => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    if (isToday(date)) return i18n.t("common.today", "Hoje");
    if (isYesterday(date)) return i18n.t("common.yesterday", "Ontem");
    return format(date, "dd/MM/yyyy");
  };

  const sendText = () => {
    if (contentMessage.trim() !== "") {
      handleSendMessage(contentMessage);
      setContentMessage("");
    }
  };

  const renderMessages = () => {
    if (!Array.isArray(messages)) return null;
    let previous = null;

    return messages.map(item => {
      const mine = item.senderId === user.id;
      const created = new Date(item.createdAt);
      const newDay =
        !previous ||
        new Date(previous.createdAt).toDateString() !== created.toDateString();
      // mesma pessoa, mesmo dia, menos de 5 minutos: continua a sequência
      const sameRun =
        !newDay &&
        previous.senderId === item.senderId &&
        created - new Date(previous.createdAt) < 5 * 60 * 1000;
      previous = item;

      return (
        <React.Fragment key={item.id}>
          {newDay && (
            <span className={classes.daySeparator}>
              {dayLabel(item.createdAt)}
            </span>
          )}
          <div
            className={clsx(
              classes.bubbleRow,
              !sameRun && classes.bubbleRowFirst,
              mine && classes.bubbleRowMine
            )}
          >
            <div
              className={clsx(
                classes.bubble,
                mine ? classes.bubbleMine : classes.bubbleTheirs,
                sameRun &&
                  (mine ? classes.bubbleMineFollow : classes.bubbleTheirsFollow)
              )}
            >
              {!mine && !sameRun && (
                <span className={classes.sender}>{item.sender?.name}</span>
              )}
              {item.mediaPath && checkMessageMedia(item)}
              {item.message}
              <span className={classes.bubbleMeta}>
                {Number.isNaN(created.getTime())
                  ? datetimeToClient(item.createdAt)
                  : format(created, "HH:mm")}
              </span>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <Paper className={classes.mainContainer} elevation={0} square>
      <div onScroll={handleScroll} className={classes.messageList}>
        {renderMessages()}
        <div ref={baseRef}></div>
      </div>

      <div className={classes.inputArea}>
        {recording ? (
          <div className={classes.recorderWrapper}>
            <IconButton
              aria-label="cancelRecording"
              component="span"
              disabled={loading}
              onClick={handleCancelAudio}
            >
              <HighlightOffIcon className={classes.cancelAudioIcon} />
            </IconButton>
            {loading ? (
              <CircularProgress size={24} className={classes.audioLoading} />
            ) : (
              <RecordingTimer />
            )}
            <IconButton
              aria-label="sendRecordedAudio"
              component="span"
              onClick={handleUploadAudio}
              disabled={loading}
            >
              <CheckCircleOutlineIcon className={classes.sendAudioIcon} />
            </IconButton>
          </div>
        ) : medias.length > 0 ? (
          <>
            <div className={classes.viewMediaInputWrapper}>
              <IconButton
                aria-label="cancel-upload"
                component="span"
                size="small"
                onClick={() => setMedias([])}
              >
                <CancelIcon className={classes.sendMessageIcons} />
              </IconButton>
              {loading ? (
                <CircularProgress size={22} className={classes.audioLoading} />
              ) : (
                <span className={classes.mediaName}>{medias[0]?.name}</span>
              )}
            </div>
            <IconButton
              aria-label="send-upload"
              component="span"
              onClick={handleSendMedia}
              disabled={loading}
              className={classes.roundAction}
            >
              <SendIcon />
            </IconButton>
          </>
        ) : (
          <>
            <div className={classes.inputPill}>
              <FileInput
                disableOption={loading}
                handleChangeMedias={handleChangeMedias}
              />
              <InputBase
                multiline
                maxRows={6}
                value={contentMessage}
                placeholder={i18n.t("internalChat.typeMessage")}
                onKeyDown={e => {
                  // Enter envia; Shift+Enter quebra a linha
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendText();
                  }
                }}
                onChange={e => setContentMessage(e.target.value)}
                className={classes.input}
              />
            </div>
            {contentMessage ? (
              <IconButton
                aria-label="sendMessage"
                onClick={sendText}
                className={classes.roundAction}
              >
                <SendIcon />
              </IconButton>
            ) : (
              <IconButton
                aria-label="showRecorder"
                component="span"
                disabled={loading}
                onClick={handleStartRecording}
                className={classes.roundAction}
              >
                <MicIcon />
              </IconButton>
            )}
          </>
        )}
      </div>
      <MediaGalleryLightbox
        open={lightboxOpen}
        onClose={closeLightbox}
        index={lightboxIndex}
        slides={lightboxMedia.slides}
      />
    </Paper>
  );
}

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
