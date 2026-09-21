import React, { useEffect, useRef, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Drawer from "@material-ui/core/Drawer";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import CloudUploadOutlinedIcon from "@material-ui/icons/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { CATEGORIES, PRIORITIES, toneStyle } from "./supportShared";

const MAX_FILES = 10;
const MAX_MB = 20;

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      width: 520,
      maxWidth: "100vw",
      display: "flex",
      flexDirection: "column",
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: {
        width: "100%",
        height: "calc(var(--vh, 100vh) - 16px)",
        borderRadius: "22px 22px 0 0"
      }
    },
    head: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      padding: theme.spacing(2, 1.5, 1.5, 2.5),
      borderBottom: `1px solid ${t.border}`
    },
    title: {
      flex: 1,
      fontSize: "1.125rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    body: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: theme.spacing(2, 2.5, 3),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2.25),
      ...theme.scrollbarStyles
    },
    label: {
      marginBottom: 8,
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    options: { display: "flex", flexWrap: "wrap", gap: 8 },
    option: {
      height: 36,
      padding: "0 14px",
      borderRadius: t.radius.pill,
      border: `1px solid ${t.border}`,
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      transition: "all .15s ease"
    },
    optionOn: { borderColor: "transparent" },
    drop: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      width: "100%",
      padding: theme.spacing(2.5, 2),
      borderRadius: t.radius.lg,
      border: `1.5px dashed ${t.borderStrong}`,
      color: theme.palette.text.secondary,
      fontSize: "0.875rem",
      textAlign: "center",
      transition: "border-color .15s ease, background-color .15s ease",
      "& svg": { fontSize: 30, color: t.brand.text }
    },
    dropOn: { borderColor: t.brand.main, backgroundColor: t.brand.textSoft },
    previews: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
      gap: 8,
      marginTop: 10
    },
    preview: {
      position: "relative",
      height: 86,
      borderRadius: t.radius.md,
      overflow: "hidden",
      border: `1px solid ${t.border}`,
      backgroundColor: t.surfaceSunken,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      padding: 6,
      fontSize: "0.6875rem",
      color: theme.palette.text.secondary,
      textAlign: "center",
      overflowWrap: "anywhere",
      "& img": {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover"
      },
      "& svg": { color: t.brand.text }
    },
    remove: {
      position: "absolute",
      top: 3,
      right: 3,
      padding: 3,
      color: "#fff",
      backgroundColor: "rgba(0,0,0,.55)",
      "&:hover": { backgroundColor: "rgba(0,0,0,.75)" },
      "& svg": { fontSize: 14, color: "#fff" }
    },
    foot: {
      flex: "none",
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: theme.spacing(1.5, 2.5),
      paddingBottom: `calc(${theme.spacing(1.5)}px + var(--safe-bottom, 0px))`,
      borderTop: `1px solid ${t.border}`
    },
    submit: {
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      minWidth: 150
    },
    ghost: { borderRadius: t.radius.pill, textTransform: "none" }
  };
});

/** Abrir chamado: assunto, tipo, urgência, descrição e anexos. */
const NewTicketSheet = ({ open, onClose, onCreated }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("question");
  const [priority, setPriority] = useState("normal");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setCategory("question");
    setPriority("normal");
    setBody("");
    setFiles([]);
  }, [open]);

  // miniaturas das fotos escolhidas; libera a memória ao trocar
  const [thumbs, setThumbs] = useState([]);
  useEffect(() => {
    const urls = files.map(file =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    );
    setThumbs(urls);
    return () => urls.forEach(url => url && URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = list => {
    const picked = Array.from(list || []);
    const tooBig = picked.filter(f => f.size > MAX_MB * 1024 * 1024);
    if (tooBig.length) toast.info(`Cada arquivo pode ter até ${MAX_MB} MB`);
    setFiles(prev =>
      [...prev, ...picked.filter(f => f.size <= MAX_MB * 1024 * 1024)].slice(
        0,
        MAX_FILES
      )
    );
  };

  const valid = subject.trim() && (body.trim() || files.length);

  const submit = async () => {
    if (!valid || sending) return;
    setSending(true);
    const form = new FormData();
    form.append("subject", subject.trim());
    form.append("category", category);
    form.append("priority", priority);
    form.append("body", body.trim());
    files.forEach(file => form.append("files", file));
    try {
      const { data } = await api.post("/support/tickets", form);
      toast.success("Chamado aberto! Você acompanha a resposta por aqui.");
      onCreated(data);
    } catch (err) {
      toastError(err);
    }
    setSending(false);
  };

  return (
    <Drawer
      anchor={isPhone ? "bottom" : "right"}
      open={open}
      onClose={onClose}
      classes={{ paper: classes.paper }}
    >
      <div className={classes.head}>
        <span className={classes.title}>Abrir chamado</span>
        <IconButton onClick={onClose} aria-label="Fechar">
          <CloseRoundedIcon />
        </IconButton>
      </div>

      <div className={classes.body}>
        <TextField
          label="Assunto"
          placeholder="Ex.: Não consigo conectar o WhatsApp"
          variant="outlined"
          fullWidth
          autoFocus={!isPhone}
          value={subject}
          inputProps={{ maxLength: 160 }}
          onChange={e => setSubject(e.target.value)}
        />

        <div>
          <div className={classes.label}>Sobre o quê?</div>
          <div className={classes.options}>
            {CATEGORIES.map(c => (
              <ButtonBase
                key={c.key}
                className={`${classes.option}${category === c.key ? ` ${classes.optionOn}` : ""}`}
                style={
                  category === c.key ? toneStyle(theme, "brand") : undefined
                }
                onClick={() => setCategory(c.key)}
              >
                {c.emoji}&nbsp;{c.label}
              </ButtonBase>
            ))}
          </div>
        </div>

        <div>
          <div className={classes.label}>Urgência</div>
          <div className={classes.options}>
            {PRIORITIES.map(p => (
              <ButtonBase
                key={p.key}
                className={`${classes.option}${priority === p.key ? ` ${classes.optionOn}` : ""}`}
                style={
                  priority === p.key ? toneStyle(theme, p.tone) : undefined
                }
                onClick={() => setPriority(p.key)}
              >
                {p.label}
              </ButtonBase>
            ))}
          </div>
        </div>

        <TextField
          label="Descreva o que está acontecendo"
          placeholder="Conte o passo a passo, o que esperava e o que aconteceu."
          variant="outlined"
          fullWidth
          multiline
          minRows={5}
          maxRows={14}
          value={body}
          inputProps={{ maxLength: 5000 }}
          onChange={e => setBody(e.target.value)}
        />

        <div>
          <div className={classes.label}>Anexos</div>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={e => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <ButtonBase
            className={`${classes.drop}${dragging ? ` ${classes.dropOn}` : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
          >
            <CloudUploadOutlinedIcon />
            {isPhone
              ? "Toque para anexar prints ou arquivos"
              : "Arraste prints e arquivos aqui ou clique para escolher"}
            <span style={{ fontSize: "0.75rem" }}>
              Até {MAX_FILES} arquivos de {MAX_MB} MB
            </span>
          </ButtonBase>
          {files.length > 0 && (
            <div className={classes.previews}>
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className={classes.preview}>
                  {thumbs[i] ? (
                    <img src={thumbs[i]} alt={file.name} />
                  ) : (
                    <>
                      <InsertDriveFileOutlinedIcon />
                      {file.name}
                    </>
                  )}
                  <IconButton
                    className={classes.remove}
                    onClick={() =>
                      setFiles(prev => prev.filter((_, j) => j !== i))
                    }
                    aria-label="Remover"
                  >
                    <CloseRoundedIcon />
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={classes.foot}>
        <Button className={classes.ghost} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          className={classes.submit}
          disabled={!valid || sending}
          onClick={submit}
        >
          {sending ? "Enviando…" : "Enviar chamado"}
        </Button>
      </div>
    </Drawer>
  );
};

export default NewTicketSheet;
