import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

// Fundos animados da tela de entrada (só no computador): alternam a cada
// visita (lua ↔ cidade). No celular a tela é branca e limpa.
const BACKGROUNDS = ["/backgrounds/moon.webp", "/backgrounds/city.webp"];
const BG_KEY = "tkv:authBg";

const pickBackground = () => {
  let index = 0;
  try {
    index = (Number(localStorage.getItem(BG_KEY)) || 0) % BACKGROUNDS.length;
    localStorage.setItem(BG_KEY, String(index + 1));
  } catch (e) {
    index = Math.floor(Math.random() * BACKGROUNDS.length);
  }
  return BACKGROUNDS[index];
};

const useStyles = makeStyles(theme => ({
  root: {
    position: "fixed",
    inset: 0,
    display: "flex",
    background: "#000",
    color: "#fff",
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: { background: "#fff" }
  },
  art: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    [theme.breakpoints.down("sm")]: { display: "none" },
    [theme.breakpoints.up("md")]: {
      left: "44%"
    }
  },
  artShade: {
    position: "absolute",
    inset: 0,
    [theme.breakpoints.up("md")]: {
      left: "44%",
      background:
        "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.35) 100%)"
    }
  },
  panel: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    width: "44%",
    minWidth: 380,
    padding: theme.spacing(6, 8),
    background: "#fff",
    color: "#0a0a0a",
    overflowY: "auto",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      minWidth: 0,
      padding: theme.spacing(3, 3),
      paddingTop: "calc(var(--safe-top, 0px) + 56px)",
      background: "#fff",
      alignItems: "center"
    }
  },
  card: {
    width: "100%",
    maxWidth: 400,
    margin: "auto",
    // Campos e botões em preto e branco, independentes da cor da marca.
    "& .MuiOutlinedInput-root": {
      borderRadius: 10,
      background: "#fff",
      color: "#0a0a0a"
    },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d4d4d4" },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#737373"
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#0a0a0a",
      borderWidth: 1.5
    },
    // sem o azul do preenchimento automático do navegador
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px #fff inset",
      WebkitTextFillColor: "#0a0a0a",
      caretColor: "#0a0a0a"
    },
    "& .MuiInputLabel-root": { color: "#737373" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#0a0a0a" },
    "& .MuiSelect-icon": { color: "#525252" },
    "& .MuiFormHelperText-root": { marginLeft: 2 },
    "& a": { color: "#0a0a0a", fontWeight: 600 }
  },
  logo: {
    display: "block",
    maxWidth: 170,
    maxHeight: 56,
    marginBottom: theme.spacing(4),
    content: `url("${theme.calculatedLogoLight()}")`
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0
  },
  subtitle: {
    margin: theme.spacing(0.75, 0, 3),
    fontSize: 14.5,
    color: "#737373"
  },
  footer: {
    marginTop: theme.spacing(3),
    fontSize: 12,
    color: "#a3a3a3",
    textAlign: "center"
  },
  topActions: {
    position: "absolute",
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 2,
    display: "flex",
    gap: 4,
    "& button": {
      color: "#fff",
      background: "rgba(0,0,0,0.35)",
      backdropFilter: "blur(6px)"
    },
    "& button:hover": { background: "rgba(0,0,0,0.55)" },
    [theme.breakpoints.down("sm")]: {
      top: "calc(var(--safe-top, 0px) + 12px)",
      "& button": { color: "#0a0a0a", background: "#f5f5f5" },
      "& button:hover": { background: "#e5e5e5" }
    }
  }
}));

export const useAuthButtonStyles = makeStyles(theme => ({
  submit: {
    margin: theme.spacing(3, 0, 2),
    height: 48,
    borderRadius: 10,
    background: "#0a0a0a",
    color: "#fff",
    fontWeight: 600,
    textTransform: "none",
    fontSize: 15,
    boxShadow: "none",
    "&:hover": { background: "#262626", boxShadow: "none" }
  }
}));

const AuthShell = ({ title, subtitle, actions, children, footer }) => {
  const classes = useStyles();
  const [background] = useState(pickBackground);

  return (
    <div className={classes.root}>
      <CssBaseline />
      <div
        className={classes.art}
        style={{ backgroundImage: `url("${background}")` }}
      />
      <div className={classes.artShade} />
      {actions && <div className={classes.topActions}>{actions}</div>}
      <div className={classes.panel}>
        <div className={classes.card}>
          <img className={classes.logo} alt="" />
          {title && <h1 className={classes.title}>{title}</h1>}
          {subtitle && <p className={classes.subtitle}>{subtitle}</p>}
          {children}
        </div>
        {footer && <div className={classes.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default AuthShell;
