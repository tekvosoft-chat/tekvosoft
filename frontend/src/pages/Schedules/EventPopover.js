import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import moment from "moment";
import { makeStyles } from "@material-ui/core/styles";
import Popover from "@material-ui/core/Popover";
import Dialog from "@material-ui/core/Dialog";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import VideocamRoundedIcon from "@material-ui/icons/VideocamRounded";
import NotesRoundedIcon from "@material-ui/icons/NotesRounded";
import PeopleOutlineRoundedIcon from "@material-ui/icons/PeopleOutlineRounded";
import NotificationsNoneRoundedIcon from "@material-ui/icons/NotificationsNoneRounded";
import ForumOutlinedIcon from "@material-ui/icons/ForumOutlined";

import { AuthContext } from "../../context/Auth/AuthContext";
import {
  REMINDER_OPTIONS,
  TYPE_LABEL,
  rangeLabel,
  upperFirst
} from "./calendarShared";

/** Detalhes de um item da agenda (o cartão que abre ao clicar, como no Google). */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    card: {
      width: 380,
      maxWidth: "calc(100vw - 24px)",
      padding: theme.spacing(1, 1, 2, 2.5),
      [theme.breakpoints.down("xs")]: { width: "100%", maxWidth: "none" }
    },
    tools: { display: "flex", justifyContent: "flex-end", gap: 2 },
    head: { display: "flex", gap: 14, paddingRight: theme.spacing(1.5) },
    square: {
      flex: "none",
      width: 16,
      height: 16,
      borderRadius: 4,
      marginTop: 6
    },
    title: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.3,
      color: theme.palette.text.primary,
      overflowWrap: "anywhere"
    },
    when: {
      marginTop: 2,
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    line: {
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      marginTop: 12,
      paddingRight: theme.spacing(1.5),
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      "& svg": {
        flex: "none",
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginTop: 1
      }
    },
    muted: { color: theme.palette.text.secondary },
    body: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
    status: { fontWeight: 700 },
    action: {
      marginTop: 16,
      marginLeft: 30,
      height: 38,
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      padding: "0 18px"
    }
  };
});

const STATUS_TEXT = {
  pending: "Agendada",
  sent: "Enviada",
  error: "Não foi enviada"
};

const EventPopover = ({
  item,
  anchorEl,
  onClose,
  onEdit,
  onDelete,
  users,
  isPhone
}) => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  if (!item) return null;

  const raw = item.raw || {};
  const isOwn =
    item.kind === "message" ||
    raw.userId === user.id ||
    user.profile === "admin";
  const canEdit = item.kind !== "holiday" && isOwn;
  const people = (raw.participantIds || [])
    .map(id => users.find(u => u.id === id)?.name)
    .filter(Boolean);
  const reminder = REMINDER_OPTIONS.find(
    option => String(option.value) === String(raw.remindMinutes ?? "")
  );

  const content = (
    <div className={classes.card}>
      <div className={classes.tools}>
        {canEdit && (
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(item)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {canEdit && (
          <Tooltip title="Excluir">
            <IconButton size="small" onClick={() => onDelete(item)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <IconButton size="small" onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </div>

      <div className={classes.head}>
        <span
          className={classes.square}
          style={{ backgroundColor: item.color }}
        />
        <div>
          <div className={classes.title}>{item.title}</div>
          <div className={classes.when}>
            {upperFirst(item.start.format("dddd, D [de] MMMM"))} ·{" "}
            {rangeLabel(item)}
          </div>
          <div className={classes.when}>{TYPE_LABEL[item.kind]}</div>
        </div>
      </div>

      {item.kind === "message" && (
        <>
          <div className={classes.line}>
            <NotesRoundedIcon />
            <span className={classes.body}>{raw.body}</span>
          </div>
          <div className={classes.line}>
            <NotificationsNoneRoundedIcon />
            <span className={classes.status}>{STATUS_TEXT[item.status]}</span>
          </div>
        </>
      )}

      {item.kind === "call" && raw.chat && (
        <div className={classes.line}>
          <ForumOutlinedIcon />
          <span>{raw.chat.title || "Conversa direta"}</span>
        </div>
      )}

      {!!people.length && (
        <div className={classes.line}>
          <PeopleOutlineRoundedIcon />
          <span>
            {raw.user?.name && (
              <span className={classes.muted}>
                {raw.user.name} (organizador) ·{" "}
              </span>
            )}
            {people.join(", ")}
          </span>
        </div>
      )}

      {raw.description && (
        <div className={classes.line}>
          <NotesRoundedIcon />
          <span className={classes.body}>{raw.description}</span>
        </div>
      )}

      {["event", "call", "reminder"].includes(item.kind) && reminder && (
        <div className={classes.line}>
          <NotificationsNoneRoundedIcon />
          <span className={classes.muted}>{reminder.label}</span>
        </div>
      )}

      {item.kind === "call" && raw.chat?.uuid && (
        <Button
          variant="contained"
          color="primary"
          disableElevation
          className={classes.action}
          startIcon={<VideocamRoundedIcon />}
          disabled={item.end.isBefore(moment().subtract(1, "hour"))}
          onClick={() => {
            onClose();
            history.push(`/chats/${raw.chat.uuid}?call=1`);
          }}
        >
          Entrar na ligação
        </Button>
      )}
    </div>
  );

  if (isPhone) {
    return (
      <Dialog open={!!item} onClose={onClose}>
        {content}
      </Dialog>
    );
  }

  return (
    <Popover
      open={!!item}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "center", horizontal: "right" }}
      transformOrigin={{ vertical: "center", horizontal: "left" }}
    >
      {content}
    </Popover>
  );
};

export default EventPopover;
