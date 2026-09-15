import React, { useContext, useEffect, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Skeleton from "@material-ui/lab/Skeleton";
import Rating from "@material-ui/lab/Rating";
import Typography from "@material-ui/core/Typography";
import HourglassEmptyRoundedIcon from "@material-ui/icons/HourglassEmptyRounded";
import TimerOutlinedIcon from "@material-ui/icons/TimerOutlined";

import { SocketContext } from "../../context/Socket/SocketContext.js";
import { i18n } from "../../translate/i18n";
import { formatTimeInterval } from "../../helpers/formatTimeInterval.js";
import UserAvatar from "../ui/UserAvatar";

/**
 * Equipe no Dashboard.
 *
 * Era uma tabela de oito colunas: no computador os números ficavam soltos
 * numa linha comprida, e no celular viravam uma lista de rótulos em
 * maiúsculas. Agora cada atendente é um cartão: foto e situação no topo, os
 * três números que importam em destaque e os tempos médios embaixo.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: theme.spacing(2)
    },
    card: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5),
      padding: theme.spacing(2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    head: { display: "flex", alignItems: "center", gap: theme.spacing(1.5) },
    avatarWrap: { position: "relative", flex: "none" },
    dot: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 13,
      height: 13,
      borderRadius: "50%",
      border: `2px solid ${t.surface}`,
      backgroundColor: t.borderStrong
    },
    dotOn: { backgroundColor: t.semantic.success },
    who: { flex: 1, minWidth: 0 },
    name: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    status: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    statusOn: { color: t.semantic.success, fontWeight: 600 },
    rating: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
    },
    numbers: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: theme.spacing(1)
    },
    number: {
      padding: theme.spacing(1, 0.5),
      borderRadius: t.radius.md,
      backgroundColor: t.surfaceSunken,
      textAlign: "center"
    },
    numberValue: {
      fontSize: "1.375rem",
      fontWeight: 700,
      lineHeight: 1.2,
      color: theme.palette.text.primary
    },
    numberLabel: {
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    times: {
      display: "flex",
      justifyContent: "space-between",
      gap: theme.spacing(1),
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      "& span": { display: "inline-flex", alignItems: "center", gap: 4 },
      "& b": { color: theme.palette.text.primary, fontWeight: 600 },
      "& svg": { fontSize: 16 }
    }
  };
});

export function RatingBox({ rating }) {
  const ratingTrunc = rating === null ? 0 : Math.trunc(rating);
  return (
    <div style={{ width: "max-content" }}>
      <Rating defaultValue={ratingTrunc} max={5} readOnly />
      <span style={{ verticalAlign: "super" }}>
        &nbsp;({ratingTrunc?.toFixed(1)})
      </span>
    </div>
  );
}

export default function TableAttendantsStatus(props) {
  const { loading, attendants: loadedAttendants } = props;
  const classes = useStyles();
  const socketManager = useContext(SocketContext);
  const [attendants, setAttendants] = useState(loadedAttendants || []);

  useEffect(() => {
    if (loadedAttendants) setAttendants(loadedAttendants);
  }, [loadedAttendants]);

  useEffect(() => {
    const socket = socketManager.GetSocket();
    const updateStatus = ({ userId, online }) =>
      setAttendants(prev =>
        prev.map(a => (a.id === userId ? { ...a, online } : a))
      );
    socket.on("userOnlineChange", updateStatus);
    return () => socket.disconnect();
  }, [socketManager]);

  if (loading) {
    return (
      <div className={classes.grid}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} variant="rect" height={190} />
        ))}
      </div>
    );
  }

  return (
    <div className={classes.grid}>
      {attendants.map(a => {
        const rating = a.averageRating === null ? 0 : Number(a.averageRating);
        return (
          <div key={a.id} className={classes.card}>
            <div className={classes.head}>
              <span className={classes.avatarWrap}>
                <UserAvatar user={a} size={46} />
                <span
                  className={`${classes.dot}${a.online ? ` ${classes.dotOn}` : ""}`}
                />
              </span>
              <div className={classes.who}>
                <Typography className={classes.name}>{a.name}</Typography>
                <Typography
                  className={`${classes.status}${a.online ? ` ${classes.statusOn}` : ""}`}
                >
                  {a.online
                    ? i18n.t("dashboard.team.online")
                    : i18n.t("dashboard.team.offline")}
                </Typography>
              </div>
              <span className={classes.rating} title={i18n.t("common.rating")}>
                <Rating value={rating} max={5} size="small" readOnly />
                {rating.toFixed(1)}
              </span>
            </div>

            <div className={classes.numbers}>
              <div className={classes.number}>
                <div className={classes.numberValue}>{a.totalTickets}</div>
                <div className={classes.numberLabel}>
                  {i18n.t("dashboard.team.total")}
                </div>
              </div>
              <div className={classes.number}>
                <div className={classes.numberValue}>{a.openTickets}</div>
                <div className={classes.numberLabel}>
                  {i18n.t("dashboard.team.open")}
                </div>
              </div>
              <div className={classes.number}>
                <div className={classes.numberValue}>{a.closedTickets}</div>
                <div className={classes.numberLabel}>
                  {i18n.t("dashboard.team.closed")}
                </div>
              </div>
            </div>

            <div className={classes.times}>
              <span title={i18n.t("dashboard.avgWaitTime")}>
                <HourglassEmptyRoundedIcon />
                {i18n.t("dashboard.team.wait")}{" "}
                <b>{formatTimeInterval(a.avgWaitTime, 2)}</b>
              </span>
              <span title={i18n.t("dashboard.avgServiceTime")}>
                <TimerOutlinedIcon />
                {i18n.t("dashboard.team.service")}{" "}
                <b>{formatTimeInterval(a.avgServiceTime, 2)}</b>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
