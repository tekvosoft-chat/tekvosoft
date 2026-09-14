import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";

/**
 * Painel que sobe de baixo para cima.
 *
 * É o substituto do menu que deslizava lateralmente no celular. A diferença
 * que importa não é a animação: é que o conteúdo aparece SOBRE a tela atual,
 * no alcance do polegar, e sai com um arrastar para baixo ou um toque fora —
 * sem tirar a pessoa do lugar onde ela estava.
 *
 * Usamos o SwipeableDrawer (e não o Drawer simples) justamente pelo gesto de
 * arrastar, que é o que faz parecer nativo.
 */
const useStyles = makeStyles(theme => ({
  paper: {
    borderTopLeftRadius: theme.palette.tkv.radius.xl,
    borderTopRightRadius: theme.palette.tkv.radius.xl,
    backgroundColor: theme.palette.tkv.surface,
    backgroundImage: "none",
    // 88% da área VISÍVEL: no iOS, vh conta também a parte escondida atrás
    // da barra do Safari, e o painel passava do topo da tela
    maxHeight: "calc(var(--vh, 100vh) * 0.88)",
    display: "flex",
    flexDirection: "column",
    // respeita a barra de gestos dos aparelhos sem botão físico
    paddingBottom: "var(--safe-bottom, 0px)"
  },
  grabber: {
    flex: "none",
    display: "flex",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 4,
    cursor: "grab"
  },
  grabberBar: {
    width: 40,
    height: 4,
    borderRadius: theme.palette.tkv.radius.pill,
    backgroundColor: theme.palette.tkv.borderStrong
  },
  header: {
    flex: "none",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1, 1.5, 2.5)
  },
  titleBox: { flex: 1, minWidth: 0 },
  title: {
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: theme.palette.text.primary
  },
  subtitle: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    marginTop: 2
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: theme.spacing(0, 1.5, 2),
    ...theme.scrollbarStyles
  }
}));

const BottomSheet = ({
  open,
  onClose,
  onOpen,
  title,
  subtitle,
  showClose = true,
  children
}) => {
  const classes = useStyles();

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen || (() => {})}
      disableSwipeToOpen
      disableDiscovery
      classes={{ paper: classes.paper }}
      ModalProps={{ keepMounted: true }}
    >
      <div className={classes.grabber} aria-hidden="true">
        <div className={classes.grabberBar} />
      </div>

      {(title || showClose) && (
        <div className={classes.header}>
          <div className={classes.titleBox}>
            {title && (
              <Typography className={classes.title} component="h2">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography className={classes.subtitle} component="p">
                {subtitle}
              </Typography>
            )}
          </div>
          {showClose && (
            <IconButton onClick={onClose} size="small" aria-label="Fechar">
              <CloseRoundedIcon />
            </IconButton>
          )}
        </div>
      )}

      <div className={classes.content}>{children}</div>
    </SwipeableDrawer>
  );
};

BottomSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpen: PropTypes.func,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  showClose: PropTypes.bool
};

export default BottomSheet;
