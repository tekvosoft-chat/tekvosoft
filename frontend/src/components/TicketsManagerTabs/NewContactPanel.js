import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Switch from "@material-ui/core/Switch";
import InputBase from "@material-ui/core/InputBase";
import ArrowBackRoundedIcon from "@material-ui/icons/ArrowBackRounded";
import PersonOutlineRoundedIcon from "@material-ui/icons/PersonOutlineRounded";
import PhoneOutlinedIcon from "@material-ui/icons/PhoneOutlined";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";
import CircularProgress from "@material-ui/core/CircularProgress";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";

const COUNTRIES = [
  ["BR", "+55"],
  ["PT", "+351"],
  ["US", "+1"],
  ["AR", "+54"],
  ["PY", "+595"],
  ["UY", "+598"],
  ["CL", "+56"],
  ["MX", "+52"],
  ["ES", "+34"]
];

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      backgroundColor: t.surface,
      animation: "$in .26s cubic-bezier(.2, .8, .2, 1) both"
    },
    "@keyframes in": {
      from: { opacity: 0, transform: "translateX(-18px)" },
      to: { opacity: 1, transform: "none" }
    },
    head: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(2, 1.5, 2, 1),
      fontSize: 17,
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    body: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: theme.spacing(1, 3, 3)
    },
    row: {
      display: "flex",
      alignItems: "flex-end",
      gap: 18,
      marginTop: theme.spacing(3),
      "& > svg": { color: theme.palette.text.secondary, marginBottom: 6 }
    },
    field: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column"
    },
    label: { fontSize: 12, color: theme.palette.text.secondary },
    input: {
      fontSize: 15,
      padding: "6px 0",
      borderBottom: `1.5px solid ${t.border}`,
      transition: "border-color .15s ease",
      "&.Mui-focused": { borderBottomColor: t.brand.main }
    },
    country: {
      width: 96,
      flex: "none",
      "& select": {
        width: "100%",
        padding: "7px 0",
        border: "none",
        borderBottom: `1.5px solid ${t.border}`,
        background: "transparent",
        color: theme.palette.text.primary,
        fontSize: 15,
        outline: "none"
      }
    },
    sync: {
      display: "flex",
      alignItems: "center",
      gap: 18,
      marginTop: theme.spacing(4),
      "& > svg": { color: theme.palette.text.secondary }
    },
    syncText: { flex: 1, minWidth: 0 },
    syncTitle: { fontSize: 15, color: theme.palette.text.primary },
    syncSub: { fontSize: 13, color: theme.palette.text.secondary },
    save: {
      display: "flex",
      justifyContent: "center",
      marginTop: theme.spacing(5)
    },
    saveBtn: {
      width: 56,
      height: 56,
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      boxShadow: `0 10px 24px -8px ${t.brand.main}`,
      transition: "transform .15s ease",
      "&:hover": { backgroundColor: t.brand.hover, transform: "scale(1.06)" },
      "&.Mui-disabled": {
        color: t.brand.contrastText,
        backgroundColor: t.brand.main,
        opacity: 0.45
      }
    }
  };
});

/**
 * Novo contato no próprio painel de conversas, no desenho do WhatsApp Web:
 * nome, sobrenome, país + número e a opção de sincronizar com o celular.
 */
const NewContactPanel = ({ onBack, onSaved }) => {
  const classes = useStyles();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ddi, setDdi] = useState("+55");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const valid = firstName.trim().length > 0 && digits.length >= 8;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const name = [firstName.trim(), lastName.trim()]
        .filter(Boolean)
        .join(" ");
      const number = `${ddi.replace(/\D/g, "")}${digits}`;
      const { data } = await api.post("/contacts", {
        name,
        number,
        email: ""
      });
      toast.success("Contato salvo");
      onSaved?.(data);
    } catch (err) {
      toastError(err);
    }
    setSaving(false);
  };

  return (
    <div className={classes.root}>
      <div className={classes.head}>
        <IconButton onClick={onBack} aria-label="Voltar">
          <ArrowBackRoundedIcon />
        </IconButton>
        Novo contato
      </div>
      <div className={classes.body}>
        <div className={classes.row}>
          <PersonOutlineRoundedIcon />
          <label className={classes.field}>
            <InputBase
              className={classes.input}
              placeholder="Nome"
              autoFocus
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </label>
        </div>
        <div className={classes.row}>
          <span style={{ width: 24 }} />
          <label className={classes.field}>
            <InputBase
              className={classes.input}
              placeholder="Sobrenome"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </label>
        </div>
        <div className={classes.row}>
          <PhoneOutlinedIcon />
          <label className={`${classes.field} ${classes.country}`}>
            <span className={classes.label}>País</span>
            <select value={ddi} onChange={e => setDdi(e.target.value)}>
              {COUNTRIES.map(([code, prefix]) => (
                <option key={code} value={prefix}>
                  {code} {prefix}
                </option>
              ))}
            </select>
          </label>
          <label className={classes.field}>
            <span className={classes.label}>Número de telefone</span>
            <InputBase
              className={classes.input}
              inputProps={{ inputMode: "tel" }}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()}
            />
          </label>
        </div>
        <div className={classes.save}>
          <IconButton
            className={classes.saveBtn}
            disabled={!valid || saving}
            onClick={save}
            aria-label="Salvar contato"
          >
            {saving ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <CheckRoundedIcon />
            )}
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default NewContactPanel;
