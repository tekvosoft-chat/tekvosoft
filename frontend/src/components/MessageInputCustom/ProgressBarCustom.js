import React from "react";
import LinearProgress from "@material-ui/core/LinearProgress";
import { makeStyles } from "@material-ui/core/styles";

// barra fina de envio (antes: 50px de altura, verde, cruzando a tela)
const useStyles = makeStyles(theme => ({
  root: { display: "flex", alignItems: "center", gap: 10, width: "100%" },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.palette.tkv.border
  },
  fill: { borderRadius: 2, backgroundColor: theme.palette.tkv.brand.main },
  label: {
    minWidth: 34,
    textAlign: "right",
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.text.secondary
  }
}));

export default function LinearWithValueLabel({ progress }) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <LinearProgress
        variant="determinate"
        value={progress}
        classes={{ root: classes.bar, bar: classes.fill }}
      />
      <span className={classes.label}>{`${Math.round(progress)}%`}</span>
    </div>
  );
}
