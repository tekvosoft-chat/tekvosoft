import { useContext, useEffect } from "react";

import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";
import ColorModeContext from "../../layout/themeContext";

/**
 * Aplica o tema de cores da empresa enquanto a pessoa está logada.
 *
 * - Ao entrar, lê a configuração "appTheme" da empresa e pinta o sistema.
 * - Quando o admin troca o tema em Configurações > Aparência, o servidor
 *   avisa pelo socket e a tela de todo mundo da empresa muda na hora.
 * - Ao sair (o layout logado desmonta), devolve a cor da instalação — a
 *   tela de login não fica com a cor da última empresa que usou o navegador.
 */
export const parseAccountTheme = value => {
  if (!value) return null;
  try {
    const theme = typeof value === "string" ? JSON.parse(value) : value;
    return theme && theme.light && theme.dark ? theme : null;
  } catch (e) {
    return null;
  }
};

const useAccountTheme = enabled => {
  const socketManager = useContext(SocketContext);
  const { colorMode } = useContext(ColorModeContext);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;

    api
      .get("/settings/appTheme")
      .then(({ data }) => {
        if (alive) colorMode.applyAccountTheme(parseAccountTheme(data));
      })
      .catch(() => {});

    const socket = socketManager.GetSocket();
    const onSettings = data => {
      if (data?.key === "appTheme") {
        colorMode.applyAccountTheme(parseAccountTheme(data.value));
      }
    };
    socket.on("settings", onSettings);

    return () => {
      alive = false;
      socket.off?.("settings", onSettings);
      colorMode.applyAccountTheme(null);
    };
  }, [enabled, socketManager, colorMode]);
};

export default useAccountTheme;
