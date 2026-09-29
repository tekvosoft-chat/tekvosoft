import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { PRIORITIES, t, toneStyle } from "./shared";
import { ImageDrop, pastedImages, pickImages } from "./media";

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    paper: { borderRadius: tkv.radius.xl },
    title: { paddingBottom: 4, "& h2": { fontWeight: 700 } },
    subtitle: {
      margin: 0,
      fontSize: "0.8125rem",
      fontWeight: 400,
      color: theme.palette.text.secondary
    },
    field: { marginTop: theme.spacing(2) },
    label: {
      display: "block",
      margin: theme.spacing(2, 0, 1),
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    chips: { display: "flex", flexWrap: "wrap", gap: 6 },
    chip: {
      height: 30,
      padding: "0 12px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.8125rem",
      fontWeight: 600,
      border: "1px solid transparent"
    },
    chipOff: {
      color: `${theme.palette.text.secondary} !important`,
      backgroundColor: "transparent !important",
      borderColor: tkv.border
    }
  };
});

/** Nova demanda do super: título, o que precisa e a prioridade inicial. */
const NewTaskDialog = ({ open, onClose, onCreated }) => {
  const classes = useStyles();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("xs"));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setPriority("normal");
    setImages([]);
  }, [open]);

  const create = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      // com imagem vai como formulário (multipart); a IA enxerga os prints
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("priority", priority);
      images.forEach(file => form.append("files", file));
      const { data } = await api.post("/dev-tasks", form);
      toast.success(t("toasts.created", { id: data.id }));
      onCreated(data);
    } catch (err) {
      toastError(err);
    }
    setSaving(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={phone}
      classes={{ paper: phone ? undefined : classes.paper }}
    >
      <DialogTitle className={classes.title}>
        {t("new.title")}
        <p className={classes.subtitle}>{t("new.subtitle")}</p>
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          variant="outlined"
          label={t("new.name")}
          value={title}
          inputProps={{ maxLength: 200 }}
          onChange={e => setTitle(e.target.value)}
          className={classes.field}
        />
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={14}
          variant="outlined"
          label={t("new.description")}
          helperText={t("new.descriptionHint")}
          value={description}
          inputProps={{ maxLength: 10000 }}
          onChange={e => setDescription(e.target.value)}
          onPaste={e => {
            const pasted = pastedImages(e);
            if (pasted.length) {
              e.preventDefault();
              setImages(current => pickImages(current, pasted));
            }
          }}
          className={classes.field}
        />
        <span className={classes.label}>{t("images.title")}</span>
        <ImageDrop files={images} onChange={setImages} />
        <span className={classes.label}>{t("new.priority")}</span>
        <div className={classes.chips}>
          {PRIORITIES.map(item => (
            <ButtonBase
              key={item.key}
              className={clsx(classes.chip, {
                [classes.chipOff]: priority !== item.key
              })}
              style={toneStyle(theme, item.tone)}
              aria-pressed={priority === item.key}
              onClick={() => setPriority(item.key)}
            >
              {t(`priority.${item.key}`)}
            </ButtonBase>
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("actions.close")}</Button>
        <Button
          color="primary"
          variant="contained"
          disabled={!title.trim() || saving}
          onClick={create}
        >
          {t("new.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewTaskDialog;
