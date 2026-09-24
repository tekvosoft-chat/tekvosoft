import React, { useEffect, useState } from "react";
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

/**
 * Carregamento de tela inteira: o mesmo em todas as páginas.
 *
 * Ele espera meio segundo antes de aparecer. Trocar de tela dentro do
 * sistema costuma levar bem menos que isso, então a animação some do
 * caminho — o que a pessoa vê é a tela nova, e não um recarregamento a cada
 * clique. Quem carrega o site inteiro passa `delay={0}` e vê na hora.
 */
const PageLoader = ({ delay = 500 }) => {
  const classes = useStyles();
  const [show, setShow] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return undefined;
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return (
    <div className={classes.root}>
      <BoxLoader size={88} />
    </div>
  );
};

export default PageLoader;
