import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import InboxRoundedIcon from "@material-ui/icons/InboxRounded";

/**
 * Estado vazio.
 *
 * Uma tabela sem linhas hoje mostra um retângulo branco de 700px de altura, e
 * a pessoa não sabe se está carregando, se deu erro ou se não há nada. Este
 * componente responde as três perguntas: o que era para estar aqui, por que
 * não está, e o que fazer a seguir.
 */
const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(6, 3),
    minHeight: 240
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.palette.tkv.radius.lg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.tkv.brand.soft,
    color: theme.palette.tkv.brand.main,
    marginBottom: theme.spacing(1),
    "& svg": { fontSize: 28 }
  },
  title: {
    fontSize: "0.9375rem",
    fontWeight: 700,
    color: theme.palette.text.primary
  },
  description: {
    fontSize: "0.8125rem",
    color: theme.palette.text.secondary,
    maxWidth: 380,
    lineHeight: 1.55
  },
  action: { marginTop: theme.spacing(2) }
}));

const EmptyState = ({ icon, title, description, action, className }) => {
  const classes = useStyles();

  return (
    <div className={`${classes.root}${className ? ` ${className}` : ""}`}>
      <div className={classes.iconBox}>{icon || <InboxRoundedIcon />}</div>
      {title && (
        <Typography className={classes.title} component="p">
          {title}
        </Typography>
      )}
      {description && (
        <Typography className={classes.description} component="p">
          {description}
        </Typography>
      )}
      {action && <div className={classes.action}>{action}</div>}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node
};

export default EmptyState;
