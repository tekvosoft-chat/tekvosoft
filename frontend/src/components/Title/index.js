import React from "react";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

/**
 * Título de página / de seção.
 *
 * Antes era `variant="h5" color="primary"`: roxo, sobre o fundo de rabiscos,
 * com pouco contraste e sem peso suficiente para ancorar a tela. Título é
 * estrutura, não ação — quem deve puxar o olho para a cor da marca é o botão
 * principal. Então o título passa a ser tinta cheia, e o roxo fica reservado
 * para o que se clica.
 */
const useStyles = makeStyles(theme => ({
  title: {
    fontSize: "1.375rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
    color: theme.palette.text.primary,
    margin: 0,
    minWidth: 0,
    [theme.breakpoints.down("xs")]: {
      fontSize: "1.1875rem"
    }
  }
}));

export default function Title({ children, className, ...rest }) {
  const classes = useStyles();

  return (
    <Typography
      component="h1"
      className={`${classes.title}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
    </Typography>
  );
}
