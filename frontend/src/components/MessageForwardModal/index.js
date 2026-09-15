import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Dialog from "@material-ui/core/Dialog";
import Slide from "@material-ui/core/Slide";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import ButtonBase from "@material-ui/core/ButtonBase";
import Avatar from "@material-ui/core/Avatar";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";
import SendRoundedIcon from "@material-ui/icons/SendRounded";
import ImageOutlinedIcon from "@material-ui/icons/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import MicNoneRoundedIcon from "@material-ui/icons/MicNoneRounded";
import VideocamOutlinedIcon from "@material-ui/icons/VideocamOutlined";
import GroupRoundedIcon from "@material-ui/icons/GroupRounded";

import api from "../../services/api";
import BoxLoader from "../ui/BoxLoader";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import { formatWhatsappContactNumber } from "../../helpers/formatWhatsappDisplay";

/**
 * Encaminhar, como no WhatsApp: a lista de conversas já aparece aberta,
 * dá para marcar até 5 destinos, pesquisar por nome ou número e escrever
 * uma mensagem que vai junto. Embaixo, a prévia do que está sendo
 * encaminhado. No celular ocupa a tela inteira; no computador, uma janela.
 */
const MAX = 5;

const SlideUp = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      height: "min(720px, calc(var(--vh, 100vh) - 48px))",
      borderRadius: t.radius.xl,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      [theme.breakpoints.down("xs")]: {
        height: "var(--vh, 100vh)",
        borderRadius: 0,
        paddingTop: "var(--safe-top, 0px)"
      }
    },
    head: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "12px 12px 8px 8px",
      backgroundColor: t.brand.main,
      color: t.brand.contrastText
    },
    headTitle: { flex: 1, fontSize: "1.0625rem", fontWeight: 700 },
    headClose: { color: "inherit" },
    headCount: { fontSize: "0.8125rem", opacity: 0.85, marginRight: 8 },
    searchBox: {
      flex: "none",
      padding: "10px 12px",
      borderBottom: `1px solid ${t.border}`
    },
    search: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 40,
      padding: "0 14px",
      borderRadius: 999,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary,
      "& input": { fontSize: "0.9375rem" }
    },
    chips: {
      flex: "none",
      display: "flex",
      gap: 12,
      overflowX: "auto",
      padding: "10px 14px 4px",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" }
    },
    chip: {
      position: "relative",
      flex: "none",
      width: 56,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      fontSize: "0.6875rem",
      color: theme.palette.text.secondary,
      animation: "$pop .25s cubic-bezier(.34, 1.56, .64, 1) both",
      "& span": {
        width: "100%",
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    },
    chipX: {
      position: "absolute",
      top: -2,
      right: 2,
      width: 20,
      height: 20,
      borderRadius: "50%",
      backgroundColor: theme.palette.text.secondary,
      color: t.surface,
      border: `2px solid ${t.surface}`,
      "& svg": { fontSize: 12 }
    },
    list: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: "4px 0 12px",
      ...theme.scrollbarStyles
    },
    section: {
      padding: "14px 20px 6px",
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: t.brand.text,
      textTransform: "uppercase",
      letterSpacing: "0.03em"
    },
    row: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 14,
      padding: "9px 20px",
      textAlign: "left",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    check: {
      flex: "none",
      width: 22,
      height: 22,
      borderRadius: 6,
      border: `2px solid ${t.borderStrong}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "transparent",
      transition: "all .15s ease",
      "& svg": { fontSize: 16 }
    },
    checkOn: {
      backgroundColor: t.brand.main,
      borderColor: t.brand.main,
      color: t.brand.contrastText
    },
    avatar: { width: 46, height: 46, fontWeight: 700, color: "#FFFFFF" },
    rowText: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      paddingBottom: 2
    },
    rowName: {
      fontSize: "1rem",
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    rowSub: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "flex",
      alignItems: "center",
      gap: 4,
      "& svg": { fontSize: 15 }
    },
    empty: {
      padding: "32px 20px",
      textAlign: "center",
      color: theme.palette.text.secondary
    },
    center: { display: "flex", justifyContent: "center", padding: 20 },
    foot: {
      flex: "none",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: "10px 12px",
      paddingBottom: "calc(10px + var(--safe-bottom, 0px))",
      borderTop: `1px solid ${t.border}`,
      backgroundColor: t.chat.bar,
      animation: "$slide .25s ease both"
    },
    preview: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 10px",
      borderRadius: 10,
      borderLeft: `4px solid ${t.brand.main}`,
      backgroundColor: t.surface,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 20, flex: "none" }
    },
    previewText: {
      flex: 1,
      minWidth: 0,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      wordBreak: "break-word"
    },
    previewThumb: {
      width: 40,
      height: 40,
      borderRadius: 6,
      objectFit: "cover",
      flex: "none"
    },
    composer: { display: "flex", alignItems: "flex-end", gap: 8 },
    caption: {
      flex: 1,
      minHeight: 42,
      padding: "8px 14px",
      borderRadius: 21,
      backgroundColor: t.chat.input,
      fontSize: "0.9375rem"
    },
    send: {
      flex: "none",
      width: 48,
      height: 48,
      borderRadius: "50%",
      backgroundColor: t.brand.main,
      color: t.brand.contrastText,
      boxShadow: `0 6px 16px -6px ${t.brand.main}`,
      animation: "$pop .3s cubic-bezier(.34, 1.56, .64, 1) both",
      "&:hover": { backgroundColor: t.brand.hover },
      "&.Mui-disabled": { opacity: 0.6, color: t.brand.contrastText }
    },
    to: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    toNames: {
      flex: 1,
      minWidth: 0,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    queue: { fontSize: "0.8125rem", minWidth: 120 },
    "@keyframes pop": {
      from: { opacity: 0, transform: "scale(.6)" },
      to: { opacity: 1, transform: "none" }
    },
    "@keyframes slide": {
      from: { opacity: 0, transform: "translateY(16px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const mediaIcon = message => {
  const type = message?.mediaType;
  if (type === "image") return <ImageOutlinedIcon />;
  if (type === "video") return <VideocamOutlinedIcon />;
  if (type === "audio") return <MicNoneRoundedIcon />;
  if (message?.mediaUrl) return <InsertDriveFileOutlinedIcon />;
  return null;
};

const MessageForwardModal = ({
  modalOpen,
  onClose,
  ticketId,
  messageId,
  message,
  initialContact
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const { user } = useContext(AuthContext);
  const f = (key, opts) => i18n.t(`forwardModal.${key}`, opts);

  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [caption, setCaption] = useState("");
  const [queues, setQueues] = useState([]);
  const [queueId, setQueueId] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!modalOpen) return;
    setQuery("");
    setCaption("");
    setSelected(initialContact?.id ? [initialContact] : []);
  }, [modalOpen, initialContact]);

  // conversas recentes e filas
  useEffect(() => {
    if (!modalOpen) return undefined;
    let alive = true;
    const ownQueues = user?.queues || [];
    const applyQueues = list => {
      if (!alive) return;
      setQueues(list);
      setQueueId(list[0]?.id || "");
    };
    if (ownQueues.length) applyQueues(ownQueues);
    else
      api
        .get("/queue")
        .then(({ data }) => applyQueues(Array.isArray(data) ? data : []))
        .catch(() => {});

    api
      .get("/tickets", {
        params: {
          status: "open",
          showAll: user?.profile === "admin" ? "true" : "false",
          queueIds: JSON.stringify(ownQueues.map(q => q.id))
        }
      })
      .then(({ data }) => {
        if (!alive) return;
        const seen = new Set();
        const list = [];
        (data?.tickets || []).forEach(ticket => {
          const c = ticket.contact;
          if (!c?.id || seen.has(c.id) || ticket.id === ticketId) return;
          seen.add(c.id);
          list.push(c);
        });
        setRecent(list.slice(0, 8));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [modalOpen, user, ticketId]);

  // contatos (com busca e rolagem infinita)
  useEffect(() => {
    setPage(1);
    setContacts([]);
  }, [query, modalOpen]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    let alive = true;
    setLoading(true);
    const timer = setTimeout(
      async () => {
        try {
          const { data } = await api.get("/contacts", {
            params: { searchParam: query, pageNumber: page }
          });
          if (!alive) return;
          setContacts(prev =>
            page === 1 ? data.contacts : [...prev, ...data.contacts]
          );
          setHasMore(!!data.hasMore);
        } catch (err) {
          if (alive) toastError(err);
        }
        if (alive) setLoading(false);
      },
      query ? 350 : 0
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, page, modalOpen]);

  const isSelected = contact => selected.some(c => c.id === contact.id);

  const toggle = contact => {
    if (isSelected(contact)) {
      setSelected(list => list.filter(c => c.id !== contact.id));
      return;
    }
    if (selected.length >= MAX) {
      toast.info(f("max", { count: MAX }));
      return;
    }
    setSelected(list => [...list, contact]);
  };

  const onScroll = e => {
    const el = e.currentTarget;
    if (
      !loading &&
      hasMore &&
      el.scrollHeight - el.scrollTop - el.clientHeight < 160
    ) {
      setPage(p => p + 1);
    }
  };

  const recentIds = useMemo(() => new Set(recent.map(c => c.id)), [recent]);
  const showRecent = !query && recent.length > 0;
  const needsQueue = selected.some(c => !c.isGroup);

  const handleSend = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    let ok = 0;
    for (const contact of selected) {
      try {
        const { data } = await api.post("/messages/forward", {
          contactId: contact.id,
          ticketId,
          messageId,
          queueId: queueId || undefined
        });
        ok += 1;
        const text = caption.trim();
        if (text && data?.ticketId) {
          await api
            .post(`/messages/${data.ticketId}`, {
              read: 1,
              fromMe: true,
              mediaUrl: "",
              body: text
            })
            .catch(() => {});
        }
      } catch (err) {
        toastError(err);
      }
    }
    setSending(false);
    if (ok) {
      toast.success(f("sent", { count: ok }));
      onClose();
    }
  };

  const row = contact => {
    const on = isSelected(contact);
    const number = formatWhatsappContactNumber(contact);
    return (
      <ButtonBase
        key={contact.id}
        className={classes.row}
        onClick={() => toggle(contact)}
        role="checkbox"
        aria-checked={on}
      >
        <span className={`${classes.check}${on ? ` ${classes.checkOn}` : ""}`}>
          <CheckRoundedIcon />
        </span>
        <Avatar
          src={contact.profilePicUrl || undefined}
          className={classes.avatar}
          style={{ backgroundColor: generateColor(contact.number) }}
        >
          {getInitials(contact.name || "")}
        </Avatar>
        <span className={classes.rowText}>
          <span className={classes.rowName}>{contact.name || number}</span>
          <span className={classes.rowSub}>
            {contact.isGroup ? (
              <>
                <GroupRoundedIcon />
                {f("group")}
              </>
            ) : (
              number
            )}
          </span>
        </span>
      </ButtonBase>
    );
  };

  const previewIcon = mediaIcon(message);
  const previewText =
    message?.body && !(message?.mediaUrl && message.body === message.mediaUrl)
      ? message.body
      : f(`media.${message?.mediaType || "document"}`, {
          defaultValue: f("media.document")
        });

  return (
    <Dialog
      open={modalOpen}
      onClose={() => !sending && onClose()}
      fullScreen={isPhone}
      fullWidth
      maxWidth="xs"
      TransitionComponent={isPhone ? SlideUp : undefined}
      classes={{ paper: classes.paper }}
    >
      <div className={classes.head}>
        <IconButton
          className={classes.headClose}
          onClick={onClose}
          aria-label={i18n.t("common.close")}
          disabled={sending}
        >
          <CloseRoundedIcon />
        </IconButton>
        <span className={classes.headTitle}>{f("title")}</span>
        {selected.length > 0 && (
          <span className={classes.headCount}>
            {selected.length}/{MAX}
          </span>
        )}
      </div>

      <div className={classes.searchBox}>
        <div className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <InputBase
            fullWidth
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={f("search")}
            inputProps={{ "aria-label": f("search") }}
          />
        </div>
      </div>

      {selected.length > 0 && (
        <div className={classes.chips}>
          {selected.map(contact => (
            <div key={contact.id} className={classes.chip}>
              <Avatar
                src={contact.profilePicUrl || undefined}
                className={classes.avatar}
                style={{ backgroundColor: generateColor(contact.number) }}
              >
                {getInitials(contact.name || "")}
              </Avatar>
              <IconButton
                className={classes.chipX}
                onClick={() => toggle(contact)}
                aria-label={f("remove")}
              >
                <CloseRoundedIcon />
              </IconButton>
              <span>{(contact.name || "").split(" ")[0]}</span>
            </div>
          ))}
        </div>
      )}

      <div className={classes.list} ref={listRef} onScroll={onScroll}>
        {showRecent && (
          <>
            <div className={classes.section}>{f("recent")}</div>
            {recent.map(row)}
          </>
        )}
        <div className={classes.section}>{f("contacts")}</div>
        {contacts.filter(c => query || !recentIds.has(c.id)).map(row)}
        {loading && (
          <div className={classes.center}>
            <BoxLoader size={32} />
          </div>
        )}
        {!loading && contacts.length === 0 && (
          <div className={classes.empty}>{f("empty")}</div>
        )}
      </div>

      {selected.length > 0 && (
        <div className={classes.foot}>
          {message && (
            <div className={classes.preview}>
              {message.mediaType === "image" && message.mediaUrl ? (
                <img
                  src={message.mediaUrl}
                  alt=""
                  className={classes.previewThumb}
                />
              ) : (
                previewIcon
              )}
              <span className={classes.previewText}>{previewText}</span>
            </div>
          )}
          <div className={classes.composer}>
            <InputBase
              className={classes.caption}
              multiline
              maxRows={4}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={f("caption")}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && !isPhone) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <IconButton
              className={classes.send}
              onClick={handleSend}
              disabled={
                sending || (needsQueue && !queueId && queues.length > 0)
              }
              aria-label={f("send")}
            >
              {sending ? (
                <BoxLoader size={22} color="currentColor" />
              ) : (
                <SendRoundedIcon />
              )}
            </IconButton>
          </div>
          <div className={classes.to}>
            <span className={classes.toNames}>
              {selected.map(c => c.name).join(", ")}
            </span>
            {needsQueue && queues.length > 1 && (
              <Select
                value={queueId}
                onChange={e => setQueueId(e.target.value)}
                className={classes.queue}
                disableUnderline
                displayEmpty
                title={f("queueHint")}
              >
                {queues.map(q => (
                  <MenuItem key={q.id} value={q.id}>
                    {f("queue", { name: q.name })}
                  </MenuItem>
                ))}
              </Select>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default MessageForwardModal;
