import React, { useContext, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import { makeStyles } from "@material-ui/core/styles";
import LanguageIcon from "@material-ui/icons/Translate";
import Visibility from "@material-ui/icons/VisibilityOutlined";
import VisibilityOff from "@material-ui/icons/VisibilityOffOutlined";

import { i18n } from "../../translate/i18n";
import { messages } from "../../translate/languages";

import { AuthContext } from "../../context/Auth/AuthContext";
import useSettings from "../../hooks/useSettings";
import AuthShell, { useAuthButtonStyles } from "./AuthShell";

const parseLoginLinks = value => {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      link => typeof link?.title === "string" && typeof link?.url === "string"
    );
  } catch (error) {
    return [];
  }
};

const useStyles = makeStyles(theme => ({
  signup: {
    textAlign: "center",
    fontSize: 14,
    color: "#737373"
  },
  links: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing(2),
    "& a": { color: "inherit", textDecoration: "none" },
    "& a:hover": { textDecoration: "underline" }
  }
}));

export const LanguageMenu = () => {
  const [anchor, setAnchor] = useState(null);
  const currentLanguage =
    localStorage.getItem("language") || i18n.language || "en";

  const choose = lang => {
    setAnchor(null);
    localStorage.setItem("language", lang);
    window.location.reload(false);
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={event => setAnchor(event.currentTarget)}
        aria-label={i18n.t("mainDrawer.appBar.i18n.language")}
      >
        <LanguageIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {Object.keys(messages).map(lang => (
          <MenuItem
            key={lang}
            onClick={() => choose(lang)}
            selected={currentLanguage === lang}
          >
            {messages[lang].translations.mainDrawer.appBar.i18n.language}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const Login = () => {
  const classes = useStyles();
  const buttonClasses = useAuthButtonStyles();
  const { getPublicSetting } = useSettings();
  const { handleLogin } = useContext(AuthContext);

  const [user, setUser] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [allowSignup, setAllowSignup] = useState(false);
  const [loginLinks, setLoginLinks] = useState([]);

  const handleChangeInput = event => {
    setUser(prevUser => ({
      ...prevUser,
      [event.target.name]: event.target.value.trim()
    }));
  };

  const handlSubmit = event => {
    event.preventDefault();
    handleLogin(user);
  };

  useEffect(() => {
    Promise.all([
      getPublicSetting("allowSignup"),
      getPublicSetting("loginPageLinks")
    ])
      .then(([allowSignupValue, loginLinksValue]) => {
        setAllowSignup(allowSignupValue === "enabled");
        setLoginLinks(parseLoginLinks(loginLinksValue));
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthShell
      title={i18n.t("login.heading")}
      subtitle={i18n.t("login.subheading")}
      actions={<LanguageMenu />}
      footer={
        loginLinks.length > 0 && (
          <div className={classes.links}>
            {loginLinks.map((link, index) => (
              <a
                href={link.url}
                key={`${link.url}-${index}`}
                target="_blank"
                rel="noreferrer"
              >
                {link.title}
              </a>
            ))}
          </div>
        )
      }
    >
      <form noValidate onSubmit={handlSubmit}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="email"
          label={i18n.t("login.form.email")}
          name="email"
          value={user.email}
          onChange={handleChangeInput}
          autoComplete="email"
          autoFocus
        />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="password"
          label={i18n.t("login.form.password")}
          type={showPassword ? "text" : "password"}
          id="password"
          value={user.password}
          onChange={handleChangeInput}
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label="toggle password"
                >
                  {showPassword ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          className={buttonClasses.submit}
        >
          {i18n.t("login.buttons.submit")}
        </Button>
        {allowSignup && (
          <div className={classes.signup}>
            <Link component={RouterLink} to="/signup">
              {i18n.t("login.buttons.register")}
            </Link>
          </div>
        )}
      </form>
    </AuthShell>
  );
};

export default Login;
