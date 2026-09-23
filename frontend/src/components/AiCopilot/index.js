import React, { useCallback, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import Collapse from "@material-ui/core/Collapse";
import CircularProgress from "@material-ui/core/CircularProgress";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import RefreshRoundedIcon from "@material-ui/icons/RefreshRounded";
import AutoAwesomeIcon from "@material-ui/icons/OfflineBoltRounded";
import SwapHorizRoundedIcon from "@material-ui/icons/SwapHorizRounded";
import ViewWeekRoundedIcon from "@material-ui/icons/ViewWeekRounded";
import NoteAddOutlinedIcon from "@material-ui/icons/NoteAddOutlined";
import ArrowForwardRoundedIcon from "@material-ui/icons/ArrowForwardRounded";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";

/**
 * O assistente dentro da conversa (mesma chave do "Assistente de IA das filas").
 *
 * Em vez de um painel na lateral, ele fala num cartão logo acima da barra de
 * envio, como alguém que está lendo a conversa junto com o atendente — e só
 * o atendente vê. Conta como a conversa está indo, sugere respostas (tocar
 * põe o texto na barra, sem enviar) e traz os botões de levar para uma fila,
 * mover no Kanban e guardar o resumo nas anotações.
 *
 * Para gastar pouco: um pedido por conversa, e o resultado fica guardado até
 * chegar mensagem nova (o botão de recarregar força um novo).
 */
export const SUGGESTION_EVENT = "tkv:ai-suggestion";

const MOOD = {
  good: { label: "indo bem", color: "#12864B", emoji: "🙂" },
  neutral: { label: "tranquila", color: "#6B6B74", emoji: "😐" },
  bad: { label: "pedindo atenção", color: "#C81E36", emoji: "😟" }
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    wrap: {
      display: "flex",
      justifyContent: "center",
      padding: theme.spacing(0, 2, 1),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(0, 1, 1) }
    },
    card: {
      position: "relative",
      width: "100%",
      maxWidth: 760,
      borderRadius: 18,
      padding: "12px 16px 16px 20px",
      backgroundColor: t.surfaceRaised || t.surface,
      border: `1px solid ${t.brand.textBorder}`,
      boxShadow: "0 18px 44px -28px rgba(0, 0, 0, 0.6)",
      animation: "$rise .26s cubic-bezier(.2,.9,.3,1) both",
      // faixa da marca à esquerda: é a "voz" do assistente na conversa
      "&::before": {
        content: '""',
        position: "absolute",
        left: 8,
        top: 16,
        bottom: 16,
        width: 3,
        borderRadius: 3,
        background: `linear-gradient(180deg, ${t.brand.main}, ${t.semantic.info})`
      }
    },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(10px)" },
      to: { opacity: 1, transform: "none" }
    },
    head: { display: "flex", alignItems: "center", gap: 8 },
    who: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: t.brand.text,
      "& svg": { fontSize: 18 }
    },
    only: {
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    grow: { flex: 1 },
    // etiqueta do clima e o porquê ao lado (embaixo quando falta largura)
    moodLine: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      marginTop: 10
    },
    mood: {
      flex: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 10px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 700,
      whiteSpace: "nowrap",
      color: "#fff"
    },
    moodWhy: {
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    subject: {
      fontSize: "1rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      marginTop: 8
    },
    text: {
      marginTop: 4,
      fontSize: "0.9375rem",
      lineHeight: 1.55,
      color: theme.palette.text.primary
    },
    next: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 10,
      padding: "8px 12px",
      borderRadius: 12,
      backgroundColor: t.brand.textSoft,
      color: t.brand.text,
      fontSize: "0.875rem",
      fontWeight: 600,
      lineHeight: 1.45,
      "& svg": { fontSize: 18, flex: "none", marginTop: 1 }
    },
    label: {
      marginTop: 14,
      marginBottom: 6,
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    replies: { display: "flex", flexDirection: "column", gap: 6 },
    reply: {
      width: "100%",
      display: "block",
      padding: "9px 12px",
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surfaceSunken,
      fontSize: "0.875rem",
      lineHeight: 1.45,
      textAlign: "left",
      color: theme.palette.text.primary,
      transition: "transform .12s ease, border-color .12s ease",
      "&:hover": { borderColor: t.brand.main, transform: "translateY(-1px)" }
    },
    actions: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
    action: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 36,
      padding: "0 14px",
      borderRadius: t.radius.pill,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      "& svg": { fontSize: 18, color: t.brand.text },
      "&:hover": { backgroundColor: t.surfaceHover },
      "&.Mui-disabled": { opacity: 0.5 }
    },
    done: {
      borderColor: "#12864B",
      color: "#12864B",
      "& svg": { color: "#12864B" }
    },
    center: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 0 2px",
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    retry: {
      marginLeft: 4,
      fontWeight: 700,
      color: t.brand.text,
      textDecoration: "underline"
    },
    foot: {
      marginTop: 12,
      fontSize: "0.6875rem",
      color: theme.palette.text.secondary
    }
  };
});

const AiCopilot = ({ open, onClose, ticket }) => {
  const classes = useStyles();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState([]);

  const load = useCallback(
    async force => {
      if (!ticket?.id) return;
      setLoading(true);
      setError(null);
      try {
        const { data: result } = await api.get(
          `/ai/tickets/${ticket.id}/analysis`,
          { params: force ? { force: true } : {} }
        );
        setData(result);
        setApplied([]);
      } catch (err) {
        setError(err?.response?.data?.error || "ERR_UNKNOWN");
      }
      setLoading(false);
    },
    [ticket?.id]
  );

  useEffect(() => {
    if (open) load(false);
  }, [open, load]);

  const apply = async (what, payload, message) => {
    setApplying(true);
    try {
      await api.post(`/ai/tickets/${ticket.id}/apply`, payload);
      setApplied(prev => [...prev, what]);
      toast.success(message);
    } catch (err) {
      toastError(err);
    }
    setApplying(false);
  };

  const insertReply = text =>
    window.dispatchEvent(new CustomEvent(SUGGESTION_EVENT, { detail: text }));

  const mood = MOOD[data?.sentiment] || MOOD.neutral;
  const inQueue = ticket?.queueId === data?.queueId;
  const noteSaved = applied.includes("note");

  return (
    <Collapse in={open} timeout={180} unmountOnExit>
      <div className={classes.wrap}>
        <div className={classes.card}>
          <div className={classes.head}>
            <span className={classes.who}>
              <AutoAwesomeIcon />
              Assistente
            </span>
            <span className={classes.only}>· só você vê</span>
            <span className={classes.grow} />
            <Tooltip title="Ler a conversa de novo">
              <span>
                <IconButton
                  size="small"
                  onClick={() => load(true)}
                  disabled={loading}
                >
                  <RefreshRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton size="small" onClick={onClose} aria-label="Fechar">
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </div>

          {loading && !data && (
            <div className={classes.center}>
              <CircularProgress size={18} />
              Lendo a conversa…
            </div>
          )}

          {!loading && error && (
            <div className={classes.center}>
              {error === "ERR_AI_NOT_CONFIGURED" ? (
                "Configure a chave em Configurações > Assistente de IA das filas."
              ) : error === "ERR_AI_NO_MESSAGES" ? (
                "Ainda não há mensagens para eu ler nesta conversa."
              ) : (
                <>
                  Não consegui ler a conversa agora.
                  <ButtonBase
                    className={classes.retry}
                    onClick={() => load(true)}
                  >
                    Tentar de novo
                  </ButtonBase>
                </>
              )}
            </div>
          )}

          {data && (
            <>
              <div className={classes.moodLine}>
                <span
                  className={classes.mood}
                  style={{ backgroundColor: mood.color }}
                >
                  {mood.emoji} Conversa {mood.label}
                </span>
                {data.sentimentReason && (
                  <span className={classes.moodWhy}>
                    {data.sentimentReason}
                  </span>
                )}
              </div>

              {data.subject && (
                <div className={classes.subject}>{data.subject}</div>
              )}
              {data.summary && (
                <div className={classes.text}>{data.summary}</div>
              )}

              {data.nextStep && (
                <div className={classes.next}>
                  <ArrowForwardRoundedIcon />
                  {data.nextStep}
                </div>
              )}

              {!!data.replies?.length && (
                <>
                  <div className={classes.label}>
                    Posso responder assim — toque para pôr na barra
                  </div>
                  <div className={classes.replies}>
                    {data.replies.map((reply, index) => (
                      <ButtonBase
                        key={index}
                        className={classes.reply}
                        onClick={() => insertReply(reply)}
                      >
                        {reply}
                      </ButtonBase>
                    ))}
                  </div>
                </>
              )}

              <div className={classes.actions}>
                {data.queueId && (
                  <ButtonBase
                    className={`${classes.action} ${
                      inQueue || applied.includes("queue") ? classes.done : ""
                    }`}
                    disabled={applying || inQueue || applied.includes("queue")}
                    onClick={() =>
                      apply(
                        "queue",
                        { queueId: data.queueId },
                        `Atendimento movido para ${data.queueName}`
                      )
                    }
                  >
                    {inQueue || applied.includes("queue") ? (
                      <CheckRoundedIcon />
                    ) : (
                      <SwapHorizRoundedIcon />
                    )}
                    {inQueue || applied.includes("queue")
                      ? `Na fila ${data.queueName}`
                      : `Levar para ${data.queueName}`}
                  </ButtonBase>
                )}

                {data.tagId && (
                  <ButtonBase
                    className={`${classes.action} ${
                      applied.includes("tag") ? classes.done : ""
                    }`}
                    disabled={applying || applied.includes("tag")}
                    onClick={() =>
                      apply(
                        "tag",
                        { tagId: data.tagId },
                        `Movido para "${data.tagName}" no Kanban`
                      )
                    }
                  >
                    {applied.includes("tag") ? (
                      <CheckRoundedIcon />
                    ) : (
                      <ViewWeekRoundedIcon />
                    )}
                    Kanban: {data.tagName}
                  </ButtonBase>
                )}

                <ButtonBase
                  className={`${classes.action} ${
                    noteSaved ? classes.done : ""
                  }`}
                  disabled={applying || !data.summary || noteSaved}
                  onClick={() =>
                    apply(
                      "note",
                      {
                        note: `${data.subject ? `${data.subject}: ` : ""}${
                          data.summary
                        }`
                      },
                      "Resumo guardado nas anotações"
                    )
                  }
                >
                  {noteSaved ? <CheckRoundedIcon /> : <NoteAddOutlinedIcon />}
                  {noteSaved ? "Resumo guardado" : "Guardar resumo"}
                </ButtonBase>
              </div>

              <div className={classes.foot}>
                Escrito por IA a partir das últimas mensagens. Confira antes de
                enviar.
              </div>
            </>
          )}
        </div>
      </div>
    </Collapse>
  );
};

export default AiCopilot;
