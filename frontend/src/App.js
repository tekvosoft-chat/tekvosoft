import React, { useState, useEffect, useMemo } from "react";

import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";

import { ptBR } from "@material-ui/core/locale";
import { ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import createAppTheme from "./theme/createAppTheme";
import { BRAND_INK, BRAND_INK_DARK_MODE, THEME_PRESETS } from "./theme/tokens";
import ColorModeContext from "./layout/themeContext";
import { PhoneCallProvider } from "./context/PhoneCall/PhoneCallContext";
import { SocketContext, socketManager } from "./context/Socket/SocketContext";
import useSettings from "./hooks/useSettings";
import Favicon from "react-favicon";
import { getBackendURL } from "./services/config";

import Routes from "./routes";
import NetworkStatus from "./components/NetworkStatus";

const queryClient = new QueryClient();
const defaultLogoLight = "/vector/logo.png";
const defaultLogoDark = "/vector/logo-dark.png";
const defaultLogoFavicon = "/vector/favicon-tab.png";

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
    const root = document.documentElement;
    // Maior altura visível já vista nesta largura. Serve de referência de
    // "sem teclado": no PWA do iPhone a janela inteira encolhe junto com o
    // teclado, então comparar com window.innerHeight (como antes) nunca
    // detectava o teclado aberto — e a margem da barra de gestos continuava
    // lá, virando uma faixa branca entre a conversa e o teclado.
    let baseline = 0;
    let baselineWidth = 0;
    const timers = [];

    const isTypingField = el =>
      !!el &&
      (el.tagName === "TEXTAREA" ||
        (el.tagName === "INPUT" &&
          !["checkbox", "radio", "button", "submit", "file", "range"].includes(
            el.type
          )) ||
        el.isContentEditable);

    const setVh = () => {
      const vv = window.visualViewport;
      const h = vv?.height || window.innerHeight;
      const w = vv?.width || window.innerWidth;

      // girou a tela ou mudou a largura: a referência antiga não vale mais
      if (Math.abs(w - baselineWidth) > 40) {
        baseline = h;
        baselineWidth = w;
      }
      if (!isTypingField(document.activeElement)) {
        baseline = Math.max(baseline, h);
      } else {
        baseline = Math.max(baseline, window.innerHeight, h);
      }

      root.style.setProperty("--vh", `${h}px`);
      root.style.setProperty(
        "--vv-top",
        `${Math.max(0, vv?.offsetTop || 0)}px`
      );
      root.classList.toggle(
        "kb-open",
        isTypingField(document.activeElement) && baseline - h > 120
      );
    };

    // Campo em foco: depois que o teclado sobe, rola o conteúdo até o campo
    // ficar à vista. A tela (ou o modal) encolhe para caber acima do teclado,
    // e o campo tocado podia ficar abaixo da dobra.
    // Vale para qualquer tela (login, cadastro, formulários), não só modais.
    const revealFocused = () => {
      const el = document.activeElement;
      if (!isTypingField(el)) return;
      let scroller = el.parentElement;
      while (scroller && scroller !== document.body) {
        const { overflowY } = getComputedStyle(scroller);
        if (
          /(auto|scroll)/.test(overflowY) &&
          scroller.scrollHeight > scroller.clientHeight
        ) {
          break;
        }
        scroller = scroller.parentElement;
      }
      if (!scroller || scroller === document.body) return;
      const rect = scroller.getBoundingClientRect();
      // o que realmente aparece: a caixa que rola, cortada pela área visível
      const vv = window.visualViewport;
      const box = {
        top: rect.top,
        bottom: Math.min(rect.bottom, vv ? vv.height : window.innerHeight)
      };
      const field = el.getBoundingClientRect();
      const margin = 16;
      if (field.bottom > box.bottom - margin) {
        scroller.scrollTop += field.bottom - box.bottom + margin;
      } else if (field.top < box.top + margin) {
        scroller.scrollTop -= box.top + margin - field.top;
      }
    };

    // o evento de resize do teclado do iOS chega atrasado e às vezes nem
    // chega; recalcula também logo depois do foco e do fim da animação
    const schedule = () => {
      [60, 320, 650].forEach(ms =>
        timers.push(
          setTimeout(() => {
            setVh();
            revealFocused();
          }, ms)
        )
      );
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setVh);
      window.visualViewport.addEventListener("scroll", setVh);
    }
    window.addEventListener("resize", setVh);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);

    setVh(); // initial

    return () => {
      timers.forEach(clearTimeout);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setVh);
        window.visualViewport.removeEventListener("scroll", setVh);
      }
      window.removeEventListener("resize", setVh);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
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
  const [primaryColorLight, setPrimaryColorLight] = useState(BRAND_INK);
  const [primaryColorDark, setPrimaryColorDark] = useState(BRAND_INK_DARK_MODE);
  const [appLogoLight, setAppLogoLight] = useState("");
  const [appLogoDark, setAppLogoDark] = useState("");
  const [appLogoFavicon, setAppLogoFavicon] = useState("");
  const [appName, setAppName] = useState("");
  const { getPublicSetting } = useSettings();

  /**
   * Tema de cores da conta (Configurações > Aparência).
   *
   * Fica POR CIMA da cor da instalação (whitelabel), só enquanto alguém está
   * logado: a tela de login continua com a cor da instalação, e cada empresa
   * vê o sistema na cor que o próprio admin escolheu.
   *   null                      -> usa a cor da instalação
   *   { light, dark, preset }   -> cores do tema escolhido
   */
  const [accountTheme, setAccountTheme] = useState(null);
  // ícone (aba, app instalado) na cor do tema da empresa logada
  const [themedFavicon, setThemedFavicon] = useState(null);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode(prevMode => (prevMode === "light" ? "dark" : "light"));
      },
      setColorMode: next => {
        setMode(next === "dark" ? "dark" : "light");
      },
      applyAccountTheme: theme => {
        setAccountTheme(theme && theme.light && theme.dark ? theme : null);
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
        primaryColor:
          mode === "light"
            ? accountTheme?.light || primaryColorLight
            : accountTheme?.dark || primaryColorDark,
        accentColor:
          accountTheme?.accent ||
          THEME_PRESETS.find(
            p => p.id === (accountTheme?.preset || "tekvosoft")
          )?.accent,
        wallpaper: accountTheme?.wallpaper,
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
      primaryColorLight,
      accountTheme
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

  // A barra de status do celular (a faixa da hora e da bateria no PWA) segue
  // a cor do tema, igual à barra superior. Antes ficava sempre roxa, mesmo
  // com a empresa usando outro tema.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    // a barra superior é da cor do tema nos dois modos
    meta.setAttribute("content", theme.palette.primary.main);
    // a tela de carregamento (index.html) abre antes do login: guarda a cor
    // do tema da empresa para ela não voltar ao roxo padrão
    try {
      localStorage.setItem("tkvLoaderColor", theme.palette.tkv.brand.text);
    } catch (err) {
      // sem armazenamento: usa a cor pública
    }
  }, [theme, mode]);

  useEffect(() => {
    // ícone personalizado (whitelabel) tem prioridade; sem tema da empresa
    // (ou deslogado), o preto padrão. A cor do claro é a que garante o balão
    // branco legível por cima.
    if (appLogoFavicon) {
      setThemedFavicon(null);
      return;
    }
  }, [accountTheme, appLogoFavicon]);

  useEffect(() => {
    getPublicSetting("primaryColorLight")
      .then(color => {
        setPrimaryColorLight(color || BRAND_INK);
      })
      .catch(error => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("primaryColorDark")
      .then(color => {
        setPrimaryColorDark(color || BRAND_INK_DARK_MODE);
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
        setAppName(name || "vuup.me");
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
        url={
          appLogoFavicon
            ? theme.appLogoFavicon
            : themedFavicon || defaultLogoFavicon
        }
      />
      <ColorModeContext.Provider value={{ colorMode, accountTheme, mode }}>
        <PhoneCallProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
              <SocketContext.Provider value={socketManager}>
                <Routes />
                {/* aviso de internet lenta ou fora do ar (vale também na
                    tela de entrar, antes de qualquer login) */}
                <NetworkStatus />
              </SocketContext.Provider>
            </QueryClientProvider>
          </ThemeProvider>
        </PhoneCallProvider>
      </ColorModeContext.Provider>
    </>
  );
};

export default App;
