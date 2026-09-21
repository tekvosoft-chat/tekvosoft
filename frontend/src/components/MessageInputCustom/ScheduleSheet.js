import React, { useEffect, useMemo, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import ButtonBase from "@material-ui/core/ButtonBase";
import Button from "@material-ui/core/Button";
import ScheduleRoundedIcon from "@material-ui/icons/ScheduleRounded";
import WbSunnyOutlinedIcon from "@material-ui/icons/WbSunnyOutlined";
import NightsStayOutlinedIcon from "@material-ui/icons/NightsStayOutlined";
import EventOutlinedIcon from "@material-ui/icons/EventOutlined";
import TuneRoundedIcon from "@material-ui/icons/TuneRounded";
import moment from "moment";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

/**
 * Agendar a mensagem que está sendo digitada: um painel que sobe de baixo
 * (dá para arrastar para fechar no celular), com atalhos de horário e a
 * opção de escolher data e hora. Substitui o "Agendar" do menu de três
 * pontinhos da conversa.
 */
const s = (key, fallback, opts) =>
  i18n.t(`scheduleSheet.${key}`, { defaultValue: fallback, ...opts });

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      width: "100%",
      maxWidth: 520,
      margin: "0 auto",
      borderRadius: "22px 22px 0 0",
      backgroundColor: t.surface,
      paddingBottom: "calc(12px + var(--safe-bottom, 0px))"
    },
    grip: {
      width: 40,
      height: 4,
      margin: "10px auto 6px",
      borderRadius: 4,
      backgroundColor: t.borderStrong
    },
    head: { padding: "4px 20px 10px" },
    title: {
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    preview: {
      marginTop: 4,
      fontSize: "0.875rem",
      color: theme.palette.text.secondary,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      whiteSpace: "pre-wrap"
    },
    option: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      width: "100%",
      minHeight: 54,
      padding: "0 20px",
      justifyContent: "flex-start",
      textAlign: "left",
      fontSize: "0.9688rem",
      color: theme.palette.text.primary,
      "&:hover": { backgroundColor: t.surfaceHover },
      "& svg": { color: t.brand.text, fontSize: 22 }
    },
    optionLabel: { flex: 1 },
    optionTime: {
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    custom: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 20px 4px"
    },
    input: {
      flex: 1,
      minWidth: 0,
      height: 44,
      padding: "0 12px",
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.primary,
      font: "inherit",
      colorScheme: t.isDark ? "dark" : "light",
      outline: "none",
      "&:focus": { borderColor: t.brand.main }
    },
    confirm: {
      height: 44,
      borderRadius: t.radius.md,
      textTransform: "none",
      fontWeight: 700
    }
  };
});

const nextMonday = () => {
  const d = moment().add(1, "day").startOf("day");
  while (d.isoWeekday() !== 1) d.add(1, "day");
  return d.hour(9);
};

const ScheduleSheet = ({ open, onClose, body, contactId, onScheduled }) => {
  const classes = useStyles();
  const [custom, setCustom] = useState(false);
  const [when, setWhen] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCustom(false);
    setWhen(moment().add(1, "hour").startOf("hour").format("YYYY-MM-DDTHH:mm"));
  }, [open]);

  const options = useMemo(() => {
    const now = moment();
    const list = [
      {
        key: "hour",
        icon: <ScheduleRoundedIcon />,
        label: s("inHour", "Daqui a 1 hora"),
        at: now.clone().add(1, "hour")
      }
    ];
    if (now.hour() < 17)
      list.push({
        key: "evening",
        icon: <NightsStayOutlinedIcon />,
        label: s("today18", "Hoje à tarde"),
        at: now.clone().hour(18).startOf("hour")
      });
    list.push({
      key: "tomorrow",
      icon: <WbSunnyOutlinedIcon />,
      label: s("tomorrow", "Amanhã de manhã"),
      at: now.clone().add(1, "day").hour(9).startOf("hour")
    });
    const monday = nextMonday();
    if (!monday.isSame(now.clone().add(1, "day"), "day"))
      list.push({
        key: "monday",
        icon: <EventOutlinedIcon />,
        label: s("monday", "Segunda de manhã"),
        at: monday.startOf("hour")
      });
    return list;
    // recalcula a cada abertura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const schedule = async at => {
    if (!at?.isValid() || at.isBefore(moment())) {
      toast.info(s("past", "Escolha um horário no futuro"));
      return;
    }
    setSaving(true);
    try {
      await api.post("/schedules", {
        body,
        contactId,
        sendAt: at.format("YYYY-MM-DDTHH:mm")
      });
      toast.success(
        s("done", "Mensagem agendada para {{date}}", {
          date: at.format("DD/MM [às] HH:mm")
        })
      );
      onScheduled();
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const timeLabel = at =>
    at.isSame(moment(), "day")
      ? at.format("HH:mm")
      : at.format("ddd, DD/MM · HH:mm");

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      classes={{ paper: classes.paper }}
    >
      <div className={classes.grip} />
      <div className={classes.head}>
        <div className={classes.title}>{s("title", "Agendar envio")}</div>
        <div className={classes.preview}>{body}</div>
      </div>

      {options.map(option => (
        <ButtonBase
          key={option.key}
          className={classes.option}
          disabled={saving}
          onClick={() => schedule(option.at)}
        >
          {option.icon}
          <span className={classes.optionLabel}>{option.label}</span>
          <span className={classes.optionTime}>{timeLabel(option.at)}</span>
        </ButtonBase>
      ))}

      <ButtonBase className={classes.option} onClick={() => setCustom(v => !v)}>
        <TuneRoundedIcon />
        <span className={classes.optionLabel}>
          {s("custom", "Escolher data e hora")}
        </span>
      </ButtonBase>
      {custom && (
        <div className={classes.custom}>
          <input
            type="datetime-local"
            className={classes.input}
            value={when}
            min={moment().format("YYYY-MM-DDTHH:mm")}
            onChange={e => setWhen(e.target.value)}
          />
          <Button
            color="primary"
            variant="contained"
            disableElevation
            className={classes.confirm}
            disabled={!when || saving}
            onClick={() => schedule(moment(when, "YYYY-MM-DDTHH:mm"))}
          >
            {s("confirm", "Agendar")}
          </Button>
        </div>
      )}
    </SwipeableDrawer>
  );
};

export default ScheduleSheet;
