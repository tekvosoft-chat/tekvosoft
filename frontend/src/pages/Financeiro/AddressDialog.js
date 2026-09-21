import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(0.5)
  },
  span2: { gridColumn: "span 2" },
  span3: { gridColumn: "span 3" },
  span4: { gridColumn: "span 4" },
  span6: { gridColumn: "span 6" },
  [theme.breakpoints.down("xs")]: {
    grid: { gridTemplateColumns: "repeat(2, 1fr)" },
    span2: { gridColumn: "span 1" },
    span3: { gridColumn: "span 2" },
    span4: { gridColumn: "span 2" },
    span6: { gridColumn: "span 2" }
  }
}));

const EMPTY = {
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: ""
};

const onlyDigits = value => String(value || "").replace(/\D/g, "");
const maskCep = value =>
  onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");

/**
 * Endereço de cobrança. Ao completar o CEP, rua, bairro, cidade e UF vêm
 * sozinhos (ViaCEP); a pessoa só confere e põe o número.
 */
const AddressDialog = ({ open, address, onClose, onSaved }) => {
  const classes = useStyles();
  const f = key => i18n.t(`financePage.address.${key}`);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...(address || {}) });
  }, [open, address]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const lookupCep = async value => {
    const cep = onlyDigits(value);
    if (cep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data?.erro) {
        toast.info(f("cepNotFound"));
        return;
      }
      setForm(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        district: data.bairro || prev.district,
        city: data.localidade || prev.city,
        state: data.uf || prev.state
      }));
    } catch {
      // sem internet ou ViaCEP fora: a pessoa preenche na mão
    }
  };

  const valid =
    onlyDigits(form.postalCode).length === 8 && form.number.trim().length > 0;

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/subscription/address", {
        ...form,
        postalCode: onlyDigits(form.postalCode)
      });
      toast.success(f("saved"));
      onSaved(data);
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const field = (key, className, props = {}) => (
    <TextField
      className={className}
      label={f(key)}
      value={form[key]}
      onChange={e => set(key, e.target.value)}
      variant="outlined"
      size="small"
      fullWidth
      {...props}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{f("title")}</DialogTitle>
      <DialogContent>
        <div className={classes.grid}>
          {field("postalCode", classes.span2, {
            value: maskCep(form.postalCode),
            onChange: e => {
              set("postalCode", e.target.value);
              lookupCep(e.target.value);
            },
            inputProps: { inputMode: "numeric" },
            autoFocus: true
          })}
          {field("street", classes.span4)}
          {field("number", classes.span2)}
          {field("complement", classes.span4)}
          {field("district", classes.span3)}
          {field("city", classes.span2)}
          {field("state", undefined, {
            inputProps: { maxLength: 2, style: { textTransform: "uppercase" } }
          })}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{f("cancel")}</Button>
        <Button
          color="primary"
          variant="contained"
          disableElevation
          disabled={!valid || saving}
          onClick={save}
        >
          {f("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressDialog;
