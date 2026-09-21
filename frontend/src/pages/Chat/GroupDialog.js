import React, { useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Switch from "@material-ui/core/Switch";
import TextField from "@material-ui/core/TextField";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { UsersFilter } from "../../components/UsersFilter";
import { GroupIcon } from "./chatShared";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: { borderRadius: 16, backgroundColor: t.surface },
    preview: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: theme.spacing(2)
    },
    hint: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    fields: { display: "flex", flexDirection: "column", gap: theme.spacing(2) },
    switchRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      padding: theme.spacing(1, 1.5),
      borderRadius: 10,
      border: `1px solid ${t.border}`
    },
    switchLabel: {
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    btn: { borderRadius: t.radius.pill, textTransform: "none", fontWeight: 700 }
  };
});

/** Criar ou editar uma sala (grupo): nome, descrição, pública e membros. */
const GroupDialog = ({ open, chat, onClose, onSaved }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const editing = !!chat?.id;

  useEffect(() => {
    if (!open) return;
    setTitle(chat?.title || "");
    setDescription(chat?.description || "");
    setIsPublic(editing ? !!chat.isPublic : true);
    setMembers(
      (chat?.users || [])
        .filter(u => u.userId !== user.id && u.user)
        .map(u => ({ id: u.userId, name: u.user.name }))
    );
  }, [open, chat, editing, user.id]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const body = { title: title.trim(), description, isPublic, users: members };
    try {
      const { data } = editing
        ? await api.put(`/chats/${chat.id}`, body)
        : await api.post("/chats", body);
      onSaved(data);
    } catch (err) {
      toastError(err);
    }
    setSaving(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      classes={{ paper: classes.paper }}
    >
      <DialogTitle>{editing ? "Editar sala" : "Criar sala"}</DialogTitle>
      <DialogContent>
        <div className={classes.preview}>
          <GroupIcon title={title || "?"} size={56} />
          <span className={classes.hint}>
            Uma sala tem conversa em texto e chamada de voz e vídeo para quem
            participa dela.
          </span>
        </div>
        <div className={classes.fields}>
          <TextField
            label="Nome da sala"
            variant="outlined"
            size="small"
            fullWidth
            autoFocus
            value={title}
            inputProps={{ maxLength: 80 }}
            onChange={e => setTitle(e.target.value)}
          />
          <TextField
            label="Descrição (opcional)"
            variant="outlined"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={description}
            inputProps={{ maxLength: 500 }}
            onChange={e => setDescription(e.target.value)}
          />
          <div className={classes.switchRow}>
            <div>
              <div className={classes.switchLabel}>
                {isPublic ? "Sala pública" : "Sala privada"}
              </div>
              <div className={classes.hint}>
                {isPublic
                  ? "Qualquer pessoa da empresa encontra na busca e entra."
                  : "Só quem você adicionar participa."}
              </div>
            </div>
            <Switch
              color="primary"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
            />
          </div>
          <UsersFilter
            multiple
            onFiltered={list => setMembers(list)}
            initialUsers={members}
            excludeId={user.id}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button className={classes.btn} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          className={classes.btn}
          variant="contained"
          color="primary"
          disableElevation
          disabled={!title.trim() || saving}
          onClick={save}
        >
          {editing ? "Salvar" : "Criar sala"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupDialog;
