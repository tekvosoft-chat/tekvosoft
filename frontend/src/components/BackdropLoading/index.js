import React from "react";

import Backdrop from "@material-ui/core/Backdrop";
import { makeStyles } from "@material-ui/core/styles";

import BoxLoader from "../ui/BoxLoader";

const useStyles = makeStyles(theme => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    // fundo do app levemente transparente, com a animação na cor do tema
    backgroundColor:
      theme.mode === "dark"
        ? "rgba(18, 16, 25, 0.82)"
        : "rgba(246, 245, 250, 0.82)",
    backdropFilter: "blur(2px)"
  }
}));

const BackdropLoading = () => {
  const classes = useStyles();
  return (
    <Backdrop className={classes.backdrop} open={true}>
      <BoxLoader />
    </Backdrop>
  );
};

export default BackdropLoading;
