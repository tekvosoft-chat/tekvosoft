import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";

import {
  WEEKDAYS_SHORT,
  dayKey,
  isBar,
  layoutDay,
  rangeLabel
} from "./calendarShared";

/**
 * Semana e dia com horários, como no Google Agenda: faixa de dia inteiro em
 * cima, uma coluna por dia, eventos no horário (lado a lado quando se
 * sobrepõem) e a linha vermelha da hora atual. Tocar num horário vazio cria
 * algo nele (de meia em meia hora).
 */
const HOUR = 48;
const GUTTER = 56;
const GUTTER_PHONE = 36;

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden",
      [theme.breakpoints.down("xs")]: {
        border: "none",
        borderRadius: 0,
        backgroundColor: "transparent"
      }
    },
    head: { display: "flex", borderBottom: `1px solid ${t.border}` },
    gutter: {
      flex: "none",
      width: GUTTER,
      [theme.breakpoints.down("xs")]: { width: GUTTER_PHONE }
    },
    dayHead: {
      flex: 1,
      minWidth: 0,
      padding: "8px 0 6px",
      textAlign: "center",
      [theme.breakpoints.up("sm")]: { borderLeft: `1px solid ${t.border}` },
      [theme.breakpoints.down("xs")]: { padding: "4px 0" }
    },
    weekday: {
      display: "block",
      [theme.breakpoints.down("xs")]: { fontSize: "0.625rem" },
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      color: theme.palette.text.secondary
    },
    number: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      marginTop: 2,
      borderRadius: "50%",
      fontSize: "1.375rem",
      fontWeight: 500,
      color: theme.palette.text.primary,
      [theme.breakpoints.down("xs")]: {
        width: 32,
        height: 32,
        fontSize: "1.0625rem"
      }
    },
    todayNumber: { backgroundColor: t.brand.main, color: t.brand.contrastText },
    todayWeekday: { color: t.brand.text },
    allDayRow: {
      display: "flex",
      borderBottom: `1px solid ${t.border}`,
      minHeight: 26
    },
    allDayLabel: {
      flex: "none",
      width: GUTTER,
      [theme.breakpoints.down("xs")]: { width: GUTTER_PHONE },
      padding: "4px 6px 0 0",
      textAlign: "right",
      fontSize: "0.625rem",
      color: theme.palette.text.secondary
    },
    allDayCell: {
      flex: 1,
      minWidth: 0,
      padding: 2,
      borderLeft: `1px solid ${t.border}`
    },
    bar: {
      display: "block",
      width: "100%",
      marginBottom: 2,
      padding: "1px 6px",
      borderRadius: 4,
      fontSize: "0.75rem",
      fontWeight: 600,
      lineHeight: "18px",
      color: "#fff",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      textAlign: "left"
    },
    scroll: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      position: "relative",
      ...theme.scrollbarStyles
    },
    grid: { display: "flex", position: "relative", height: HOUR * 24 },
    hours: {
      flex: "none",
      width: GUTTER,
      position: "relative",
      [theme.breakpoints.down("xs")]: { width: GUTTER_PHONE }
    },
    hourLabel: {
      position: "absolute",
      right: 8,
      [theme.breakpoints.down("xs")]: { right: 4, fontSize: "0.5625rem" },
      transform: "translateY(-50%)",
      fontSize: "0.625rem",
      color: theme.palette.text.secondary
    },
    column: {
      flex: 1,
      minWidth: 0,
      position: "relative",
      borderLeft: `1px solid ${t.border}`,
      backgroundImage: `repeating-linear-gradient(to bottom, ${t.border} 0, ${t.border} 1px, transparent 1px, transparent ${HOUR}px)`,
      cursor: "pointer",
      // celular: divisões mais leves (a grade pesava na tela pequena)
      [theme.breakpoints.down("xs")]: {
        borderLeftColor: "transparent",
        backgroundImage: `repeating-linear-gradient(to bottom, ${t.border} 0, ${t.border} 1px, transparent 1px, transparent ${HOUR}px)`,
        "& + &": { borderLeftColor: t.border, borderLeftStyle: "dotted" }
      }
    },
    event: {
      position: "absolute",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      padding: "2px 6px",
      borderRadius: 6,
      overflow: "hidden",
      color: "#fff",
      textAlign: "left",
      boxShadow: `0 0 0 1px ${t.surface}`,
      transition: "filter .12s ease, box-shadow .12s ease",
      "@media (hover: hover)": {
        "&:hover": { filter: "brightness(1.08)", zIndex: 3 }
      },
      [theme.breakpoints.down("xs")]: { padding: "1px 3px", borderRadius: 4 }
    },
    eventTitle: {
      width: "100%",
      [theme.breakpoints.down("xs")]: { fontSize: "0.625rem" },
      fontSize: "0.75rem",
      fontWeight: 700,
      lineHeight: 1.25,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    eventTime: { fontSize: "0.6875rem", lineHeight: 1.25, opacity: 0.92 },
    now: {
      position: "absolute",
      left: -1,
      right: 0,
      height: 2,
      backgroundColor: "#EA4335",
      zIndex: 4,
      pointerEvents: "none",
      "&::before": {
        content: '""',
        position: "absolute",
        left: -6,
        top: -5,
        width: 12,
        height: 12,
        borderRadius: "50%",
        backgroundColor: "#EA4335"
      }
    }
  };
});

const TimeGridView = ({ days, items, onCreate, onOpen, isPhone }) => {
  const classes = useStyles();
  const scrollRef = useRef(null);
  const [now, setNow] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 60000);
    return () => clearInterval(timer);
  }, []);

  // abre perto de agora (ou das 8h), não à meia-noite
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasToday = days.some(d => d.isSame(moment(), "day"));
    const hour = hasToday ? Math.max(0, moment().hour() - 1.5) : 7.5;
    el.scrollTop = hour * HOUR;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length, days[0] && dayKey(days[0])]);

  const barsOf = day =>
    items.filter(
      item =>
        isBar(item) &&
        !item.end.isBefore(day, "day") &&
        !item.start.isAfter(day, "day")
    );
  const hasBars = days.some(day => barsOf(day).length > 0);
  const timedOf = day =>
    items.filter(item => !isBar(item) && item.start.isSame(day, "day"));

  const createAt = (day, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const minutes = ((event.clientY - rect.top) / HOUR) * 60;
    const snapped = Math.max(
      0,
      Math.min(23 * 60 + 30, Math.floor(minutes / 30) * 30)
    );
    onCreate(day.clone().startOf("day").add(snapped, "minutes"));
  };

  return (
    <div className={classes.root}>
      <div className={classes.head}>
        <span className={classes.gutter} />
        {days.map(day => {
          const isToday = day.isSame(now, "day");
          return (
            <div key={dayKey(day)} className={classes.dayHead}>
              <span
                className={clsx(
                  classes.weekday,
                  isToday && classes.todayWeekday
                )}
              >
                {WEEKDAYS_SHORT[day.isoWeekday() - 1]}
              </span>
              <span
                className={clsx(classes.number, isToday && classes.todayNumber)}
              >
                {day.date()}
              </span>
            </div>
          );
        })}
      </div>

      {hasBars && (
        <div className={classes.allDayRow}>
          <span className={classes.allDayLabel}>
            {isPhone ? "" : "dia todo"}
          </span>
          {days.map(day => (
            <div key={dayKey(day)} className={classes.allDayCell}>
              {barsOf(day).map(item => (
                <ButtonBase
                  key={item.key}
                  className={classes.bar}
                  style={{ backgroundColor: item.color }}
                  onClick={e => onOpen(item, e.currentTarget)}
                >
                  {item.title}
                </ButtonBase>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className={classes.scroll} ref={scrollRef}>
        <div className={classes.grid}>
          <div className={classes.hours}>
            {Array.from({ length: 23 }, (_, i) => (
              <span
                key={i}
                className={classes.hourLabel}
                style={{ top: (i + 1) * HOUR }}
              >
                {String(i + 1).padStart(2, "0")}:00
              </span>
            ))}
          </div>
          {days.map(day => (
            <div
              key={dayKey(day)}
              className={classes.column}
              onClick={e => createAt(day, e)}
              role="presentation"
            >
              {layoutDay(timedOf(day)).map(({ item, col, total }) => {
                const startMin = item.start.hours() * 60 + item.start.minutes();
                const endDay = item.end.isSame(day, "day")
                  ? item.end
                  : day.clone().endOf("day");
                const endMin = endDay.hours() * 60 + endDay.minutes();
                const height = Math.max(
                  22,
                  ((endMin - startMin) / 60) * HOUR - 2
                );
                const width = 100 / total;
                return (
                  <ButtonBase
                    key={item.key}
                    className={classes.event}
                    style={{
                      top: (startMin / 60) * HOUR + 1,
                      height,
                      left: `calc(${col * width}% + 2px)`,
                      width: `calc(${width}% - 4px)`,
                      backgroundColor: item.color
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      onOpen(item, e.currentTarget);
                    }}
                  >
                    <span className={classes.eventTitle}>{item.title}</span>
                    {height > 30 && (
                      <span className={classes.eventTime}>
                        {rangeLabel(item)}
                      </span>
                    )}
                  </ButtonBase>
                );
              })}
              {day.isSame(now, "day") && (
                <span
                  className={classes.now}
                  style={{
                    top: ((now.hours() * 60 + now.minutes()) / 60) * HOUR
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeGridView;
