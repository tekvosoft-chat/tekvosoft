import React, { useState, useEffect, useMemo } from "react";

import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";

import { ptBR } from "@material-ui/core/locale";
import { ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import createAppTheme from "./theme/createAppTheme";
import { BRAND_PURPLE, BRAND_PURPLE_DARK_MODE } from "./theme/tokens";
import ColorModeContext from "./layout/themeContext";
import { PhoneCallProvider } from "./context/PhoneCall/PhoneCallContext";
import { SocketContext, socketManager } from "./context/Socket/SocketContext";
import useSettings from "./hooks/useSettings";
import Favicon from "react-favicon";
import { getBackendURL } from "./services/config";

import Routes from "./routes";

const queryClient = new QueryClient();
const defaultLogoLight = "/vector/logo.png";
const defaultLogoDark = "/vector/logo-dark.png";
const defaultLogoFavicon = "/vector/favicon.png";

/**
 * Mantém o app do tamanho e na posição da área realmente visível.
 *
 * No iPhone, quando o teclado abre, a janela não encolhe: quem encolhe é a
 * "área visível" (visualViewport), que ainda pode ser deslocada para baixo
 * para mostrar o campo em foco. Sem acompanhar esse deslocamento, o app
 * ficava preso no topo e a conversa sumia acima da tela.
 *
 *   --vh      altura visível (o layout ocupa exatamente isso)
 *   --vv-top  quanto a área visível desceu (o #root desce junto)
 *   kb-open   classe no <html> com o teclado aberto: tira a margem da barra
 *             de gestos, que nessa hora fica escondida atrás do teclado
 */
function useViewportHeight() {
  useEffect(() => {
    const setVh = () => {
      const vv = window.visualViewport;
      const h = vv?.height || window.innerHeight;
      const root = document.documentElement;
      root.style.setProperty("--vh", `${h}px`);
      root.style.setProperty(
        "--vv-top",
        `${Math.max(0, vv?.offsetTop || 0)}px`
      );
      root.classList.toggle("kb-open", window.innerHeight - h > 150);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setVh);
      window.visualViewport.addEventListener("scroll", setVh);
    }
    window.addEventListener("resize", setVh);

    setVh(); // initial

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setVh);
        window.visualViewport.removeEventListener("scroll", setVh);
      }
      window.removeEventListener("resize", setVh);
    };
  }, []);
}

const App = () => {
  const [locale, setLocale] = useState();

  const prefersDarkMode = !!window.matchMedia("(prefers-color-scheme: dark)")
    .matches;
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [mode, setMode] = useState(
    preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light"
  );
  const [primaryColorLight, setPrimaryColorLight] = useState(BRAND_PURPLE);
  const [primaryColorDark, setPrimaryColorDark] = useState(
    BRAND_PURPLE_DARK_MODE
  );
  const [appLogoLight, setAppLogoLight] = useState("");
  const [appLogoDark, setAppLogoDark] = useState("");
  const [appLogoFavicon, setAppLogoFavicon] = useState("");
  const [appName, setAppName] = useState("");
  const { getPublicSetting } = useSettings();

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode(prevMode => (prevMode === "light" ? "dark" : "light"));
      },
      setPrimaryColorLight: color => {
        setPrimaryColorLight(color);
      },
      setPrimaryColorDark: color => {
        setPrimaryColorDark(color);
      },
      setAppLogoLight: file => {
        setAppLogoLight(file);
      },
      setAppLogoDark: file => {
        setAppLogoDark(file);
      },
      setAppLogoFavicon: file => {
        setAppLogoFavicon(file);
      },
      setAppName: name => {
        setAppName(name);
      }
    }),
    []
  );

  const calculatedLogoDark = () => {
    if (appLogoDark === defaultLogoDark && appLogoLight !== defaultLogoLight) {
      return appLogoLight;
    }
    return appLogoDark;
  };
  const calculatedLogoLight = () => {
    if (appLogoDark !== defaultLogoDark && appLogoLight === defaultLogoLight) {
      return appLogoDark;
    }
    return appLogoLight;
  };

  const theme = useMemo(
    () =>
      createAppTheme({
        mode,
        primaryColor: mode === "light" ? primaryColorLight : primaryColorDark,
        locale,
        appLogoLight,
        appLogoDark,
        appLogoFavicon,
        appName,
        calculatedLogoLight,
        calculatedLogoDark
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      locale,
      mode,
      primaryColorDark,
      primaryColorLight
    ]
  );

  useEffect(() => {
    const i18nlocale = localStorage.getItem("language");
    if (!i18nlocale) {
      return;
    }

    const browserLocale =
      i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);

    if (browserLocale === "ptBR") {
      setLocale(ptBR);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("preferredTheme", mode);
  }, [mode]);

  useEffect(() => {
    getPublicSetting("primaryColorLight")
      .then(color => {
        setPrimaryColorLight(color || BRAND_PURPLE);
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("primaryColorDark")
      .then(color => {
        setPrimaryColorDark(color || BRAND_PURPLE_DARK_MODE);
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoLight")
      .then(
        file => {
          setAppLogoLight(
            file ? `${getBackendURL()}/public/${file}` : defaultLogoLight
          );
        },
        _ => {}
      )
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoDark")
      .then(file => {
        setAppLogoDark(
          file ? `${getBackendURL()}/public/${file}` : defaultLogoDark
        );
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoFavicon")
      .then(file => {
        setAppLogoFavicon(file ? `${getBackendURL()}/public/${file}` : null);
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appName")
      .then(name => {
        setAppName(name || "Tekvosoft");
      })
      .catch(error => {
        console.log("Error reading setting", error);
        setAppName("whitelabel chat");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useViewportHeight();

  return (
    <>
      <Favicon
        url={appLogoFavicon ? theme.appLogoFavicon : defaultLogoFavicon}
      />
      <ColorModeContext.Provider value={{ colorMode }}>
        <PhoneCallProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
              <SocketContext.Provider value={socketManager}>
                <Routes />
              </SocketContext.Provider>
            </QueryClientProvider>
          </ThemeProvider>
        </PhoneCallProvider>
      </ColorModeContext.Provider>
    </>
  );
};

export default App;
