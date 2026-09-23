import React, { useCallback, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import Avatar from "@material-ui/core/Avatar";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import CircularProgress from "@material-ui/core/CircularProgress";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import AutoAwesomeIcon from "@material-ui/icons/OfflineBoltRounded";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import ViewWeekRoundedIcon from "@material-ui/icons/ViewWeekRounded";
import PersonOutlineRoundedIcon from "@material-ui/icons/PersonOutlineRounded";
import FlagRoundedIcon from "@material-ui/icons/FlagRounded";
import ChatBubbleOutlineRoundedIcon from "@material-ui/icons/ChatBubbleOutlineRounded";
import moment from "moment";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";

/**
 * Mapa da conversa: por onde o contato já passou.
 *
 * Cada atendimento vira um trilho de cima para baixo — como começou, cada
 * mudança de fila, status, atendente ou coluna do Kanban, e como está agora.
 * O que a IA moveu fica marcado com o raio, para dar para separar o que foi
 * decisão da equipe do que foi sugestão aceita.
 *
 * Os passos vêm da tabela TicketJourneys (gravada quando a mudança acontece);
 * o resumo do topo é o que a IA já tinha guardado do contato — nada aqui
 * chama a IA de novo, então abrir o mapa não gasta tokens.
 */
const STATUS = {
  open: { label: "Em atendimento", color: "#1E7F4E" },
  pending: { label: "Aguardando", color: "#B26A00" },
  closed: { label: "Resolvido", color: "#5A5A66" }
};
const MOOD = {
  good: { label: "Conversa boa", color: "#12864B" },
  neutral: { label: "Conversa neutra", color: "#6B6B74" },
  bad: { label: "Conversa ruim", color: "#C81E36" }
};

const STEP_ICON = {
  queue: <AccountTreeOutlinedIcon />,
  status: <FlagRoundedIcon />,
  user: <PersonOutlineRoundedIcon />,
  tag: <ViewWeekRoundedIcon />
};

const stepText = step => {
  const to = step.to || "—";
  const from = step.from;
  switch (step.kind) {
    case "queue":
      return from ? `Da fila ${from} para ${to}` : `Entrou na fila ${to}`;
    case "status":
      return `${STATUS[from]?.label || from || "Novo"} → ${
        STATUS[to]?.label || to
      }`;
    case "user":
      return from ? `De ${from} para ${to}` : `Assumido por ${to}`;
    case "tag":
      return `Entrou na coluna ${to}`;
    default:
      return to;
  }
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      width: 720,
      maxWidth: "calc(100vw - 24px)",
      maxHeight: "calc(100vh - 48px)",
      borderRadius: 20,
      backgroundColor: t.canvas,
      [theme.breakpoints.down("xs")]: {
        margin: 0,
        width: "100vw",
        maxWidth: "100vw",
        maxHeight: "100vh",
        height: "100%",
        borderRadius: 0
      }
    },
    head: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(2, 2, 1.5, 2.5),
      borderBottom: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    avatar: { width: 44, height: 44, color: "#fff", fontWeight: 700 },
    title: {
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    sub: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    grow: { flex: 1 },
    body: {
      overflowY: "auto",
      padding: theme.spacing(2, 2.5, 3),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2),
      ...theme.scrollbarStyles
    },
    center: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(6, 3),
      textAlign: "center",
      color: theme.palette.text.secondary
    },
    // ── resumo da IA + números ──
    top: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10
    },
    stat: {
      flex: "1 1 120px",
      padding: "10px 14px",
      borderRadius: 14,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    statValue: {
      fontSize: "1.375rem",
      fontWeight: 700,
      lineHeight: 1.1,
      color: theme.palette.text.primary
    },
    statLabel: {
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
    },
    ai: {
      padding: "12px 14px",
      borderRadius: 14,
      border: `1px solid ${t.brand.textBorder}`,
      backgroundColor: t.brand.textSoft
    },
    aiHead: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: t.brand.text,
      "& svg": { fontSize: 18 }
    },
    aiText: {
      marginTop: 6,
      fontSize: "0.9375rem",
      lineHeight: 1.5,
      color: theme.palette.text.primary
    },
    chips: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
    chip: {
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 700,
      color: "#fff"
    },
    softChip: {
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 600,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      color: theme.palette.text.secondary
    },
    ask: {
      marginTop: 8,
      padding: "6px 12px",
      borderRadius: 999,
      border: `1px solid ${t.brand.textBorder}`,
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: t.brand.text
    },
    // ── um atendimento ──
    ticket: {
      borderRadius: 16,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden"
    },
    ticketHead: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 14px",
      borderBottom: `1px solid ${t.border}`,
      backgroundColor: t.surfaceSunken
    },
    ticketTitle: {
      fontSize: "0.875rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    ticketWhen: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    open: {
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 700,
      color: t.brand.text,
      border: `1px solid ${t.brand.textBorder}`
    },
    // ── trilho ──
    rail: { padding: "12px 14px 14px 14px" },
    step: {
      position: "relative",
      display: "flex",
      gap: 12,
      paddingBottom: 14,
      // linha que liga um passo ao outro
      "&:not(:last-child)::before": {
        content: '""',
        position: "absolute",
        left: 15,
        top: 32,
        bottom: 0,
        width: 2,
        backgroundColor: t.border
      }
    },
    dot: {
      flex: "none",
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 18 }
    },
    dotAi: {
      borderColor: t.brand.main,
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    dotStart: {
      borderColor: t.borderStrong,
      color: theme.palette.text.primary
    },
    stepBody: { flex: 1, minWidth: 0, paddingTop: 4 },
    stepText: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    stepMeta: {
      marginTop: 2,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
    },
    quote: {
      marginTop: 4,
      padding: "8px 10px",
      borderRadius: 10,
      backgroundColor: t.surfaceSunken,
      fontSize: "0.8125rem",
      lineHeight: 1.45,
      color: theme.palette.text.primary
    },
    aiMark: {
      marginLeft: 6,
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: t.brand.text
    }
  };
});

const ContactJourney = ({ open, onClose, contact }) => {
  const classes = useStyles();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);

  const load = useCallback(async () => {
    if (!contact?.id) return;
    setLoading(true);
    try {
      const { data: result } = await api.get(
        `/ai/contacts/${contact.id}/journey`
      );
      setData(result);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  }, [contact?.id]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const askAi = async () => {
    setAsking(true);
    try {
      const { data: summary } = await api.get(
        `/ai/contacts/${contact.id}/summary`
      );
      setData(prev => ({ ...prev, summary }));
    } catch (err) {
      toastError(err);
    }
    setAsking(false);
  };

  const tickets = data?.tickets || [];
  const aiMoves = tickets.reduce(
    (total, ticket) => total + ticket.steps.filter(step => step.byAi).length,
    0
  );
  const queues = [
    ...new Set(
      tickets.flatMap(ticket => [
        ...(ticket.queue ? [ticket.queue.name] : []),
        ...ticket.steps.filter(s => s.kind === "queue" && s.to).map(s => s.to)
      ])
    )
  ];
  const mood = MOOD[data?.summary?.sentiment];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      classes={{ paper: classes.paper }}
      PaperProps={{ style: { display: "flex", flexDirection: "column" } }}
    >
      <div className={classes.head}>
        <Avatar
          src={contact?.profilePicUrl}
          className={classes.avatar}
          style={{ backgroundColor: generateColor(contact?.number) }}
        >
          {getInitials(contact?.name)}
        </Avatar>
        <div>
          <div className={classes.title}>Mapa da conversa</div>
          <div className={classes.sub}>{contact?.name}</div>
        </div>
        <span className={classes.grow} />
        <IconButton size="small" onClick={onClose} aria-label="Fechar">
          <CloseRoundedIcon />
        </IconButton>
      </div>

      <div className={classes.body}>
        {loading && !data && (
          <div className={classes.center}>
            <CircularProgress size={26} />
            Montando o mapa…
          </div>
        )}

        {data && !tickets.length && (
          <div className={classes.center}>
            Este contato ainda não tem atendimentos para mapear.
          </div>
        )}

        {!!tickets.length && (
          <>
            <div className={classes.top}>
              <div className={classes.stat}>
                <div className={classes.statValue}>{tickets.length}</div>
                <div className={classes.statLabel}>
                  {tickets.length === 1 ? "atendimento" : "atendimentos"}
                </div>
              </div>
              <div className={classes.stat}>
                <div className={classes.statValue}>{queues.length}</div>
                <div className={classes.statLabel}>
                  {queues.length === 1 ? "fila" : "filas"} por onde passou
                </div>
              </div>
              <div className={classes.stat}>
                <div className={classes.statValue}>{aiMoves}</div>
                <div className={classes.statLabel}>movimentos da IA</div>
              </div>
            </div>

            <div className={classes.ai}>
              <span className={classes.aiHead}>
                <AutoAwesomeIcon />O que a IA entendeu deste contato
              </span>
              {data.summary ? (
                <>
                  <div className={classes.aiText}>{data.summary.about}</div>
                  <div className={classes.chips}>
                    {mood && (
                      <span
                        className={classes.chip}
                        style={{ backgroundColor: mood.color }}
                      >
                        {mood.label}
                        {data.summary.sentimentReason
                          ? ` · ${data.summary.sentimentReason}`
                          : ""}
                      </span>
                    )}
                    {(data.summary.topics || []).map(topic => (
                      <span key={topic} className={classes.softChip}>
                        {topic}
                      </span>
                    ))}
                  </div>
                  {data.summary.alert && (
                    <div className={classes.aiText}>
                      ⚠️ {data.summary.alert}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={classes.aiText}>
                    Ainda não pedi um resumo deste contato.
                  </div>
                  <ButtonBase
                    className={classes.ask}
                    onClick={askAi}
                    disabled={asking}
                  >
                    {asking ? "Lendo as conversas…" : "Pedir resumo à IA"}
                  </ButtonBase>
                </>
              )}
            </div>

            {tickets.map(ticket => {
              const status = STATUS[ticket.status] || STATUS.closed;
              return (
                <div key={ticket.id} className={classes.ticket}>
                  <div className={classes.ticketHead}>
                    <span
                      className={classes.chip}
                      style={{ backgroundColor: status.color }}
                    >
                      {status.label}
                    </span>
                    <span className={classes.ticketTitle}>
                      Atendimento #{ticket.id}
                    </span>
                    <span className={classes.grow} />
                    <span className={classes.ticketWhen}>
                      {moment(ticket.createdAt).format("D [de] MMM [de] YYYY")}
                    </span>
                  </div>

                  <div className={classes.rail}>
                    {/* como começou */}
                    <div className={classes.step}>
                      <span className={`${classes.dot} ${classes.dotStart}`}>
                        <ChatBubbleOutlineRoundedIcon />
                      </span>
                      <div className={classes.stepBody}>
                        <div className={classes.stepText}>
                          Como a conversa começou
                        </div>
                        <div className={classes.stepMeta}>
                          {moment(ticket.first?.at || ticket.createdAt).format(
                            "D [de] MMM, HH:mm"
                          )}
                        </div>
                        {ticket.first?.body && (
                          <div className={classes.quote}>
                            “{ticket.first.body}”
                          </div>
                        )}
                      </div>
                    </div>

                    {/* cada mudança */}
                    {ticket.steps.map((step, index) => (
                      <div key={index} className={classes.step}>
                        <Tooltip
                          title={step.byAi ? "Movido pela IA" : step.user || ""}
                        >
                          <span
                            className={`${classes.dot}${
                              step.byAi ? ` ${classes.dotAi}` : ""
                            }`}
                          >
                            {step.byAi ? (
                              <AutoAwesomeIcon />
                            ) : (
                              STEP_ICON[step.kind] || <FlagRoundedIcon />
                            )}
                          </span>
                        </Tooltip>
                        <div className={classes.stepBody}>
                          <div className={classes.stepText}>
                            {stepText(step)}
                            {step.byAi && (
                              <span className={classes.aiMark}>· IA</span>
                            )}
                          </div>
                          <div className={classes.stepMeta}>
                            {moment(step.at).format("D [de] MMM, HH:mm")}
                            {step.user && !step.byAi ? ` · ${step.user}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* como está agora */}
                    <div className={classes.step}>
                      <span className={`${classes.dot} ${classes.dotStart}`}>
                        <FlagRoundedIcon />
                      </span>
                      <div className={classes.stepBody}>
                        <div className={classes.stepText}>
                          {ticket.status === "closed"
                            ? "Como terminou"
                            : "Como está agora"}
                        </div>
                        <div className={classes.stepMeta}>
                          {ticket.queue?.name || "Sem fila"}
                          {ticket.user?.name ? ` · ${ticket.user.name}` : ""}
                          {" · "}
                          {moment(ticket.updatedAt).fromNow()}
                        </div>
                        {!!ticket.tags?.length && (
                          <div className={classes.chips}>
                            {ticket.tags.map(tag => (
                              <span
                                key={tag.id}
                                className={classes.chip}
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {ticket.last?.body && (
                          <div className={classes.quote}>
                            {ticket.last.fromMe ? "Você: " : ""}
                            {ticket.last.body}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </Dialog>
  );
};

export default ContactJourney;
