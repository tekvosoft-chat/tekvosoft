import React from "react";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from "@material-ui/core";

import { i18n } from "../../translate/i18n";

const SOURCE_URL = "https://github.com/tekvosoft-chat/tekvosoft";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    content: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2)
    },
    logo: {
      display: "block",
      maxWidth: 200,
      maxHeight: 64,
      margin: theme.spacing(1, "auto", 0.5),
      content: `url("${theme.calculatedLogo()}")`
    },
    headline: {
      fontSize: "1.125rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      textAlign: "center",
      color: theme.palette.text.primary
    },
    text: {
      fontSize: "0.9375rem",
      lineHeight: 1.6,
      color: theme.palette.text.secondary
    },
    author: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.5),
      borderRadius: t.radius.lg,
      backgroundColor: t.brand.soft
    },
    initials: {
      flex: "none",
      width: 44,
      height: 44,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      backgroundColor: t.brand.main,
      color: t.brand.contrastText
    },
    authorName: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    authorRole: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    // A licença AGPL-3.0 (LICENSE.md) exige oferecer o código-fonte a quem
    // usa o sistema pela rede. É o único link que ficou, discreto no rodapé.
    license: {
      fontSize: "0.75rem",
      textAlign: "center",
      color: theme.palette.text.secondary,
      "& a": { color: "inherit" }
    }
  };
});

const AboutModal = ({ open, onClose }) => {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        {i18n.t("about.aboutthe")} {theme.appName || "Tekvosoft"}
      </DialogTitle>
      <DialogContent dividers className={classes.content}>
        <img className={classes.logo} alt="" />
        <Typography className={classes.headline} component="p">
          {i18n.t("about.headline")}
        </Typography>
        <Typography className={classes.text}>
          {i18n.t("about.product")}
        </Typography>
        <Typography className={classes.text}>
          {i18n.t("about.founder")}
        </Typography>
        <Typography className={classes.text}>
          {i18n.t("about.improving")}
        </Typography>
        <div className={classes.author}>
          <span className={classes.initials} aria-hidden="true">
            DF
          </span>
          <div>
            <Typography className={classes.authorName}>
              David Fernandes
            </Typography>
            <Typography className={classes.authorRole}>
              {i18n.t("about.founderRole")}
            </Typography>
          </div>
        </div>
        <Typography className={classes.license}>
          {i18n.t("about.license")}{" "}
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
            {i18n.t("about.sourceCode")}
          </a>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          {i18n.t("about.buttonclose")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AboutModal;
