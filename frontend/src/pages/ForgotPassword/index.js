import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import { makeStyles } from "@material-ui/core/styles";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import AuthShell, { useAuthButtonStyles } from "../Login/AuthShell";
import { LanguageMenu } from "../Login";

const useStyles = makeStyles({
  back: { textAlign: "center", fontSize: 14, "& a": { color: "#525252" } },
  sent: { margin: "8px 0 0", fontSize: 15, lineHeight: 1.55, color: "#404040" }
});

/** Esqueci minha senha: pede o link por e-mail (enviado pelo n8n). */
const ForgotPassword = () => {
  const classes = useStyles();
  const buttonClasses = useAuthButtonStyles();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      toastError(err);
    }
    setSending(false);
  };

  const back = (
    <div className={classes.back}>
      <Link component={RouterLink} to="/login">
        {i18n.t("forgotPassword.back")}
      </Link>
    </div>
  );

  if (sent) {
    return (
      <AuthShell
        title={i18n.t("forgotPassword.sentHeading")}
        actions={<LanguageMenu />}
      >
        <p className={classes.sent}>
          {i18n.t("forgotPassword.sent", { email: email.trim() })}
        </p>
        <Button
          fullWidth
          variant="contained"
          component={RouterLink}
          to="/login"
          className={buttonClasses.submit}
        >
          {i18n.t("forgotPassword.back")}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={i18n.t("forgotPassword.heading")}
      subtitle={i18n.t("forgotPassword.subheading")}
      actions={<LanguageMenu />}
    >
      <form noValidate onSubmit={handleSubmit}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          autoFocus
          type="email"
          label={i18n.t("forgotPassword.email")}
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={sending || !email.trim()}
          className={buttonClasses.submit}
        >
          {i18n.t("forgotPassword.submit")}
        </Button>
        {back}
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
