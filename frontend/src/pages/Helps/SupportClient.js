import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import HeadsetMicOutlinedIcon from "@material-ui/icons/HeadsetMicOutlined";
import AttachFileRoundedIcon from "@material-ui/icons/AttachFileRounded";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import PageLoader from "../../components/ui/PageLoader";
import TicketThread from "./TicketThread";
import NewTicketSheet from "./NewTicketSheet";
import {
  ago,
  categoryOf,
  statusOf,
  toneStyle,
  useSupportLive
} from "./supportShared";

/**
 * Suporte do lado do cliente: abrir chamado (com prints) e acompanhar as
 * respostas. Chamado com resposta nova ganha um ponto; abrir a conversa
 * marca como lido.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    hero: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(2),
      padding: theme.spacing(2.5, 3),
      marginBottom: theme.spacing(2.5),
      borderRadius: t.radius.xl,
      border: `1px solid ${t.border}`,
      background: `linear-gradient(120deg, ${t.brand.textSoft}, transparent 75%)`,
      [theme.breakpoints.down("xs")]: {
        flexDirection: "column",
        alignItems: "flex-start",
        padding: theme.spacing(2)
      }
    },
    heroIcon: {
      flex: "none",
      width: 52,
      height: 52,
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: t.brand.text,
      backgroundColor: t.brand.textSoft,
      "& svg": { fontSize: 28 }
    },
    heroText: { flex: 1, minWidth: 0 },
    heroTitle: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    heroSub: {
      marginTop: 2,
      fontSize: "0.9375rem",
      color: theme.palette.text.secondary
    },
    newBtn: {
      flex: "none",
      height: 44,
      padding: "0 20px",
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      [theme.breakpoints.down("xs")]: { width: "100%" }
    },
    filters: { display: "flex", gap: 6, marginBottom: theme.spacing(1.5) },
    filter: {
      height: 32,
      padding: "0 14px",
      borderRadius: t.radius.pill,
      border: `1px solid ${t.border}`,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    filterOn: {
      borderColor: t.brand.textBorder,
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    list: { display: "flex", flexDirection: "column", gap: 8 },
    item: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      gap: 6,
      width: "100%",
      padding: theme.spacing(1.75, 2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      textAlign: "left",
      transition: "border-color .15s ease",
      "&:hover": { borderColor: t.brand.textBorder }
    },
    top: { display: "flex", alignItems: "center", gap: 8 },
    subject: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.9688rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    chip: {
      flex: "none",
      display: "inline-flex",
      alignItems: "center",
      height: 22,
      padding: "0 9px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap"
    },
    preview: {
      fontSize: "0.875rem",
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    foot: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 14, verticalAlign: "-2px" }
    },
    unread: {
      flex: "none",
      width: 9,
      height: 9,
      borderRadius: "50%",
      backgroundColor: t.brand.main
    },
    empty: {
      padding: theme.spacing(6, 2),
      textAlign: "center",
      color: theme.palette.text.secondary,
      "& span": { display: "block", fontSize: 40, marginBottom: 8 }
    }
  };
});

const SupportClient = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [tickets, setTickets] = useState(null);
  const [filter, setFilter] = useState("active");
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  // etapa de cada chamado na última leitura: se o suporte mudou, avisa
  const lastStatus = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/support/tickets");
      const list = Array.isArray(data) ? data : [];
      if (lastStatus.current) {
        list.forEach(ticket => {
          const before = lastStatus.current.get(ticket.id);
          // unreadByClient: quem mudou foi o suporte (não o próprio cliente)
          if (before && before !== ticket.status && ticket.unreadByClient) {
            toast.info(`#${ticket.id} · ${statusOf(ticket.status).note}`, {
              autoClose: 5000
            });
          }
        });
      }
      lastStatus.current = new Map(list.map(t => [t.id, t.status]));
      setTickets(list);
    } catch (err) {
      toastError(err);
      setTickets([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useSupportLive(() => load());

  const counts = useMemo(() => {
    const list = tickets || [];
    return {
      active: list.filter(t => t.status !== "resolved").length,
      resolved: list.filter(t => t.status === "resolved").length
    };
  }, [tickets]);

  const visible = (tickets || []).filter(t =>
    filter === "resolved" ? t.status === "resolved" : t.status !== "resolved"
  );

  if (!tickets) return <PageLoader />;

  return (
    <>
      <div className={classes.hero}>
        <span className={classes.heroIcon}>
          <HeadsetMicOutlinedIcon />
        </span>
        <div className={classes.heroText}>
          <div className={classes.heroTitle}>Como podemos ajudar?</div>
          <div className={classes.heroSub}>
            Abra um chamado, mande prints do que está acontecendo e acompanhe a
            resposta do nosso time por aqui.
          </div>
        </div>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          className={classes.newBtn}
          startIcon={<AddRoundedIcon />}
          onClick={() => setCreating(true)}
        >
          Abrir chamado
        </Button>
      </div>

      <div className={classes.filters}>
        {[
          ["active", "Em aberto"],
          ["resolved", "Resolvidos"]
        ].map(([key, label]) => (
          <ButtonBase
            key={key}
            className={`${classes.filter}${filter === key ? ` ${classes.filterOn}` : ""}`}
            onClick={() => setFilter(key)}
          >
            {label} · {counts[key]}
          </ButtonBase>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className={classes.empty}>
          <span>{filter === "resolved" ? "📁" : "🙌"}</span>
          {filter === "resolved"
            ? "Nenhum chamado resolvido ainda."
            : "Nenhum chamado em aberto. Precisou de algo? É só abrir um."}
        </div>
      ) : (
        <div className={classes.list}>
          {visible.map(ticket => {
            const status = statusOf(ticket.status);
            const category = categoryOf(ticket.category);
            return (
              <ButtonBase
                key={ticket.id}
                component="div"
                className={classes.item}
                onClick={() => setOpenId(ticket.id)}
              >
                <div className={classes.top}>
                  {ticket.unreadByClient && (
                    <span className={classes.unread} title="Resposta nova" />
                  )}
                  <span className={classes.subject}>{ticket.subject}</span>
                  <span
                    className={classes.chip}
                    style={toneStyle(theme, status.tone)}
                  >
                    {status.client}
                  </span>
                </div>
                {ticket.preview?.body && (
                  <span className={classes.preview}>
                    {ticket.preview.fromSupport ? "Suporte: " : "Você: "}
                    {ticket.preview.body}
                  </span>
                )}
                <span className={classes.foot}>
                  <span>
                    {category.emoji} {category.label}
                  </span>
                  {ticket.preview?.attachments > 0 && (
                    <span>
                      <AttachFileRoundedIcon /> {ticket.preview.attachments}
                    </span>
                  )}
                  <span>
                    #{ticket.id} · atualizado {ago(ticket.lastMessageAt)}
                  </span>
                </span>
              </ButtonBase>
            );
          })}
        </div>
      )}

      <NewTicketSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={ticket => {
          setCreating(false);
          load();
          setOpenId(ticket.id);
        }}
      />
      <TicketThread
        ticketId={openId}
        isSuper={false}
        onClose={() => {
          setOpenId(null);
          load();
        }}
      />
    </>
  );
};

export default SupportClient;
