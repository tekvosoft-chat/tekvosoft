import React from "react";
import moment from "moment";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";

import { WEEKDAYS_SHORT, dayKey, isBar, timeLabel } from "./calendarShared";

/**
 * Visão do mês, no desenho do Google Agenda: número da semana à esquerda,
 * dia no alto de cada quadro, faixas cheias para o que é de dia inteiro e
 * "• 21:05 Título" para o que tem horário. Tocar no quadro vazio cria algo
 * naquele dia; "+N mais" abre o dia.
 */
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
      // celular: sem moldura, como o Google Agenda no celular
      [theme.breakpoints.down("xs")]: {
        border: "none",
        borderRadius: 0,
        backgroundColor: "transparent"
      }
    },
    head: {
      display: "grid",
      gridTemplateColumns: "28px repeat(7, 1fr)",
      borderBottom: `1px solid ${t.border}`,
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "repeat(7, 1fr)" }
    },
    weekday: {
      padding: "8px 0 4px",
      textAlign: "center",
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      color: theme.palette.text.secondary
    },
    body: {
      flex: 1,
      minHeight: 0,
      display: "grid",
      gridTemplateColumns: "28px repeat(7, 1fr)",
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "repeat(7, 1fr)" }
    },
    weekNo: {
      paddingTop: 8,
      textAlign: "center",
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      backgroundColor: t.surfaceSunken,
      borderBottom: `1px solid ${t.border}`,
      [theme.breakpoints.down("xs")]: { display: "none" }
    },
    cell: {
      minWidth: 0,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      padding: "4px 4px 2px",
      borderLeft: `1px solid ${t.border}`,
      borderBottom: `1px solid ${t.border}`,
      overflow: "hidden",
      textAlign: "left",
      transition: "background-color .12s ease",
      // só com mouse: no toque o destaque ficava preso no dia tocado
      "@media (hover: hover)": {
        "&:hover": { backgroundColor: t.surfaceHover }
      },
      // celular: só as linhas entre as semanas, sem grade de planilha
      [theme.breakpoints.down("xs")]: {
        padding: "2px 1px 1px",
        borderLeft: "none",
        borderBottom: `1px solid ${t.border}`
      }
    },
    firstCol: {},
    date: {
      alignSelf: "center",
      minWidth: 24,
      height: 24,
      padding: "0 6px",
      marginBottom: 2,
      borderRadius: 12,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      [theme.breakpoints.down("xs")]: {
        height: 22,
        minWidth: 22,
        fontSize: "0.6875rem"
      }
    },
    outside: { color: theme.palette.text.disabled },
    today: {
      backgroundColor: t.brand.main,
      color: t.brand.contrastText
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
      textAlign: "left",
      [theme.breakpoints.down("xs")]: {
        fontSize: "0.625rem",
        lineHeight: "14px",
        padding: "0 3px",
        borderRadius: 3
      }
    },
    timed: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      width: "100%",
      marginBottom: 1,
      padding: "1px 4px",
      borderRadius: 4,
      fontSize: "0.75rem",
      lineHeight: "18px",
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textAlign: "left",
      "&:hover": { backgroundColor: t.surfaceSunken },
      [theme.breakpoints.down("xs")]: {
        gap: 2,
        padding: "0 1px",
        fontSize: "0.625rem",
        lineHeight: "14px"
      }
    },
    dot: {
      flex: "none",
      width: 8,
      height: 8,
      borderRadius: "50%",
      [theme.breakpoints.down("xs")]: { width: 6, height: 6 }
    },
    time: {
      flex: "none",
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: { display: "none" }
    },
    label: { overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 },
    done: { textDecoration: "line-through", opacity: 0.6 },
    more: {
      display: "block",
      padding: "0 4px",
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: theme.palette.text.secondary,
      textAlign: "left",
      "&:hover": { color: theme.palette.text.primary }
    }
  };
});

const MonthView = ({ cursor, items, onCreate, onOpen, onMore, isPhone }) => {
  const classes = useStyles();
  const first = cursor.clone().startOf("month");
  const start = first.clone().startOf("isoWeek");
  const weeks = Math.ceil((first.isoWeekday() - 1 + first.daysInMonth()) / 7);
  const today = moment();
  const maxItems = isPhone ? 3 : 4;

  // itens por dia (o que atravessa dias aparece em cada um deles)
  const byDay = {};
  items.forEach(item => {
    const last = item.end.clone().startOf("day");
    for (
      let d = item.start.clone().startOf("day");
      d.isSameOrBefore(last);
      d.add(1, "day")
    ) {
      (byDay[dayKey(d)] = byDay[dayKey(d)] || []).push(item);
    }
  });

  const sortDay = list =>
    [...list].sort((a, b) => {
      const barA = isBar(a) ? 0 : 1;
      const barB = isBar(b) ? 0 : 1;
      return barA - barB || a.start - b.start;
    });

  const cells = [];
  for (let w = 0; w < weeks; w += 1) {
    const weekStart = start.clone().add(w, "week");
    cells.push(
      <div key={`w${w}`} className={classes.weekNo}>
        {weekStart.isoWeek()}
      </div>
    );
    for (let d = 0; d < 7; d += 1) {
      const day = weekStart.clone().add(d, "day");
      const key = dayKey(day);
      const list = sortDay(byDay[key] || []);
      const shown = list.slice(
        0,
        list.length > maxItems ? maxItems - 1 : maxItems
      );
      const hidden = list.length - shown.length;
      cells.push(
        <ButtonBase
          key={key}
          component="div"
          className={clsx(classes.cell, d === 0 && classes.firstCol)}
          onClick={() => onCreate(day.clone().hour(9))}
        >
          <span
            className={clsx(classes.date, {
              [classes.outside]: day.month() !== cursor.month(),
              [classes.today]: day.isSame(today, "day")
            })}
          >
            {day.date() === 1 && !isPhone
              ? day.format("D [de] MMM")
              : day.date()}
          </span>
          {shown.map(item =>
            isBar(item) ? (
              <ButtonBase
                key={item.key}
                className={classes.bar}
                style={{ backgroundColor: item.color }}
                onClick={e => {
                  e.stopPropagation();
                  onOpen(item, e.currentTarget);
                }}
              >
                {item.title}
              </ButtonBase>
            ) : (
              <ButtonBase
                key={item.key}
                className={classes.timed}
                onClick={e => {
                  e.stopPropagation();
                  onOpen(item, e.currentTarget);
                }}
              >
                <span
                  className={classes.dot}
                  style={{ backgroundColor: item.color }}
                />
                <span className={classes.time}>{timeLabel(item.start)}</span>
                <span
                  className={clsx(classes.label, {
                    [classes.done]: item.status === "sent"
                  })}
                >
                  {item.title}
                </span>
              </ButtonBase>
            )
          )}
          {hidden > 0 && (
            <ButtonBase
              className={classes.more}
              onClick={e => {
                e.stopPropagation();
                onMore(day.clone());
              }}
            >
              +{hidden} {isPhone ? "" : "mais"}
            </ButtonBase>
          )}
        </ButtonBase>
      );
    }
  }

  return (
    <div className={classes.root}>
      <div className={classes.head}>
        {!isPhone && <span />}
        {WEEKDAYS_SHORT.map(d => (
          <span key={d} className={classes.weekday}>
            {isPhone ? d.charAt(0) : d}
          </span>
        ))}
      </div>
      <div
        className={classes.body}
        style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {cells}
      </div>
    </div>
  );
};

export default MonthView;
