import React from "react";
import moment from "moment";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import EventAvailableRoundedIcon from "@material-ui/icons/EventAvailableRounded";

import { TYPE_LABEL, dayKey, rangeLabel, upperFirst } from "./calendarShared";

/**
 * Lista ("Programação" do Google Agenda): um dia embaixo do outro, só os que
 * têm algo marcado (e hoje, mesmo vazio). É a visão padrão no celular.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      ...theme.scrollbarStyles,
      [theme.breakpoints.down("xs")]: {
        border: "none",
        borderRadius: 0,
        backgroundColor: "transparent"
      }
    },
    month: {
      position: "sticky",
      top: 0,
      zIndex: 1,
      padding: "10px 16px 6px",
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: theme.palette.text.secondary,
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: { backgroundColor: t.canvas }
    },
    day: {
      display: "flex",
      gap: 12,
      padding: "8px 16px",
      borderBottom: `1px solid ${t.border}`,
      [theme.breakpoints.down("xs")]: { padding: "8px 4px" }
    },
    when: {
      flex: "none",
      width: 52,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 2
    },
    weekday: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: theme.palette.text.secondary,
      textTransform: "uppercase"
    },
    number: {
      width: 36,
      height: 36,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      fontSize: "1.25rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    today: { backgroundColor: t.brand.main, color: t.brand.contrastText },
    list: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 4
    },
    row: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      padding: "8px 10px",
      borderRadius: 10,
      textAlign: "left",
      transition: "background-color .12s ease",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    chip: {
      flex: "none",
      width: 10,
      height: 10,
      borderRadius: "50%"
    },
    info: { flex: 1, minWidth: 0 },
    title: {
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    meta: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    empty: {
      fontSize: "0.875rem",
      color: theme.palette.text.secondary,
      padding: "10px 10px"
    },
    nothing: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      padding: "48px 16px",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 40, opacity: 0.6 }
    }
  };
});

const describe = item => {
  const parts = [rangeLabel(item), TYPE_LABEL[item.kind]];
  if (item.kind === "message" && item.raw?.body) parts.push(item.raw.body);
  if (item.kind === "call" && item.raw?.chat?.title)
    parts.push(item.raw.chat.title);
  return parts.filter(Boolean).join(" · ");
};

const ListView = ({ start, end, items, onOpen }) => {
  const classes = useStyles();
  const today = moment();

  const byDay = {};
  items.forEach(item => {
    const first = moment.max(
      item.start.clone().startOf("day"),
      start.clone().startOf("day")
    );
    const last = moment.min(
      item.end.clone().startOf("day"),
      end.clone().startOf("day")
    );
    for (let d = first.clone(); d.isSameOrBefore(last); d.add(1, "day")) {
      (byDay[dayKey(d)] = byDay[dayKey(d)] || []).push(item);
    }
  });

  const days = [];
  for (
    let d = start.clone().startOf("day");
    d.isSameOrBefore(end);
    d.add(1, "day")
  ) {
    const key = dayKey(d);
    if (byDay[key] || d.isSame(today, "day")) days.push(d.clone());
  }

  if (!days.length) {
    return (
      <div className={classes.root}>
        <div className={classes.nothing}>
          <EventAvailableRoundedIcon />
          Nada marcado neste período.
        </div>
      </div>
    );
  }

  let lastMonth = null;
  return (
    <div className={classes.root}>
      {days.map(day => {
        const key = dayKey(day);
        const list = (byDay[key] || []).sort(
          (a, b) => (a.allDay ? 0 : 1) - (b.allDay ? 0 : 1) || a.start - b.start
        );
        const monthLabel = day.format("YYYY-MM") !== lastMonth;
        lastMonth = day.format("YYYY-MM");
        return (
          <React.Fragment key={key}>
            {monthLabel && (
              <div className={classes.month}>
                {upperFirst(day.format("MMMM [de] YYYY"))}
              </div>
            )}
            <div className={classes.day}>
              <div className={classes.when}>
                <span className={classes.weekday}>{day.format("ddd")}</span>
                <span
                  className={clsx(
                    classes.number,
                    day.isSame(today, "day") && classes.today
                  )}
                >
                  {day.date()}
                </span>
              </div>
              <div className={classes.list}>
                {list.length ? (
                  list.map(item => (
                    <ButtonBase
                      key={item.key}
                      className={classes.row}
                      onClick={e => onOpen(item, e.currentTarget)}
                    >
                      <span
                        className={classes.chip}
                        style={{ backgroundColor: item.color }}
                      />
                      <span className={classes.info}>
                        <div className={classes.title}>{item.title}</div>
                        <div className={classes.meta}>{describe(item)}</div>
                      </span>
                    </ButtonBase>
                  ))
                ) : (
                  <span className={classes.empty}>Nada marcado para hoje</span>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ListView;
