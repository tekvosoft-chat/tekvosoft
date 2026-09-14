import React from "react";

import { makeStyles } from "@material-ui/core/styles";

/**
 * Cabeçalho das páginas: título à esquerda, busca e ações à direita.
 *
 * O problema que isto resolve: antes era um flex sem wrap, então no celular
 * o título + busca + quatro botões simplesmente estouravam a largura e a
 * página inteira passava a rolar para o lado — o comportamento que mais
 * incomodava no mobile.
 *
 * Agora a linha quebra: no desktop segue lado a lado; ao apertar, as ações
 * descem para baixo do título; no celular a busca ocupa a linha inteira,
 * que é onde ela é mais usada.
 */
const useStyles = makeStyles(theme => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),
    flex: "none",
    minWidth: 0,
    [theme.breakpoints.down("xs")]: {
      alignItems: "stretch",
      flexDirection: "column",
      gap: theme.spacing(1.5)
    }
  }
}));

const MainHeader = ({ children }) => {
  const classes = useStyles();

  return <div className={classes.header}>{children}</div>;
};

export default MainHeader;
