import React, { useEffect, useState } from "react";
import moment from "moment";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import ButtonBase from "@material-ui/core/ButtonBase";
import ChevronLeftRoundedIcon from "@material-ui/icons/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@material-ui/icons/ChevronRightRounded";

import { upperFirst } from "./calendarShared";

/** Mês pequeno da lateral (e do seletor no celular), como no Google Agenda. */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    head: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 2px 6px 8px"
    },
    title: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    nav: { padding: 4, "& svg": { fontSize: 18 } },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      rowGap: 2,
      textAlign: "center"
    },
    weekday: {
      fontSize: "0.625rem",
      fontWeight: 700,
      color: theme.palette.text.secondary,
      padding: "4px 0"
    },
    day: {
      width: 28,
      height: 28,
      margin: "0 auto",
      borderRadius: "50%",
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      transition: "background-color .12s ease",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    outside: { color: theme.palette.text.disabled },
    busy: {
      position: "relative",
      "&::after": {
        content: '""',
        position: "absolute",
        bottom: 3,
        left: "50%",
        width: 4,
        height: 4,
        marginLeft: -2,
        borderRadius: "50%",
        backgroundColor: "currentColor",
        opacity: 0.55
      }
    },
    today: {
      backgroundColor: `${t.brand.main} !important`,
      color: `${t.brand.contrastText} !important`
    },
    selected: {
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    }
  };
});

const MiniMonth = ({ value, onChange, busyDays }) => {
  const classes = useStyles();
  const [month, setMonth] = useState(() => moment(value).startOf("month"));

  // escolheu outra data (pelas setas lá de cima): o mês pequeno acompanha
  useEffect(() => {
    setMonth(moment(value).startOf("month"));
  }, [value]);

  const start = month.clone().startOf("isoWeek");
  const days = Array.from({ length: 42 }, (_, i) =>
    start.clone().add(i, "day")
  );
  const today = moment();

  return (
    <div>
      <div className={classes.head}>
        <span className={classes.title}>
          {upperFirst(month.format("MMMM [de] YYYY"))}
        </span>
        <span>
          <IconButton
            className={classes.nav}
            onClick={() => setMonth(m => m.clone().subtract(1, "month"))}
            aria-label="Mês anterior"
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
          <IconButton
            className={classes.nav}
            onClick={() => setMonth(m => m.clone().add(1, "month"))}
            aria-label="Próximo mês"
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </span>
      </div>
      <div className={classes.grid}>
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <span key={i} className={classes.weekday}>
            {d}
          </span>
        ))}
        {days.map(day => {
          const key = day.format("YYYY-MM-DD");
          return (
            <ButtonBase
              key={key}
              className={[
                classes.day,
                day.month() !== month.month() ? classes.outside : "",
                busyDays?.has(key) ? classes.busy : "",
                day.isSame(value, "day") ? classes.selected : "",
                day.isSame(today, "day") ? classes.today : ""
              ].join(" ")}
              onClick={() => onChange(day.clone())}
            >
              {day.date()}
            </ButtonBase>
          );
        })}
      </div>
    </div>
  );
};

export default MiniMonth;
