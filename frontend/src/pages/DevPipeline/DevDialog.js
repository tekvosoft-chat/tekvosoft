import React from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";

import { t } from "./shared";

/**
 * Diálogo do pipeline. No computador, uma janela com "Fechar" e o botão
 * principal. No celular, tela cheia: o X fica no topo (sair sem rolar até o
 * fim) e embaixo só o botão principal, na largura toda. Era o que deixava
 * os modais ruins no celular: fechar lá embaixo e dois botões empilhados.
 */
const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    paper: { borderRadius: tkv.radius.xl },
    title: { paddingBottom: 4 },
    titleRow: { display: "flex", alignItems: "flex-start", gap: 8 },
    titleText: { flex: 1, minWidth: 0 },
    heading: {
      margin: 0,
      fontSize: "1.25rem",
      fontWeight: 700,
      lineHeight: 1.4,
      color: theme.palette.text.primary
    },
    hint: {
      margin: "2px 0 0",
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary
    },
    close: { margin: theme.spacing(-1, -1.5, 0, 0) },
    actions: {
      padding: theme.spacing(1.5, 3, 2),
      [theme.breakpoints.down("xs")]: {
        padding: theme.spacing(1.5, 2),
        paddingBottom: `calc(${theme.spacing(1.5)}px + var(--safe-bottom, 0px))`,
        borderTop: `1px solid ${tkv.border}`,
        "& > *": { flex: 1, minHeight: 46 }
      }
    }
  };
});

const DevDialog = ({
  open,
  onClose,
  title,
  hint,
  maxWidth = "sm",
  // botão principal (ou botões): no celular, ocupa a largura toda
  actions,
  // enquanto salva, fechar fica travado
  busy = false,
  children
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("xs"));
  const close = () => !busy && onClose();

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth={maxWidth}
      fullScreen={phone}
      classes={{ paper: phone ? undefined : classes.paper }}
    >
      <DialogTitle className={classes.title} disableTypography>
        <div className={classes.titleRow}>
          <div className={classes.titleText}>
            <h2 className={classes.heading}>{title}</h2>
            {hint && <p className={classes.hint}>{hint}</p>}
          </div>
          <IconButton
            className={classes.close}
            aria-label={t("actions.close")}
            disabled={busy}
            onClick={close}
          >
            <CloseRoundedIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions className={classes.actions}>
        {!phone && (
          <Button disabled={busy} onClick={close}>
            {t("actions.close")}
          </Button>
        )}
        {actions}
      </DialogActions>
    </Dialog>
  );
};

export default DevDialog;
