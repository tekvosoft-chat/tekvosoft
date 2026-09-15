import React, { useEffect, useMemo, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import EventOutlinedIcon from "@material-ui/icons/EventOutlined";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import moment from "moment";

import api from "../../services/api";
import BoxLoader from "../ui/BoxLoader";
import { i18n } from "../../translate/i18n";

/**
 * Agendamentos do contato, dentro dos dados do contato.
 *
 * Primeiro o que ainda vai sair (do mais próximo ao mais distante), depois o
 * que já foi enviado ou deu erro (do mais recente ao mais antigo). Cada item
 * mostra o dia num "calendarinho", o texto e quanto falta ou quando saiu.
 */
const STATUS = {
  PENDENTE: "pending",
  AGENDADA: "pending",
  ENVIADA: "sent",
  ERRO: "error"
};
const statusOf = s => STATUS[String(s || "").toUpperCase()] || "pending";
const PREVIEW = 3;

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    head: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      minHeight: 50,
      padding: "0 8px 0 16px"
    },
    headIcon: {
      display: "flex",
      color: theme.palette.text.primary,
      "& svg": { fontSize: 24 }
    },
    headLabel: { flex: 1, fontSize: "1rem", color: theme.palette.text.primary },
    headCount: {
      fontSize: "0.9375rem",
      color: theme.palette.text.secondary,
      marginRight: 4
    },
    add: {
      padding: "6px 10px",
      borderRadius: t.radius.pill,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: t.brand.text,
      "& svg": { fontSize: 18, marginRight: 2 }
    },
    list: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: "0 12px 12px"
    },
    item: {
      display: "flex",
      alignItems: "stretch",
      gap: 12,
      padding: 10,
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      animation: "$in .28s ease both"
    },
    day: {
      flex: "none",
      width: 48,
      borderRadius: 10,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      textAlign: "center",
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    month: {
      fontSize: "0.625rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      padding: "2px 0",
      color: "#FFFFFF"
    },
    dayNum: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.125rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    body: { flex: 1, minWidth: 0 },
    text: {
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      wordBreak: "break-word"
    },
    meta: {
      marginTop: 4,
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
    },
    chip: {
      padding: "1px 8px",
      borderRadius: t.radius.pill,
      fontWeight: 600
    },
    tone_pending: { backgroundColor: t.brand.textSoft, color: t.brand.text },
    tone_sent: {
      backgroundColor: t.semantic.successSoft,
      color: t.semantic.success
    },
    tone_error: {
      backgroundColor: t.semantic.dangerSoft,
      color: t.semantic.danger
    },
    bg_pending: { backgroundColor: t.brand.main },
    bg_sent: { backgroundColor: t.semantic.success },
    bg_error: { backgroundColor: t.semantic.danger },
    more: {
      width: "100%",
      padding: "10px 0",
      fontSize: "0.875rem",
      fontWeight: 600,
      color: t.brand.text,
      borderTop: `1px solid ${t.border}`
    },
    empty: {
      padding: "0 16px 14px 54px",
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    center: { display: "flex", justifyContent: "center", padding: 12 },
    "@keyframes in": {
      from: { opacity: 0, transform: "translateY(4px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const ContactSchedules = ({ contactId, reloadKey, onNew }) => {
  const classes = useStyles();
  const [items, setItems] = useState(null);
  const [all, setAll] = useState(false);
  const t = (key, opts) => i18n.t(`contactSchedules.${key}`, opts);

  useEffect(() => {
    if (!contactId) return undefined;
    let alive = true;
    api
      .get("/schedules", { params: { contactId, pageNumber: 1 } })
      .then(({ data }) => alive && setItems(data?.schedules || []))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [contactId, reloadKey]);

  const ordered = useMemo(() => {
    if (!items) return [];
    const upcoming = items
      .filter(s => statusOf(s.status) === "pending")
      .sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt));
    const done = items
      .filter(s => statusOf(s.status) !== "pending")
      .sort(
        (a, b) =>
          new Date(b.sentAt || b.sendAt) - new Date(a.sentAt || a.sendAt)
      );
    return [...upcoming, ...done];
  }, [items]);

  const shown = all ? ordered : ordered.slice(0, PREVIEW);
  const pendingCount = ordered.filter(
    s => statusOf(s.status) === "pending"
  ).length;

  const when = s => {
    const kind = statusOf(s.status);
    const date = moment(s.sentAt || s.sendAt);
    if (kind === "pending") {
      return date.isBefore(moment())
        ? t("soon")
        : t("in", { time: date.fromNow(true) });
    }
    return t(kind === "sent" ? "sentAgo" : "failedAgo", {
      time: date.fromNow()
    });
  };

  return (
    <>
      <div className={classes.head}>
        <span className={classes.headIcon}>
          <EventOutlinedIcon />
        </span>
        <span className={classes.headLabel}>{t("title")}</span>
        {pendingCount > 0 && (
          <span className={classes.headCount}>
            {t("pending", { count: pendingCount })}
          </span>
        )}
        {onNew && (
          <ButtonBase className={classes.add} onClick={onNew}>
            <AddRoundedIcon />
            {t("new")}
          </ButtonBase>
        )}
      </div>

      {items === null ? (
        <div className={classes.center}>
          <BoxLoader size={32} />
        </div>
      ) : ordered.length === 0 ? (
        <div className={classes.empty}>{t("empty")}</div>
      ) : (
        <>
          <div className={classes.list}>
            {shown.map(s => {
              const kind = statusOf(s.status);
              const date = moment(s.sendAt);
              return (
                <div key={s.id} className={classes.item}>
                  <div className={classes.day}>
                    <span
                      className={`${classes.month} ${classes[`bg_${kind}`]}`}
                    >
                      {date.format("MMM").replace(".", "")}
                    </span>
                    <span className={classes.dayNum}>{date.format("DD")}</span>
                  </div>
                  <div className={classes.body}>
                    <div className={classes.text}>{s.body}</div>
                    <div className={classes.meta}>
                      <span
                        className={`${classes.chip} ${classes[`tone_${kind}`]}`}
                      >
                        {t(`status.${kind}`)}
                      </span>
                      <span>{date.format("HH:mm")}</span>
                      <span>·</span>
                      <span>{when(s)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {ordered.length > PREVIEW && (
            <ButtonBase
              className={classes.more}
              onClick={() => setAll(v => !v)}
            >
              {all ? t("less") : t("all", { count: ordered.length })}
            </ButtonBase>
          )}
        </>
      )}
    </>
  );
};

export default ContactSchedules;
