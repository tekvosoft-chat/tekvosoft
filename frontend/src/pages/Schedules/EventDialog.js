import React, { useContext, useEffect, useState } from "react";
import moment from "moment";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Switch from "@material-ui/core/Switch";
import Chip from "@material-ui/core/Chip";
import Autocomplete from "@material-ui/lab/Autocomplete";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import EventRoundedIcon from "@material-ui/icons/EventRounded";
import CallRoundedIcon from "@material-ui/icons/CallRounded";
import AlarmRoundedIcon from "@material-ui/icons/AlarmRounded";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import UserAvatar from "../../components/ui/UserAvatar";
import { EVENT_COLORS, REMINDER_OPTIONS, layerColor } from "./calendarShared";

/**
 * Criar/editar item da agenda: evento, ligação no chat interno ou lembrete.
 * Ligação sem sala escolhida e com uma pessoa só vira uma conversa direta
 * com ela (criada na hora, se ainda não existir).
 */
const TYPES = [
  { id: "event", label: "Evento", icon: <EventRoundedIcon /> },
  { id: "call", label: "Ligação", icon: <CallRoundedIcon /> },
  { id: "reminder", label: "Lembrete", icon: <AlarmRoundedIcon /> }
];

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: { width: 560, maxWidth: "calc(100vw - 24px)" },
    body: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2),
      padding: theme.spacing(2, 3, 1),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(2) }
    },
    top: { display: "flex", alignItems: "center", gap: 8 },
    title: {
      flex: 1,
      fontSize: "1.375rem",
      fontWeight: 600,
      borderBottom: `2px solid ${t.border}`,
      paddingBottom: 4,
      "&.Mui-focused": { borderBottomColor: t.brand.main }
    },
    types: { display: "flex", gap: 8, flexWrap: "wrap" },
    type: {
      height: 34,
      padding: "0 14px",
      gap: 6,
      borderRadius: t.radius.pill,
      border: `1px solid ${t.border}`,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 18 }
    },
    typeOn: {
      color: t.brand.text,
      backgroundColor: t.brand.textSoft,
      borderColor: t.brand.textBorder
    },
    row: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      "& .MuiTextField-root": { minWidth: 120 }
    },
    until: { color: theme.palette.text.secondary, fontSize: "0.875rem" },
    allDay: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    colors: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" },
    color: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      color: "#fff",
      "& svg": { fontSize: 14 }
    },
    label: {
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      marginRight: 6
    },
    footer: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: theme.spacing(1.5, 3, 2.5),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1.5, 2, 2) }
    },
    grow: { flex: 1 },
    button: {
      height: 38,
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      padding: "0 18px"
    },
    danger: { color: t.semantic.danger }
  };
});

const emptyForm = (type, start) => {
  const s = (start || moment().add(1, "hour").startOf("hour")).clone();
  return {
    id: null,
    type: type || "event",
    title: "",
    date: s.format("YYYY-MM-DD"),
    startTime: s.format("HH:mm"),
    endTime: s
      .clone()
      .add(type === "call" ? 30 : 60, "minutes")
      .format("HH:mm"),
    allDay: false,
    participants: [],
    chatId: "direct",
    remindMinutes: 10,
    description: "",
    color: ""
  };
};

const fromRaw = raw => {
  const start = moment(raw.startAt);
  const end = moment(raw.endAt);
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    date: start.format("YYYY-MM-DD"),
    startTime: start.format("HH:mm"),
    endTime: end.format("HH:mm"),
    allDay: !!raw.allDay,
    participants: raw.participantIds || [],
    chatId: raw.chatId || "direct",
    remindMinutes: raw.remindMinutes === null ? "" : raw.remindMinutes,
    description: raw.description || "",
    color: raw.color || ""
  };
};

const EventDialog = ({ open, onClose, preset, editing, onDeleted }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState(() => emptyForm());
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      editing ? fromRaw(editing) : emptyForm(preset?.type, preset?.start)
    );
    api
      .get("/users/list")
      .then(({ data }) => setUsers((data || []).filter(u => u.id !== user.id)))
      .catch(() => {});
    api
      .get("/chats")
      .then(({ data }) =>
        setChats((data.records || []).filter(c => c.kind !== "direct"))
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = patch => setForm(prev => ({ ...prev, ...patch }));
  const chosen = users.filter(u => form.participants.includes(u.id));
  const isCall = form.type === "call";
  const isReminder = form.type === "reminder";

  const save = async () => {
    if (!form.title.trim()) {
      toastError({ message: "Dê um título" });
      return;
    }
    setSaving(true);
    try {
      const day = moment(form.date, "YYYY-MM-DD");
      const startAt = form.allDay
        ? day.clone().startOf("day")
        : moment(`${form.date} ${form.startTime}`, "YYYY-MM-DD HH:mm");
      let endAt = form.allDay
        ? day.clone().endOf("day")
        : moment(
            `${form.date} ${isReminder ? form.startTime : form.endTime}`,
            "YYYY-MM-DD HH:mm"
          );
      if (endAt.isBefore(startAt)) endAt = startAt.clone().add(30, "minutes");

      // ligação sem sala: conversa direta com a única pessoa convidada
      let chatId = isCall && form.chatId !== "direct" ? form.chatId : null;
      if (isCall && !chatId) {
        if (form.participants.length !== 1) {
          throw new Error(
            "Para ligar com mais de uma pessoa, escolha uma sala do chat."
          );
        }
        const { data } = await api.post("/chats/direct", {
          userId: form.participants[0]
        });
        chatId = data?.id || data?.chat?.id;
      }

      const payload = {
        type: form.type,
        title: form.title.trim(),
        description: form.description,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        allDay: isCall ? false : form.allDay,
        participantIds: form.participants,
        chatId,
        remindMinutes: form.remindMinutes,
        color: form.color || null
      };
      if (form.id) await api.put(`/calendar/events/${form.id}`, payload);
      else await api.post("/calendar/events", payload);
      onClose(true);
    } catch (err) {
      toastError(err?.response ? err : { message: err.message });
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!form.id) return;
    try {
      await api.delete(`/calendar/events/${form.id}`);
      if (onDeleted) onDeleted();
      onClose(true);
    } catch (err) {
      toastError(err);
    }
  };

  const colorNow = form.color || layerColor(form.type);

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      classes={{ paper: classes.paper }}
    >
      <div className={classes.body}>
        <div className={classes.top}>
          <InputBase
            className={classes.title}
            placeholder="Adicionar título"
            autoFocus={!form.id}
            value={form.title}
            onChange={e => set({ title: e.target.value })}
            inputProps={{ maxLength: 200 }}
          />
          <IconButton size="small" onClick={() => onClose(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </div>

        <div className={classes.types}>
          {TYPES.map(type => (
            <ButtonBase
              key={type.id}
              className={clsx(
                classes.type,
                form.type === type.id && classes.typeOn
              )}
              onClick={() =>
                set({
                  type: type.id,
                  ...(type.id === "call" ? { allDay: false } : {})
                })
              }
            >
              {type.icon}
              {type.label}
            </ButtonBase>
          ))}
        </div>

        <div className={classes.row}>
          <TextField
            type="date"
            label="Data"
            value={form.date}
            onChange={e => set({ date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          {!form.allDay && (
            <>
              <TextField
                type="time"
                label={isReminder ? "Hora" : "Início"}
                value={form.startTime}
                onChange={e => set({ startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              {!isReminder && (
                <>
                  <span className={classes.until}>até</span>
                  <TextField
                    type="time"
                    label="Fim"
                    value={form.endTime}
                    onChange={e => set({ endTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </>
              )}
            </>
          )}
          {!isCall && (
            <label className={classes.allDay}>
              <Switch
                size="small"
                color="primary"
                checked={form.allDay}
                onChange={e => set({ allDay: e.target.checked })}
              />
              Dia inteiro
            </label>
          )}
        </div>

        <Autocomplete
          multiple
          options={users}
          value={chosen}
          getOptionLabel={option => option.name || ""}
          onChange={(e, value) => set({ participants: value.map(v => v.id) })}
          renderOption={option => (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UserAvatar user={option} size={24} />
              {option.name}
            </span>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                size="small"
                avatar={<UserAvatar user={option} size={20} />}
                label={option.name}
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={params => (
            <TextField
              {...params}
              label={isCall ? "Com quem" : "Convidados"}
              placeholder={chosen.length ? "" : "Adicionar pessoas da equipe"}
            />
          )}
        />

        {isCall && (
          <TextField
            select
            label="Sala da ligação"
            value={form.chatId}
            onChange={e => set({ chatId: e.target.value })}
            helperText={
              form.chatId === "direct"
                ? "A ligação acontece na conversa direta com a pessoa convidada."
                : "Todos da sala podem entrar na ligação."
            }
          >
            <MenuItem value="direct">Conversa direta com o convidado</MenuItem>
            {chats.map(chat => (
              <MenuItem key={chat.id} value={chat.id}>
                {chat.title || "Sala sem nome"}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          select
          label="Lembrete"
          value={form.remindMinutes}
          onChange={e => set({ remindMinutes: e.target.value })}
        >
          {REMINDER_OPTIONS.map(option => (
            <MenuItem key={String(option.value)} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Descrição"
          multiline
          minRows={2}
          maxRows={6}
          value={form.description}
          onChange={e => set({ description: e.target.value })}
        />

        <div className={classes.colors}>
          <span className={classes.label}>Cor</span>
          {EVENT_COLORS.map(color => (
            <ButtonBase
              key={color}
              className={classes.color}
              style={{ backgroundColor: color }}
              onClick={() => set({ color: form.color === color ? "" : color })}
              aria-label={color}
            >
              {colorNow === color && <CheckRoundedIcon />}
            </ButtonBase>
          ))}
        </div>
      </div>

      <div className={classes.footer}>
        {form.id && (
          <Button
            className={clsx(classes.button, classes.danger)}
            onClick={remove}
          >
            Excluir
          </Button>
        )}
        <span className={classes.grow} />
        <Button
          variant="outlined"
          className={classes.button}
          onClick={() => onClose(false)}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          className={classes.button}
          disabled={saving}
          onClick={save}
        >
          Salvar
        </Button>
      </div>
    </Dialog>
  );
};

export default EventDialog;
