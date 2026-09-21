import React from "react";
import { makeStyles } from "@material-ui/core/styles";

import BoxLoader from "./BoxLoader";

const useStyles = makeStyles(theme => ({
  // sempre no centro da TELA (não da área da página), do mesmo tamanho no
  // celular e no computador: o carregamento não "pula" de lugar entre telas
  root: {
    position: "fixed",
    inset: 0,
    zIndex: theme.zIndex.modal - 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    animation: "$in .2s ease both"
  },
  "@keyframes in": { from: { opacity: 0 }, to: { opacity: 1 } }
}));

/** Carregamento de tela inteira: o mesmo em todas as páginas. */
const PageLoader = () => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <BoxLoader size={88} />
    </div>
  );
};

export default PageLoader;
