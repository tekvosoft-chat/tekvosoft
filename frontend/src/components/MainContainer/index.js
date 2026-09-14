import React from "react";

import { makeStyles } from "@material-ui/core/styles";

/**
 * Moldura das páginas de listagem.
 *
 * O que mudou e por quê:
 *
 * - Saiu o papel de parede de rabiscos do WhatsApp. Ele era repetido aqui E no
 *   MainHeader, com recortes diferentes, o que criava uma emenda visível no
 *   meio da tela. Além disso competia com o conteúdo e derrubava o contraste
 *   do texto. Área de trabalho pede fundo calmo; a personalidade vem da cor
 *   da marca nos elementos, não do papel de parede.
 *
 * - Sai o Container do Material-UI (que impunha largura fixa por breakpoint)
 *   e entra uma largura máxima generosa com respiro lateral proporcional.
 *
 * - Reserva espaço embaixo no celular para a barra de navegação inferior não
 *   cobrir a última linha da lista.
 */
const useStyles = makeStyles(theme => ({
  mainContainer: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    backgroundColor: theme.palette.tkv.canvas,
    padding: theme.spacing(3),
    paddingBottom: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(2)
    },
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(1.5),
      // altura da bottom navigation + área segura do aparelho
      paddingBottom: `calc(${theme.palette.tkv.layout.bottomNavHeight}px + env(safe-area-inset-bottom, 0px) + ${theme.spacing(1.5)}px)`
    }
  },

  inner: {
    width: "100%",
    maxWidth: theme.palette.tkv.layout.contentMaxWidth,
    margin: "0 auto",
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2)
  }
}));

const MainContainer = ({ children, className }) => {
  const classes = useStyles();

  return (
    <div
      className={`${classes.mainContainer}${className ? ` ${className}` : ""}`}
    >
      <div className={classes.inner}>{children}</div>
    </div>
  );
};

export default MainContainer;
