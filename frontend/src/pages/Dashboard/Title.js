import React from "react";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

/**
 * Título de bloco do painel.
 *
 * Era `color="primary"`, ou seja, roxo. Dentro de um cartão branco um título
 * colorido compete com os botões e com os dados do gráfico sem acrescentar
 * informação. Vira tinta cheia; a cor da marca fica para o que é acionável.
 */
const useStyles = makeStyles(theme => ({
  title: {
    fontSize: "0.9375rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2)
  }
}));

const Title = props => {
  const classes = useStyles();

  return (
    <Typography component="h2" className={classes.title}>
      {props.children}
    </Typography>
  );
};

export default Title;
