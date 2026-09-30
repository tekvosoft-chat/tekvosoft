import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
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
 *
 * Com anchor="top" ele desce do topo (ações da conversa na lista): cantos
 * arredondados embaixo, alcinha embaixo e respiro para a barra de status.
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
    boxShadow: "0 -12px 40px rgba(12, 10, 20, 0.28)",
    display: "flex",
    flexDirection: "column",
    // respeita a barra de gestos dos aparelhos sem botão físico
    paddingBottom: "var(--safe-bottom, 0px)"
  },
  paperTop: {
    borderRadius: 0,
    borderBottomLeftRadius: theme.palette.tkv.radius.xl,
    borderBottomRightRadius: theme.palette.tkv.radius.xl,
    boxShadow: "0 12px 40px rgba(12, 10, 20, 0.28)",
    paddingBottom: 0,
    paddingTop: "var(--safe-top, 0px)"
  },
  backdrop: {
    backgroundColor: "rgba(12, 10, 20, 0.44)",
    backdropFilter: "blur(3px)"
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
    width: 44,
    height: 5,
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
  anchor = "bottom",
  classes: sheetClasses = {},
  closeLabel = "Fechar",
  children
}) => {
  const classes = useStyles();
  const fromTop = anchor === "top";
  const grabber = (
    <div
      className={clsx(classes.grabber, sheetClasses.grabber)}
      aria-hidden="true"
    >
      <div className={clsx(classes.grabberBar, sheetClasses.grabberBar)} />
    </div>
  );

  return (
    <SwipeableDrawer
      anchor={fromTop ? "top" : "bottom"}
      open={open}
      onClose={onClose}
      onOpen={onOpen || (() => {})}
      disableSwipeToOpen
      disableDiscovery
      // sobe um pouco mais devagar do que desce, como nos apps do celular
      transitionDuration={{ enter: 320, exit: 220 }}
      classes={{
        paper: clsx(
          classes.paper,
          fromTop && classes.paperTop,
          sheetClasses.paper,
          fromTop && sheetClasses.paperTop
        )
      }}
      ModalProps={{
        keepMounted: true,
        BackdropProps: {
          className: clsx(classes.backdrop, sheetClasses.backdrop)
        }
      }}
    >
      {!fromTop && grabber}

      {(title || showClose) && (
        <div className={clsx(classes.header, sheetClasses.header)}>
          <div className={clsx(classes.titleBox, sheetClasses.titleBox)}>
            {title && (
              <Typography
                className={clsx(classes.title, sheetClasses.title)}
                component="h2"
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                className={clsx(classes.subtitle, sheetClasses.subtitle)}
                component="p"
              >
                {subtitle}
              </Typography>
            )}
          </div>
          {showClose && (
            <IconButton onClick={onClose} size="small" aria-label={closeLabel}>
              <CloseRoundedIcon />
            </IconButton>
          )}
        </div>
      )}

      <div className={clsx(classes.content, sheetClasses.content)}>
        {children}
      </div>
      {fromTop && grabber}
    </SwipeableDrawer>
  );
};

BottomSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpen: PropTypes.func,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  showClose: PropTypes.bool,
  anchor: PropTypes.oneOf(["bottom", "top"]),
  classes: PropTypes.object,
  closeLabel: PropTypes.string
};

export default BottomSheet;
