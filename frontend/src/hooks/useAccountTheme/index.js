import { useContext, useEffect } from "react";

import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";

/**
 * Aplica a aparência escolhida pelo PRÓPRIO usuário (cor, modo claro/escuro
 * e fundo das conversas). Cada admin tem a sua; não vale mais para a
 * empresa toda.
 *
 * - Ao entrar, lê a preferência que veio junto com o usuário.
 * - Quando a pessoa troca em Configurações > Aparência, a tela avisa por um
 *   evento e o tema muda na hora (inclusive em outras abas abertas).
 * - Ao sair, volta para a cor padrão da instalação.
 */
export const THEME_EVENT = "tkv:user-theme";

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
  const { user } = useContext(AuthContext);
  const { colorMode } = useContext(ColorModeContext);

  useEffect(() => {
    if (!enabled) return undefined;
    const apply = value => {
      const theme = parseAccountTheme(value);
      colorMode.applyAccountTheme(theme);
      if (theme?.mode === "dark" || theme?.mode === "light") {
        colorMode.setColorMode(theme.mode);
      }
    };
    apply(user?.appTheme);

    const onTheme = event => apply(event.detail);
    window.addEventListener(THEME_EVENT, onTheme);
    return () => {
      window.removeEventListener(THEME_EVENT, onTheme);
      colorMode.applyAccountTheme(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user?.id, colorMode]);
};

export default useAccountTheme;
