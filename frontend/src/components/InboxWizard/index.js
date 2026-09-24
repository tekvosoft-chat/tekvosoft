import React, { useState } from "react";
import { makeStyles, alpha } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";

import CHANNELS from "./channels";

/**
 * Escolha do canal ao criar uma caixa de entrada.
 *
 * Primeiro passo: de onde a mensagem vai chegar. Cada canal tem a sua
 * própria tela de criação depois — o WhatsApp pede QR code, o site pede
 * domínio e cor, o Instagram pede a conta. Por isso a escolha vem antes de
 * qualquer formulário.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      width: 860,
      maxWidth: "calc(100vw - 24px)",
      borderRadius: 20,
      backgroundColor: t.canvas,
      [theme.breakpoints.down("xs")]: {
        margin: 0,
        width: "100vw",
        maxWidth: "100vw",
        height: "100%",
        maxHeight: "100vh",
        borderRadius: 0
      }
    },
    head: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(2, 2, 1.5, 3),
      borderBottom: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    title: {
      flex: 1,
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    body: {
      display: "grid",
      gridTemplateColumns: "230px 1fr",
      [theme.breakpoints.down("xs")]: { display: "block" }
    },
    steps: {
      padding: theme.spacing(3, 2, 3, 3),
      borderRight: `1px solid ${t.border}`,
      [theme.breakpoints.down("xs")]: { display: "none" }
    },
    step: { display: "flex", gap: 12, marginBottom: 20 },
    stepNumber: {
      flex: "none",
      width: 26,
      height: 26,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.8125rem",
      fontWeight: 700,
      border: `1px solid ${t.border}`,
      color: theme.palette.text.secondary
    },
    stepNumberOn: {
      backgroundColor: t.brand.main,
      borderColor: t.brand.main,
      color: t.brand.contrastText
    },
    stepTitle: {
      fontSize: "0.875rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    stepHint: {
      fontSize: "0.75rem",
      lineHeight: 1.45,
      color: theme.palette.text.secondary
    },
    grid: {
      padding: theme.spacing(3),
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
      gap: 12,
      maxHeight: "60vh",
      overflowY: "auto",
      ...theme.scrollbarStyles
    },
    card: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 6,
      padding: "16px 16px 18px",
      borderRadius: 16,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      textAlign: "left",
      transition: "transform .12s ease, border-color .12s ease",
      "&:hover": { borderColor: t.brand.main, transform: "translateY(-2px)" }
    },
    cardOff: {
      opacity: 0.55,
      "&:hover": { borderColor: t.border, transform: "none" }
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      "& svg": { fontSize: 22 }
    },
    name: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    hint: {
      fontSize: "0.8125rem",
      lineHeight: 1.4,
      color: theme.palette.text.secondary
    },
    soon: {
      padding: "1px 8px",
      borderRadius: 999,
      fontSize: "0.625rem",
      fontWeight: 800,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary
    }
  };
});

const STEPS = [
  { title: "Escolha o canal", hint: "De onde as mensagens vão chegar." },
  { title: "Criar a caixa", hint: "Conectar a conta e dar um nome." },
  { title: "Quem atende", hint: "As filas e a equipe dessa caixa." }
];

const InboxWizard = ({ open, onClose, onChoose }) => {
  const classes = useStyles();
  const [step] = useState(0);

  return (
    <Dialog open={open} onClose={onClose} classes={{ paper: classes.paper }}>
      <div className={classes.head}>
        <span className={classes.title}>Nova caixa de entrada</span>
        <IconButton size="small" onClick={onClose} aria-label="Fechar">
          <CloseRoundedIcon />
        </IconButton>
      </div>

      <div className={classes.body}>
        <div className={classes.steps}>
          {STEPS.map((item, index) => (
            <div key={item.title} className={classes.step}>
              <span
                className={`${classes.stepNumber}${
                  index === step ? ` ${classes.stepNumberOn}` : ""
                }`}
              >
                {index + 1}
              </span>
              <span>
                <div className={classes.stepTitle}>{item.title}</div>
                <div className={classes.stepHint}>{item.hint}</div>
              </span>
            </div>
          ))}
        </div>

        <div className={classes.grid}>
          {CHANNELS.map(channel => (
            <ButtonBase
              key={channel.id}
              className={`${classes.card}${
                channel.pronto ? "" : ` ${classes.cardOff}`
              }`}
              disabled={!channel.pronto}
              onClick={() => onChoose(channel)}
            >
              <span
                className={classes.icon}
                style={{
                  backgroundColor: alpha(channel.color, 0.14),
                  color: channel.color
                }}
              >
                {channel.icon}
              </span>
              <span className={classes.name}>
                {channel.label}
                {!channel.pronto && (
                  <span className={classes.soon}>em breve</span>
                )}
              </span>
              <span className={classes.hint}>{channel.hint}</span>
            </ButtonBase>
          ))}
        </div>
      </div>
    </Dialog>
  );
};

export default InboxWizard;
