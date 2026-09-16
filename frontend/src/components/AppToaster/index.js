import React from "react";
import { ToastContainer, cssTransition } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";

import "./style.css";

const SlideUp = cssTransition({
  enter: "tkv-toast-up",
  exit: "tkv-toast-down",
  collapseDuration: 160
});

const SlideFromLeft = cssTransition({
  enter: "tkv-toast-in-left",
  exit: "tkv-toast-out-left",
  collapseDuration: 140
});

const useStyles = makeStyles(theme => ({
  toast: {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.tkv.surface,
    border: `1px solid ${theme.palette.tkv.border}`,
    boxShadow: "0 10px 30px -8px rgba(12, 10, 20, 0.35)"
  }
}));

const AppToaster = () => {
  const classes = useStyles();
  const isPhone = useMediaQuery("(max-width:599px)");

  return (
    <ToastContainer
      key={isPhone ? "phone" : "desktop"}
      className="tkv-toaster"
      toastClassName={classes.toast}
      position={isPhone ? "bottom-center" : "bottom-left"}
      transition={isPhone ? SlideUp : SlideFromLeft}
      autoClose={2600}
      hideProgressBar
      newestOnTop={!isPhone}
      limit={3}
      closeOnClick
      closeButton={false}
      draggable
      draggableDirection={isPhone ? "y" : "x"}
      draggablePercent={isPhone ? 35 : 45}
    />
  );
};

export default AppToaster;
