import React, { useCallback, useEffect, useRef, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import AttachFileRoundedIcon from "@material-ui/icons/AttachFileRounded";
import SendRoundedIcon from "@material-ui/icons/SendRounded";
import CheckCircleOutlineRoundedIcon from "@material-ui/icons/CheckCircleOutlineRounded";
import ReplayRoundedIcon from "@material-ui/icons/ReplayRounded";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import moment from "moment";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import BoxLoader from "../../components/ui/BoxLoader";
import ConfirmationModal from "../../components/ConfirmationModal";
import {
  Attachments,
  PRIORITIES,
  STATUSES,
  categoryOf,
  priorityOf,
  statusOf,
  toneStyle,
  useSupportLive
} from "./supportShared";

/**
 * A conversa de um chamado, aberta ao lado (no celular, sobe de baixo).
 * Serve para os dois lados: o cliente conversa e pode dar por resolvido; o
 * suporte (super admin) também muda a etapa e a prioridade, e cada mudança
 * aparece na conversa para o cliente acompanhar.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      width: 560,
      maxWidth: "100vw",
      display: "flex",
      flexDirection: "column",
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: {
        width: "100%",
        height: "calc(var(--vh, 100vh) - 16px)",
        borderRadius: "22px 22px 0 0"
      }
    },
    head: {
      flex: "none",
      padding: theme.spacing(2, 1.5, 1.5, 2.5),
      borderBottom: `1px solid ${t.border}`
    },
    headTop: { display: "flex", alignItems: "flex-start", gap: 8 },
    subject: {
      flex: 1,
      minWidth: 0,
      fontSize: "1.125rem",
      fontWeight: 700,
      lineHeight: 1.3,
      color: theme.palette.text.primary,
      overflowWrap: "anywhere"
    },
    meta: {
      marginTop: 4,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    chips: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: theme.spacing(1.25)
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      height: 26,
      padding: "0 10px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      border: "1px solid transparent"
    },
    chipOff: {
      color: `${theme.palette.text.secondary} !important`,
      backgroundColor: "transparent !important",
      borderColor: t.border
    },
    label: {
      marginTop: theme.spacing(1.25),
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    body: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: theme.spacing(2, 2.5),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5),
      backgroundColor: t.surfaceSunken,
      ...theme.scrollbarStyles
    },
    center: { margin: "auto" },
    msg: { display: "flex", flexDirection: "column", maxWidth: "85%" },
    mine: { alignSelf: "flex-end", alignItems: "flex-end" },
    theirs: { alignSelf: "flex-start", alignItems: "flex-start" },
    who: {
      marginBottom: 3,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    bubble: {
      padding: theme.spacing(1, 1.5),
      borderRadius: 16,
      fontSize: "0.9375rem",
      lineHeight: 1.45,
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
      color: theme.palette.text.primary,
      backgroundColor: t.surface,
      border: `1px solid ${t.border}`
    },
    bubbleMine: {
      backgroundColor: t.brand.textSoft,
      borderColor: t.brand.textBorder
    },
    time: {
      marginTop: 3,
      fontSize: "0.6875rem",
      color: theme.palette.text.secondary
    },
    system: {
      alignSelf: "center",
      padding: "4px 12px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary,
      backgroundColor: t.surface,
      border: `1px solid ${t.border}`
    },
    composer: {
      flex: "none",
      padding: theme.spacing(1.25, 1.5),
      paddingBottom: `calc(${theme.spacing(1.25)}px + var(--safe-bottom, 0px))`,
      borderTop: `1px solid ${t.border}`
    },
    pending: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 },
    pendingFile: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      maxWidth: 200,
      height: 28,
      padding: "0 4px 0 10px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.primary,
      "& span": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    },
    row: { display: "flex", alignItems: "flex-end", gap: 6 },
    input: {
      flex: 1,
      padding: "9px 14px",
      borderRadius: 20,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surfaceSunken,
      fontSize: "0.9375rem"
    },
    send: {
      width: 42,
      height: 42,
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      "&:hover": { backgroundColor: t.brand.hover },
      "&.Mui-disabled": { opacity: 0.45, color: t.brand.contrastText }
    },
    closeRow: {
      display: "flex",
      justifyContent: "center",
      paddingTop: theme.spacing(0.5)
    },
    closeBtn: {
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 600
    }
  };
});

const TicketThread = ({ ticketId, isSuper, onClose }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [ticket, setTicket] = useState(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bodyRef = useRef(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    if (!ticketId) return;
    try {
      const { data } = await api.get(`/support/tickets/${ticketId}`);
      setTicket(data);
    } catch (err) {
      toastError(err);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    setTicket(null);
    setText("");
    setFiles([]);
    load();
  }, [load]);

  // chegou resposta ou mudou a etapa deste chamado: recarrega
  useSupportLive(data => {
    if (data?.ticketId !== ticketId) return;
    // excluído (por outra aba ou pelo suporte): a conversa fecha
    if (data.action === "delete") onClose();
    else if (data.action !== "read") load();
  });

  const removeTicket = async () => {
    try {
      await api.delete(`/support/tickets/${ticketId}`);
      toast.success(`Chamado #${ticketId} excluído`);
      onClose();
    } catch (err) {
      toastError(err);
    }
  };

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ticket?.messages?.length]);

  const send = async () => {
    if (sending || (!text.trim() && !files.length)) return;
    setSending(true);
    const form = new FormData();
    form.append("body", text.trim());
    files.forEach(file => form.append("files", file));
    try {
      await api.post(`/support/tickets/${ticketId}/messages`, form);
      setText("");
      setFiles([]);
      await load();
    } catch (err) {
      toastError(err);
    }
    setSending(false);
  };

  const setField = async changes => {
    try {
      await api.put(`/support/tickets/${ticketId}`, changes);
      await load();
    } catch (err) {
      toastError(err);
    }
  };

  const mine = message =>
    isSuper ? message.fromSupport : !message.fromSupport;
  const whoOf = message => {
    if (mine(message)) return "Você";
    if (message.fromSupport) return "Suporte";
    return message.user?.name || "Cliente";
  };
  // mudança de etapa na conversa: o suporte vê o que moveu; o cliente vê
  // uma frase clara do que aquilo significa para ele
  const statusText = message => {
    const status = statusOf(message.body);
    if (isSuper) {
      return mine(message)
        ? `Você moveu para “${status.label}” · cliente avisado`
        : `O cliente ${message.body === "resolved" ? "marcou como resolvido" : "reabriu o chamado"}`;
    }
    if (message.fromSupport) return status.note;
    return message.body === "resolved"
      ? "Você marcou o chamado como resolvido"
      : "Você reabriu o chamado";
  };

  return (
    <Drawer
      anchor={isPhone ? "bottom" : "right"}
      open={!!ticketId}
      onClose={onClose}
      classes={{ paper: classes.paper }}
    >
      {!ticket ? (
        <div className={classes.center} style={{ padding: 48 }}>
          <BoxLoader size={48} />
        </div>
      ) : (
        <>
          <div className={classes.head}>
            <div className={classes.headTop}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={classes.subject}>{ticket.subject}</div>
                <div className={classes.meta}>
                  #{ticket.id}
                  {isSuper && ticket.company ? ` · ${ticket.company.name}` : ""}
                  {ticket.user?.name ? ` · ${ticket.user.name}` : ""} · aberto{" "}
                  {moment(ticket.createdAt).format("DD/MM [às] HH:mm")}
                </div>
              </div>
              {isSuper && (
                <IconButton
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Excluir chamado"
                  title="Excluir chamado"
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              )}
              <IconButton onClick={onClose} aria-label="Fechar">
                <CloseRoundedIcon />
              </IconButton>
            </div>

            {isSuper ? (
              <>
                <div className={classes.label}>Etapa</div>
                <div className={classes.chips}>
                  {STATUSES.map(s => (
                    <ButtonBase
                      key={s.key}
                      className={`${classes.chip}${ticket.status === s.key ? "" : ` ${classes.chipOff}`}`}
                      style={toneStyle(theme, s.tone)}
                      onClick={() => setField({ status: s.key })}
                    >
                      {s.label}
                    </ButtonBase>
                  ))}
                </div>
                <div className={classes.label}>Prioridade</div>
                <div className={classes.chips}>
                  {PRIORITIES.map(p => (
                    <ButtonBase
                      key={p.key}
                      className={`${classes.chip}${ticket.priority === p.key ? "" : ` ${classes.chipOff}`}`}
                      style={toneStyle(theme, p.tone)}
                      onClick={() => setField({ priority: p.key })}
                    >
                      {p.label}
                    </ButtonBase>
                  ))}
                  <span
                    className={classes.chip}
                    style={toneStyle(theme, "neutral")}
                  >
                    {categoryOf(ticket.category).emoji}{" "}
                    {categoryOf(ticket.category).label}
                  </span>
                </div>
              </>
            ) : (
              <div className={classes.chips}>
                <span
                  className={classes.chip}
                  style={toneStyle(theme, statusOf(ticket.status).tone)}
                >
                  {statusOf(ticket.status).client}
                </span>
                <span
                  className={classes.chip}
                  style={toneStyle(theme, "neutral")}
                >
                  {categoryOf(ticket.category).emoji}{" "}
                  {categoryOf(ticket.category).label}
                </span>
                <span
                  className={classes.chip}
                  style={toneStyle(theme, priorityOf(ticket.priority).tone)}
                >
                  Prioridade {priorityOf(ticket.priority).label.toLowerCase()}
                </span>
              </div>
            )}
          </div>

          <div ref={bodyRef} className={classes.body}>
            {ticket.messages.map(message =>
              message.kind === "status" ? (
                <div key={message.id} className={classes.system}>
                  {statusText(message)} ·{" "}
                  {moment(message.createdAt).format("DD/MM HH:mm")}
                </div>
              ) : (
                <div
                  key={message.id}
                  className={`${classes.msg} ${mine(message) ? classes.mine : classes.theirs}`}
                >
                  <span className={classes.who}>{whoOf(message)}</span>
                  {message.body && (
                    <div
                      className={`${classes.bubble}${mine(message) ? ` ${classes.bubbleMine}` : ""}`}
                    >
                      {message.body}
                    </div>
                  )}
                  <Attachments
                    messageId={message.id}
                    files={message.attachments}
                  />
                  <span className={classes.time}>
                    {moment(message.createdAt).format("DD/MM HH:mm")}
                  </span>
                </div>
              )
            )}
          </div>

          <div className={classes.composer}>
            {files.length > 0 && (
              <div className={classes.pending}>
                {files.map((file, i) => (
                  <span
                    key={`${file.name}-${i}`}
                    className={classes.pendingFile}
                  >
                    <span>{file.name}</span>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setFiles(prev => prev.filter((_, j) => j !== i))
                      }
                    >
                      <CloseRoundedIcon style={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                ))}
              </div>
            )}
            <div className={classes.row}>
              <input
                ref={fileRef}
                type="file"
                multiple
                hidden
                onChange={e => {
                  const picked = Array.from(e.target.files || []);
                  setFiles(prev => [...prev, ...picked].slice(0, 10));
                  e.target.value = "";
                }}
              />
              <IconButton
                onClick={() => fileRef.current?.click()}
                aria-label="Anexar"
              >
                <AttachFileRoundedIcon />
              </IconButton>
              <InputBase
                className={classes.input}
                multiline
                maxRows={6}
                placeholder={
                  isSuper ? "Responder ao cliente…" : "Escreva sua mensagem…"
                }
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && !isPhone) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <IconButton
                className={classes.send}
                disabled={sending || (!text.trim() && !files.length)}
                onClick={send}
                aria-label="Enviar"
              >
                <SendRoundedIcon />
              </IconButton>
            </div>
            {!isSuper && (
              <div className={classes.closeRow}>
                {ticket.status === "resolved" ? (
                  <Button
                    size="small"
                    className={classes.closeBtn}
                    startIcon={<ReplayRoundedIcon />}
                    onClick={() => setField({ status: "open" })}
                  >
                    Reabrir chamado
                  </Button>
                ) : (
                  <Button
                    size="small"
                    className={classes.closeBtn}
                    startIcon={<CheckCircleOutlineRoundedIcon />}
                    onClick={() => setField({ status: "resolved" })}
                  >
                    Meu problema foi resolvido
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
      <ConfirmationModal
        title={`Excluir o chamado #${ticketId}?`}
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={removeTicket}
      >
        A conversa e os anexos são apagados de vez, e o chamado some também para
        o cliente. Não dá para desfazer.
      </ConfirmationModal>
    </Drawer>
  );
};

export default TicketThread;
