import React, { useContext, useEffect, useRef, useState } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import ButtonBase from "@material-ui/core/ButtonBase";

import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import AndroidIcon from "@material-ui/icons/Android";
import DoneRoundedIcon from "@material-ui/icons/DoneRounded";
import PhotoCameraRoundedIcon from "@material-ui/icons/PhotoCameraRounded";
import MicRoundedIcon from "@material-ui/icons/MicRounded";
import VideocamRoundedIcon from "@material-ui/icons/VideocamRounded";
import DescriptionRoundedIcon from "@material-ui/icons/DescriptionRounded";
import GifRoundedIcon from "@material-ui/icons/GifRounded";
import EmojiEmotionsRoundedIcon from "@material-ui/icons/EmojiEmotionsRounded";
import SyncAltRoundedIcon from "@material-ui/icons/SyncAltRounded";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import WhatsMarked from "react-whatsmarked";
import { v4 as uuidv4 } from "uuid";

import { i18n } from "../../translate/i18n";
import { formatWhatsappContactName } from "../../helpers/formatWhatsappDisplay";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import TicketMessagesDialog from "../TicketMessagesDialog";
import UserAvatar from "../ui/UserAvatar";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import pastRelativeDate from "../../helpers/pastRelativeDate";
import TagsLine from "../TagsLine";
import {
  prefetchMessages,
  rememberTicket
} from "../../helpers/conversationCache";

/**
 * Item da lista de atendimentos.
 *
 * O desenho antigo empilhava tudo com posições absolutas: os três botões da
 * aba "Aguardando" ficavam com 23px, colados uns nos outros e por cima do
 * texto. Aqui cada coisa tem o seu lugar em uma coluna: nome e horário,
 * prévia da mensagem, etiquetas, e embaixo as informações do atendimento
 * (conexão, fila, atendente) ou os botões de ação — grandes, separados e
 * com o nome escrito.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    // card compacto e arredondado, com um respiro entre um contato e outro
    item: {
      position: "relative",
      display: "flex",
      alignItems: "flex-start",
      gap: theme.spacing(1.25),
      width: "calc(100% - 12px)",
      margin: "2px 6px",
      padding: theme.spacing(0.875, 1.25, 0.875, 1.5),
      borderRadius: 12,
      overflow: "hidden",
      textAlign: "left",
      cursor: "pointer",
      transition: "background-color .15s ease",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    selected: {
      backgroundColor: t.brand.textSoft,
      boxShadow: `inset 0 0 0 1px ${t.brand.softHover}`,
      "&:hover": { backgroundColor: t.brand.textSoft }
    },
    pending: { cursor: "default" },
    queueStripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderRadius: "0 3px 3px 0"
    },
    avatar: {
      flex: "none",
      width: 42,
      height: 42,
      fontSize: "0.95rem",
      color: "#FFFFFF",
      fontWeight: 700
    },
    body: { flex: 1, minWidth: 0 },
    topLine: {
      display: "flex",
      alignItems: "baseline",
      gap: theme.spacing(1)
    },
    name: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: "0.875rem",
      fontWeight: 600,
      letterSpacing: "-0.005em",
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      "& svg": { fontSize: 15, color: theme.palette.text.secondary }
    },
    time: {
      flex: "none",
      fontSize: "0.6875rem",
      color: theme.palette.text.secondary
    },
    preview: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      marginTop: 1
    },
    mediaPreview: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      "& svg": { fontSize: 17, opacity: 0.85 }
    },
    previewText: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      "& p": { margin: 0 }
    },
    unread: {
      flex: "none",
      minWidth: 18,
      height: 18,
      padding: "0 5px",
      borderRadius: 9,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.6875rem",
      fontWeight: 700,
      backgroundColor: t.semantic.success,
      color: "#FFFFFF"
    },
    presence: {
      fontWeight: 600,
      color: t.semantic.success
    },
    chips: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 4,
      marginTop: 5
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      maxWidth: "100%",
      height: 19,
      padding: "0 7px",
      borderRadius: t.radius.pill,
      fontSize: "0.6875rem",
      fontWeight: 600,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      "& svg": { fontSize: 12, flex: "none" }
    },
    chipUser: {
      paddingLeft: 2,
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    chipQueue: { color: "#FFFFFF" },
    actions: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      marginTop: theme.spacing(1)
    },
    accept: {
      flex: 1,
      minHeight: 40,
      fontWeight: 700,
      borderRadius: t.radius.md
    },
    secondaryAction: {
      flex: "none",
      width: 40,
      height: 40,
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`,
      color: theme.palette.text.secondary
    },
    danger: {
      color: t.semantic.danger,
      borderColor: t.semantic.dangerSoft
    },
    openActions: {
      flex: "none",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      alignSelf: "center"
    },
    iconAction: {
      width: 34,
      height: 34,
      borderRadius: t.radius.sm,
      color: theme.palette.text.secondary
    }
  };
});

// última mensagem de mídia: ícone + nome curto, no lugar do nome do arquivo
const MEDIA_RULES = [
  [/^gif-.*\.mp4$/i, "gif", GifRoundedIcon],
  [/^sticker\.webp$/i, "sticker", EmojiEmotionsRoundedIcon],
  [/\.(jpe?g|png|webp|heic|bmp)$/i, "photo", PhotoCameraRoundedIcon],
  [/\.(ogg|oga|opus|mp3|m4a|aac|wav|webm)$/i, "audio", MicRoundedIcon],
  [/\.(mp4|mov|3gp|mkv)$/i, "video", VideocamRoundedIcon],
  [
    /\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar)$/i,
    "document",
    DescriptionRoundedIcon
  ]
];

const mediaPreview = text => {
  const first = String(text || "")
    .split("\n")[0]
    .trim();
  if (["🔊", "Áudio", "Audio"].includes(first)) {
    return {
      icon: <MicRoundedIcon />,
      label: i18n.t("ticketsList.media.audio")
    };
  }
  if (!first || /\s/.test(first)) return null;
  const rule = MEDIA_RULES.find(([pattern]) => pattern.test(first));
  if (!rule) return null;
  const [, key, Icon] = rule;
  return { icon: <Icon />, label: i18n.t(`ticketsList.media.${key}`) };
};

const TicketListItemCustom = ({ ticket, setTabOpen, groupActionButtons }) => {
  const classes = useStyles();
  const history = useHistory();
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { user } = useContext(AuthContext);

  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const longPress = useRef({ timer: null, fired: false, start: null });

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAcceptTicket = async id => {
    try {
      await api.put(`/tickets/${id}`, { status: "open", userId: user?.id });
    } catch (err) {
      toastError(err);
    }
    history.push(`/tickets/${ticket.uuid}`);
    setTabOpen("open");
  };

  const handleSelectTicket = () => {
    rememberTicket(ticket);
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
  };

  const isPending = ticket.status === "pending";
  const canAct = groupActionButtons || !ticket.isGroup;
  const queueColor = ticket.queue?.color || "#7C7C7C";

  const chips = (
    <div className={classes.chips}>
      {ticket.user?.name && !isPending && (
        <span className={clsx(classes.chip, classes.chipUser)}>
          <UserAvatar user={ticket.user} size={15} />
          {ticket.user.name}
        </span>
      )}
      {ticket.whatsapp?.name && (
        <span className={classes.chip}>
          <SyncAltRoundedIcon />
          {ticket.whatsapp.name}
        </span>
      )}
      <span
        className={clsx(classes.chip, classes.chipQueue)}
        style={{ backgroundColor: queueColor }}
      >
        <AccountTreeOutlinedIcon />
        {ticket.queue?.name || i18n.t("ticketActions.noQueue")}
      </span>
      {ticket.chatbot && (
        <span className={classes.chip}>
          <AndroidIcon />
          Chatbot
        </span>
      )}
      <TagsLine ticket={ticket} />
    </div>
  );

  return (
    <div key={`ticket-${ticket.id}`}>
      <TicketMessagesDialog
        open={openTicketMessageDialog}
        handleClose={() => setOpenTicketMessageDialog(false)}
        ticketId={ticket.id}
      />
      <ButtonBase
        component="div"
        className={clsx(classes.item, {
          [classes.pending]: isPending && canAct,
          [classes.selected]: ticketId && +ticketId === ticket.id
        })}
        onPointerDown={event => {
          longPress.current.fired = false;
          clearTimeout(longPress.current.timer);
          longPress.current.start = { x: event.clientX, y: event.clientY };
          // segurar abre a prévia da conversa
          longPress.current.timer = setTimeout(() => {
            longPress.current.fired = true;
            if (navigator.vibrate) navigator.vibrate(12);
            setOpenTicketMessageDialog(true);
          }, 480);
          if (isPending && canAct) return;
          rememberTicket(ticket);
          prefetchMessages(ticket.id);
        }}
        onPointerMove={event => {
          const start = longPress.current.start;
          if (
            start &&
            Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10
          ) {
            clearTimeout(longPress.current.timer);
          }
        }}
        onPointerUp={() => clearTimeout(longPress.current.timer)}
        onPointerCancel={() => clearTimeout(longPress.current.timer)}
        onContextMenu={event => event.preventDefault()}
        onClick={() => {
          if (longPress.current.fired) {
            longPress.current.fired = false;
            return;
          }
          if (isPending && canAct) return;
          handleSelectTicket();
        }}
      >
        <Tooltip
          arrow
          placement="right"
          title={ticket.queue?.name || i18n.t("ticketActions.noQueue")}
        >
          <span
            className={classes.queueStripe}
            style={{ backgroundColor: queueColor }}
          />
        </Tooltip>

        <Avatar
          className={classes.avatar}
          style={{ backgroundColor: generateColor(ticket?.contact?.number) }}
          src={ticket?.contact?.profilePicUrl}
        >
          {getInitials(ticket?.contact?.name || "")}
        </Avatar>

        <div className={classes.body}>
          <div className={classes.topLine}>
            <span className={classes.name}>
              {ticket.channel === "whatsapp" && <WhatsAppIcon />}
              {formatWhatsappContactName(ticket.contact, ticket)}
            </span>
            {ticket.updatedAt && (
              <span className={classes.time}>
                {pastRelativeDate(parseISO(ticket.updatedAt))}
              </span>
            )}
          </div>

          <div className={classes.preview}>
            <span className={classes.previewText}>
              {["composing", "recording"].includes(ticket?.presence) ? (
                <span className={classes.presence}>
                  {i18n.t(`presence.${ticket.presence}`)}
                </span>
              ) : ticket.lastMessage?.includes("data:image/png;base64") ? (
                "📍 Localização"
              ) : mediaPreview(ticket.lastMessage) ? (
                <span className={classes.mediaPreview}>
                  {mediaPreview(ticket.lastMessage).icon}
                  {mediaPreview(ticket.lastMessage).label}
                </span>
              ) : (
                <WhatsMarked oneline>
                  {(ticket.lastMessage || "").startsWith('{"ticketzvCard"')
                    ? "🪪"
                    : (ticket.lastMessage || "").split("\n")[0]}
                </WhatsMarked>
              )}
            </span>
            {ticket.unreadMessages > 0 && (
              <span className={classes.unread}>{ticket.unreadMessages}</span>
            )}
          </div>

          {chips}

          {isPending && canAct && (
            <div className={classes.actions}>
              <Button
                variant="contained"
                color="primary"
                className={classes.accept}
                startIcon={<DoneRoundedIcon />}
                onClick={e => {
                  e.stopPropagation();
                  handleAcceptTicket(ticket.id);
                }}
              >
                {i18n.t("messagesList.header.buttons.accept")}
              </Button>
            </div>
          )}
        </div>
      </ButtonBase>
    </div>
  );
};

export default TicketListItemCustom;
