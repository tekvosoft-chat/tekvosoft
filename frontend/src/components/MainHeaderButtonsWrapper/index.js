import React from "react";

import { makeStyles } from "@material-ui/core/styles";

/**
 * Grupo de ações do cabeçalho (busca + botões).
 *
 * Antes: `margin: 8px` em cada filho, o que somava margens entre si, deixava
 * sobras nas pontas e nunca quebrava linha — daí o estouro no celular.
 *
 * Agora: gap de verdade, quebra de linha permitida e, no celular, a busca
 * assume a largura toda enquanto os botões dividem a linha de baixo. Nenhuma
 * ação fica escondida fora da tela.
 */
const useStyles = makeStyles(theme => ({
  wrapper: {
    flex: "none",
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1),

    // a busca das listagens
    "& .MuiTextField-root": {
      minWidth: 220,
      margin: 0
    },

    [theme.breakpoints.down("xs")]: {
      marginLeft: 0,
      width: "100%",
      "& .MuiTextField-root": {
        width: "100%",
        minWidth: 0,
        flexBasis: "100%"
      },
      // botões dividem a linha seguinte em vez de transbordar
      "& .MuiButton-root": {
        flex: "1 1 auto",
        minWidth: 0
      }
    }
  }
}));

const MainHeaderButtonsWrapper = ({ children }) => {
  const classes = useStyles();

  return <div className={classes.wrapper}>{children}</div>;
};

export default MainHeaderButtonsWrapper;
