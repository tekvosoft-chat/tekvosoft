import React, { useCallback, useEffect, useState } from "react";
import { makeStyles, alpha } from "@material-ui/core/styles";
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
 * Mapa da conversa: um mapa mental do que já aconteceu com este contato.
 *
 * No centro (à esquerda) está o contato. De lá saem ramos — um por
 * atendimento — e dentro de cada ramo os passos aparecem como peças em
 * sequência: como começou, por que filas passou, quem assumiu, em que coluna
 * parou e como está agora. O que a IA moveu leva o raio, para separar o que
 * foi decisão da equipe do que foi sugestão aceita.
 *
 * Nada aqui chama a IA: os passos vêm da tabela TicketJourneys e o resumo do
 * topo é o que já estava guardado. Abrir o mapa não gasta tokens.
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

const KIND = {
  queue: { icon: <AccountTreeOutlinedIcon />, color: "#5C59E8" },
  status: { icon: <FlagRoundedIcon />, color: "#B26A00" },
  user: { icon: <PersonOutlineRoundedIcon />, color: "#0B8043" },
  tag: { icon: <ViewWeekRoundedIcon />, color: "#8E24AA" }
};

/** Título curto da peça e o detalhe embaixo. */
const stepLabel = step => {
  const to = step.to || "—";
  switch (step.kind) {
    case "queue":
      return { title: to, hint: step.from ? `veio de ${step.from}` : "fila" };
    case "status":
      return {
        title: STATUS[to]?.label || to,
        hint: STATUS[step.from]?.label || step.from || "status"
      };
    case "user":
      return { title: to, hint: step.from ? `antes ${step.from}` : "assumiu" };
    case "tag":
      return { title: to, hint: "coluna do Kanban" };
    default:
      return { title: to, hint: step.kind };
  }
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const line = alpha(t.borderStrong || t.border, 0.9);
  return {
    paper: {
      width: 940,
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

    // ── painel de números ──
    stats: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 10,
      marginBottom: 14
    },
    stat: {
      padding: "12px 14px",
      borderRadius: 14,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    statValue: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.1,
      color: theme.palette.text.primary
    },
    statLabel: { fontSize: "0.75rem", color: theme.palette.text.secondary },

    ai: {
      padding: "12px 14px",
      marginBottom: 18,
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

    // ── o mapa: contato à esquerda, ramos à direita ──
    map: {
      display: "flex",
      alignItems: "stretch",
      gap: 0,
      [theme.breakpoints.down("xs")]: { display: "block" }
    },
    root: {
      flex: "none",
      width: 190,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "18px 12px",
      borderRadius: 18,
      border: `1px solid ${t.brand.textBorder}`,
      backgroundColor: t.surface,
      textAlign: "center",
      position: "relative",
      [theme.breakpoints.down("xs")]: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "flex-start",
        textAlign: "left",
        marginBottom: 12
      }
    },
    rootAvatar: { width: 56, height: 56, color: "#fff", fontWeight: 700 },
    rootName: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    rootMeta: { fontSize: "0.75rem", color: theme.palette.text.secondary },

    // tronco vertical que liga o contato aos ramos
    trunk: {
      flex: "none",
      width: 34,
      position: "relative",
      "&::before": {
        content: '""',
        position: "absolute",
        left: 0,
        right: "50%",
        top: "50%",
        borderTop: `2px solid ${line}`
      },
      "&::after": {
        content: '""',
        position: "absolute",
        left: "50%",
        top: 34,
        bottom: 34,
        borderLeft: `2px solid ${line}`
      },
      [theme.breakpoints.down("xs")]: { display: "none" }
    },
    branches: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 14
    },
    branch: {
      position: "relative",
      borderRadius: 18,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      padding: "12px 14px 14px",
      // gancho que sai do tronco e chega neste ramo
      "&::before": {
        content: '""',
        position: "absolute",
        left: -18,
        top: 34,
        width: 18,
        borderTop: `2px solid ${line}`,
        [theme.breakpoints.down("xs")]: { display: "none" }
      }
    },
    branchHead: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 10
    },
    branchTitle: {
      fontSize: "0.875rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    branchWhen: { fontSize: "0.75rem", color: theme.palette.text.secondary },

    // ── peças do ramo ──
    nodes: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "stretch",
      gap: 8
    },
    node: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 14,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surfaceSunken,
      minWidth: 0
    },
    nodeAi: {
      borderColor: t.brand.main,
      backgroundColor: t.brand.textSoft
    },
    nodeIcon: {
      flex: "none",
      width: 28,
      height: 28,
      borderRadius: 9,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      "& svg": { fontSize: 17 }
    },
    nodeText: { minWidth: 0 },
    nodeTitle: {
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: 200
    },
    nodeHint: {
      fontSize: "0.6875rem",
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: 200
    },
    arrow: {
      alignSelf: "center",
      color: alpha(theme.palette.text.secondary, 0.6),
      fontSize: "0.9375rem",
      lineHeight: 1
    },
    aiTag: {
      marginLeft: 2,
      padding: "1px 6px",
      borderRadius: 999,
      fontSize: "0.625rem",
      fontWeight: 800,
      letterSpacing: "0.04em",
      backgroundColor: t.brand.main,
      color: t.brand.contrastText
    },

    quote: {
      marginTop: 10,
      padding: "8px 10px",
      borderRadius: 12,
      backgroundColor: t.surfaceSunken,
      fontSize: "0.8125rem",
      lineHeight: 1.45,
      color: theme.palette.text.primary
    },
    branchFoot: {
      marginTop: 10,
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
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
  const first = tickets[tickets.length - 1];

  /** Uma peça do mapa. */
  const Node = ({ icon, color, title, hint, byAi, when }) => (
    <Tooltip title={when ? moment(when).format("D [de] MMM, HH:mm") : ""}>
      <div className={`${classes.node}${byAi ? ` ${classes.nodeAi}` : ""}`}>
        <span className={classes.nodeIcon} style={{ backgroundColor: color }}>
          {icon}
        </span>
        <span className={classes.nodeText}>
          <div className={classes.nodeTitle}>
            {title}
            {byAi && <span className={classes.aiTag}>IA</span>}
          </div>
          <div className={classes.nodeHint}>{hint}</div>
        </span>
      </div>
    </Tooltip>
  );

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
            <div className={classes.stats}>
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
              <div className={classes.stat}>
                <div className={classes.statValue}>
                  {moment(first?.createdAt).format("D/MM")}
                </div>
                <div className={classes.statLabel}>primeiro contato</div>
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

            <div className={classes.map}>
              <div className={classes.root}>
                <Avatar
                  src={contact?.profilePicUrl}
                  className={classes.rootAvatar}
                  style={{ backgroundColor: generateColor(contact?.number) }}
                >
                  {getInitials(contact?.name)}
                </Avatar>
                <div>
                  <div className={classes.rootName}>{contact?.name}</div>
                  <div className={classes.rootMeta}>
                    {tickets.length}{" "}
                    {tickets.length === 1 ? "atendimento" : "atendimentos"}
                  </div>
                </div>
              </div>

              <div className={classes.trunk} />

              <div className={classes.branches}>
                {tickets.map(ticket => {
                  const status = STATUS[ticket.status] || STATUS.closed;
                  return (
                    <div key={ticket.id} className={classes.branch}>
                      <div className={classes.branchHead}>
                        <span
                          className={classes.chip}
                          style={{ backgroundColor: status.color }}
                        >
                          {status.label}
                        </span>
                        <span className={classes.branchTitle}>
                          Atendimento #{ticket.id}
                        </span>
                        <span className={classes.grow} />
                        <span className={classes.branchWhen}>
                          {moment(ticket.createdAt).format("D [de] MMM")}
                        </span>
                      </div>

                      <div className={classes.nodes}>
                        <Node
                          icon={<ChatBubbleOutlineRoundedIcon />}
                          color="#6B6B74"
                          title="Começou"
                          hint={moment(
                            ticket.first?.at || ticket.createdAt
                          ).format("D [de] MMM, HH:mm")}
                          when={ticket.first?.at || ticket.createdAt}
                        />
                        {ticket.steps.map((step, index) => {
                          const kind = KIND[step.kind] || KIND.status;
                          const { title, hint } = stepLabel(step);
                          return (
                            <React.Fragment key={index}>
                              <span className={classes.arrow}>›</span>
                              <Node
                                icon={kind.icon}
                                color={step.byAi ? undefined : kind.color}
                                title={title}
                                hint={step.byAi ? "movido pela IA" : hint}
                                byAi={step.byAi}
                                when={step.at}
                              />
                            </React.Fragment>
                          );
                        })}
                        <span className={classes.arrow}>›</span>
                        <Node
                          icon={<FlagRoundedIcon />}
                          color={status.color}
                          title={
                            ticket.status === "closed" ? "Terminou" : "Agora"
                          }
                          hint={`${ticket.queue?.name || "Sem fila"} · ${
                            ticket.user?.name || "sem responsável"
                          }`}
                          when={ticket.updatedAt}
                        />
                      </div>

                      {ticket.first?.body && (
                        <div className={classes.quote}>
                          “{ticket.first.body}”
                        </div>
                      )}

                      <div className={classes.branchFoot}>
                        {(ticket.tags || []).map(tag => (
                          <span
                            key={tag.id}
                            className={classes.chip}
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        <span>
                          última atividade {moment(ticket.updatedAt).fromNow()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};

export default ContactJourney;
