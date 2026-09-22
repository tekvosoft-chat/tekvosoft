import React, { useState } from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import AuthShell, { useAuthButtonStyles } from "../Login/AuthShell";
import { LanguageMenu } from "../Login";

const useStyles = makeStyles({
  back: { textAlign: "center", fontSize: 14, "& a": { color: "#525252" } }
});

/** Link do e-mail "esqueci minha senha": cria a senha nova. */
const ResetPassword = () => {
  const classes = useStyles();
  const buttonClasses = useAuthButtonStyles();
  const history = useHistory();
  const token = new URLSearchParams(useLocation().search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async event => {
    event.preventDefault();
    if (password.length < 6 || password !== confirm) return;
    setSaving(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success(i18n.t("resetPassword.success"));
      history.replace("/login");
      return;
    } catch (err) {
      toastError(err);
    }
    setSaving(false);
  };

  if (!token) {
    return (
      <AuthShell
        title={i18n.t("resetPassword.heading")}
        subtitle={i18n.t("resetPassword.invalid")}
        actions={<LanguageMenu />}
      >
        <Button
          fullWidth
          variant="contained"
          component={RouterLink}
          to="/forgot-password"
          className={buttonClasses.submit}
        >
          {i18n.t("resetPassword.requestNew")}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={i18n.t("resetPassword.heading")}
      subtitle={i18n.t("resetPassword.subheading")}
      actions={<LanguageMenu />}
    >
      <form noValidate onSubmit={handleSubmit}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          autoFocus
          type="password"
          label={i18n.t("resetPassword.password")}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          type="password"
          label={i18n.t("resetPassword.confirm")}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password"
          error={mismatch}
          helperText={mismatch ? i18n.t("resetPassword.mismatch") : " "}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={saving || password.length < 6 || password !== confirm}
          className={buttonClasses.submit}
        >
          {i18n.t("resetPassword.submit")}
        </Button>
        <div className={classes.back}>
          <Link component={RouterLink} to="/forgot-password">
            {i18n.t("resetPassword.requestNew")}
          </Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
