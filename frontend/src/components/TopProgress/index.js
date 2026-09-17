import React, { useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";

import api from "../../services/api";

/**
 * Barrinha fina no topo enquanto o sistema busca dados do servidor.
 * Só aparece se a espera passar de ~250 ms (requisições rápidas não piscam).
 */
const useStyles = makeStyles(theme => ({
  bar: {
    position: "fixed",
    top: "var(--safe-top, 0px)",
    left: 0,
    right: 0,
    height: 2,
    zIndex: theme.zIndex.snackbar + 1,
    pointerEvents: "none",
    overflow: "hidden",
    opacity: 0,
    transition: "opacity .25s ease",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      bottom: 0,
      width: "40%",
      borderRadius: 2,
      background: `linear-gradient(90deg, transparent, ${theme.palette.tkv.brand.main}, transparent)`,
      animation: "$slide 1.1s ease-in-out infinite"
    }
  },
  on: { opacity: 1 },
  "@keyframes slide": {
    from: { left: "-40%" },
    to: { left: "100%" }
  }
}));

const TopProgress = () => {
  const classes = useStyles();
  const [active, setActive] = useState(false);
  const pending = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    const start = config => {
      // chamadas em segundo plano podem pedir para não mostrar a barra
      if (!config?.silent) {
        pending.current += 1;
        if (!timer.current) {
          timer.current = setTimeout(() => {
            if (pending.current > 0) setActive(true);
          }, 250);
        }
      }
      return config;
    };
    const finish = config => {
      if (config && !config.silent) {
        pending.current = Math.max(0, pending.current - 1);
        if (pending.current === 0) {
          clearTimeout(timer.current);
          timer.current = null;
          setActive(false);
        }
      }
    };
    const req = api.interceptors.request.use(start);
    const res = api.interceptors.response.use(
      response => {
        finish(response.config);
        return response;
      },
      error => {
        finish(error?.config);
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.request.eject(req);
      api.interceptors.response.eject(res);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      className={`${classes.bar}${active ? ` ${classes.on}` : ""}`}
      aria-hidden="true"
    />
  );
};

export default TopProgress;
