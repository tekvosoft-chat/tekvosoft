import React, { useState, useContext, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import clsx from "clsx";
import {
  makeStyles,
  Drawer,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  ButtonBase,
  InputBase
} from "@material-ui/core";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import UnfoldMoreRoundedIcon from "@material-ui/icons/UnfoldMoreRounded";

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SettingsEthernetIcon from "@material-ui/icons/SettingsEthernet";

import MainListItems from "./MainListItems";
import MobileNav from "./MobileNav";
import useNotificationSound, {
  isNotificationSoundOn
} from "../hooks/useNotificationSound";
import { syncPush } from "../services/push";
import UserAvatar from "../components/ui/UserAvatar";
import TrialBanner, { getTrialStatus } from "../components/TrialBanner";
import Paywall, { isCompanyExpired } from "../components/Paywall";
import useAccountTheme from "../hooks/useAccountTheme";
import NotificationsPopOver from "../components/NotificationsPopOver";
import { PhoneCall } from "../components/PhoneCall";
import UserModal from "../components/UserModal";
import AboutModal from "../components/AboutModal";
import { AuthContext } from "../context/Auth/AuthContext";
import { i18n } from "../translate/i18n";
import { messages } from "../translate/languages";
import toastError from "../errors/toastError";

import { SocketContext } from "../context/Socket/SocketContext";
import ChatPopover from "../pages/Chat/ChatPopover";
import ChatHead from "../components/ChatHead";

import { useDate } from "../hooks/useDate";
import useAuth from "../hooks/useAuth.js";

import ColorModeContext from "../layout/themeContext";
import NestedMenuItem from "material-ui-nested-menu-item";
import GoogleAnalytics from "../components/GoogleAnalytics";
import OnlyForSuperUser from "../components/OnlyForSuperUser";
import NewTicketModal from "../components/NewTicketModal/index.js";

const drawerWidth = 264;
const drawerWidthCollapsed = 72;
const appBarHeight = 56;
const DRAWER_STORAGE_KEY = "drawerOpen";

function getStoredDrawerOpen() {
  return localStorage.getItem(DRAWER_STORAGE_KEY) === "true";
}

function persistDrawerOpenState(value) {
  localStorage.setItem(DRAWER_STORAGE_KEY, String(value));
}

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    height: "var(--vh)",
    boxSizing: "border-box",
    // entalhe / barra de status: no PWA do iPhone o conteúdo não pode
    // começar embaixo da hora e da bateria
    paddingTop: "var(--safe-top, 0px)",
    backgroundColor: theme.palette.fancyBackground,
    // Antes havia aqui dois estilos globais herdados (borda verde-azulada
    // cravada em todo botão contornado e uma cor de aba inválida). Eles
    // passavam por cima do tema e deixavam "Novo" e "Cancelar" com cores
    // que não existem no resto do sistema. O tema já cuida dos dois.
    [theme.breakpoints.down("xs")]: {
      position: "relative",
      "--mobile-nav-space":
        "calc(76px + max(0px, var(--safe-bottom, 0px) - 6px))",
      // No celular a pilha é vertical: conteúdo e, embaixo, a navegação.
      // A barra inferior ocupa o próprio espaço no fluxo em vez de flutuar
      // por cima com position: fixed — flutuando, ela ficava presa atrás da
      // barra de ferramentas do navegador e cobria o fim das telas.
      flexDirection: "column"
    }
  },
  avatar: {
    width: 30,
    height: 30,
    fontSize: theme.typography.pxToRem(14),
    display: "block",
    boxSizing: "border-box",
    flexShrink: 0
  },
  userInfoWrapper: {
    display: "flex",
    alignItems: "center"
  },
  profileTrigger: {
    display: "flex",
    alignItems: "center",
    width: "fit-content",
    minWidth: 40,
    maxWidth: 160,
    borderRadius: 20,
    overflow: "hidden",
    cursor: "pointer",
    // em cima da barra colorida: vidro claro em vez de cartão cinza
    color: "inherit",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    border: "1px solid rgba(255, 255, 255, 0.22)",
    transition: "background-color .15s ease",
    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.22)" },
    borderRadius: "50%",
    padding: 0,
    minWidth: 0
  },
  profileAvatarSlot: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: "0 20px 20px 0"
  },
  // no topo fica só a foto (nome e empresa estão no cartão do menu lateral)
  userInfoPanel: {
    display: "none"
  },
  userInfoName: {
    color: theme.palette.text.primary,
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%"
  },
  userInfoCompany: {
    color: theme.palette.text.secondary,
    fontSize: 11,
    lineHeight: "15px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%"
  },
  /**
   * Barra de cima.
   *
   * Antes ela era pintada de roxo por cima da AppBar, o que tornava a faixa
   * um bloco maciço da cor da marca e obrigava todo ícone ali dentro a ser
   * branco. Agora o normal é herdar a superfície clara.
   *
   * O que NÃO se perde: quando um administrador está personificando outra
   * empresa, a barra continua mudando de cor. Isso não era enfeite, era
   * aviso de que você não está na sua própria conta — e some com facilidade
   * demais se a gente deixar. Ganhou tom de alerta, que comunica melhor do
   * que "azul secundário".
   */
  toolbar: {
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(0.25),
    // No celular são até sete ícones mais o avatar em 390px. Sem apertar o
    // respiro de cada um, o último item fica cortado na borda da tela.
    // ícones na cor do texto da barra (o tema deixa IconButton cinza)
    "& .MuiIconButton-root": {
      color: "inherit",
      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.14)" }
    },
    [theme.breakpoints.down("xs")]: {
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(0.5),
      gap: 0,
      "& .MuiIconButton-root": { padding: 6 },
      "& .MuiSvgIcon-root": { fontSize: 21 }
    },
    ...(localStorage.getItem("impersonated") === "true"
      ? {
          backgroundColor: theme.palette.tkv.semantic.warningSoft,
          color: theme.palette.tkv.semantic.warning,
          boxShadow: `inset 0 -2px 0 ${theme.palette.tkv.semantic.warning}`
        }
      : {})
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: appBarHeight,
    padding: theme.spacing(0, 2),
    flex: "none"
  },
  /**
   * Barra superior na cor do tema, de ponta a ponta, com a logo em branco —
   * como no Whaticket. Troca de cor junto com o tema escolhido pela empresa;
   * o menu lateral fica logo abaixo dela.
   */
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    // abaixo da faixa de teste grátis, quando ela existe
    top: "calc(var(--safe-top, 0px) + var(--banner-h, 0px))",
    width: "100%",
    marginLeft: 0,
    backgroundColor: theme.palette.tkv.brand.main,
    color: theme.palette.tkv.brand.contrastText,
    borderBottom: "none",
    boxShadow: `0 1px 0 ${theme.palette.tkv.brand.hover}`,
    transition: theme.transitions.create("background-color")
  },
  appBarShift: {},
  // celular: a faixa da hora e da bateria na mesma cor da barra
  statusBarFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "var(--safe-top, 0px)",
    zIndex: theme.zIndex.drawer + 2,
    backgroundColor: theme.palette.background.default
  },
  menuButton: {
    marginRight: theme.spacing(0.5),
    color: "inherit"
  },
  /**
   * Recolher/expandir o menu: um botão redondo na BORDA do menu, na altura
   * dos olhos, em vez de um ícone perdido na barra de cima. Ele acompanha a
   * largura do menu e gira a seta conforme o estado.
   */
  drawerEdgeToggle: {
    position: "fixed",
    top: `calc(var(--banner-h, 0px) + ${theme.spacing(4)}px)`,
    left: drawerWidth - 14,
    zIndex: theme.zIndex.drawer + 2,
    width: 28,
    height: 28,
    padding: 0,
    borderRadius: "50%",
    color: theme.palette.tkv.brand.text,
    backgroundColor: theme.palette.tkv.surface,
    border: `1px solid ${theme.palette.tkv.border}`,
    boxShadow: "0 4px 14px -6px rgba(12, 10, 20, 0.45)",
    transition: theme.transitions.create(["left", "background-color"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    "&:hover": { backgroundColor: theme.palette.tkv.brand.textSoft },
    "& svg": {
      fontSize: 18,
      transition: "transform .25s ease"
    }
  },
  drawerEdgeToggleClosed: {
    left: drawerWidthCollapsed - 14,
    "& svg": { transform: "rotate(180deg)" }
  },
  // A logo vira uma silhueta clara (ou escura, se o tema for claro demais
  // para texto branco): assim ela combina com qualquer cor de barra, em vez
  // de ficar presa às cores da imagem original.
  appBarLogo: {
    // a imagem do ícone tem respiro em volta: 44px mostra o símbolo com ~32px
    height: 44,
    width: 44,
    margin: "-6px 4px -6px -4px",
    objectFit: "contain",
    marginRight: theme.spacing(1),
    display: "block",
    cursor: "pointer",
    filter:
      theme.palette.tkv.brand.contrastText === "#FFFFFF"
        ? "brightness(0) invert(1)"
        : "brightness(0)",
    opacity: 0.96,
    [theme.breakpoints.down("xs")]: { height: 40, width: 40 }
  },
  menuButtonHidden: {
    display: "none"
  },
  // Atalhos de conversas, informativos e chat interno saíram da barra (no
  // celular e no computador). Continuam montados: os avisos, o som e o
  // contador do app seguem funcionando por trás.
  hideOnPhone: {
    display: "none"
  },
  title: {
    flexGrow: 1,
    fontSize: 14
  },
  wsConnectionAlertButton: {
    display: "inline-flex",
    marginRight: theme.spacing(0.5),
    color: theme.palette.tkv.semantic.warning,
    padding: theme.spacing(0.5)
  },
  wsConnectionAlertIcon: {
    fontSize: 20
  },
  wsConnectionBadge: {
    "& .MuiBadge-badge": {
      minWidth: 10,
      width: 10,
      height: 10,
      borderRadius: "50%",
      backgroundColor: "#ff4d4f",
      border: "none",
      boxShadow: "none"
    }
  },
  userMenuInfoContainer: {
    padding: theme.spacing(1.5, 2),
    maxWidth: 320
  },
  userMenuInfoLine: {
    fontSize: 13,
    lineHeight: 1.4
  },
  drawerPaper: {
    // o menu é um cartão sobre o fundo da aplicação, como na referência
    backgroundColor: theme.palette.tkv.canvas,
    borderRight: "none",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    overflowY: "clip",
    ...theme.scrollbarStylesSoft
  },
  // só no papel do menu: começa abaixo da barra superior (e da faixa de teste).
  // Fica fora de drawerPaper porque essa classe também vai na raiz do Drawer,
  // e o espaço era somado duas vezes.
  drawerPaperOffset: {
    paddingTop: `calc(var(--banner-h, 0px) + ${theme.spacing(1.25)}px)`
  },
  drawerPaperClose: {
    overflowX: "hidden",
    overflowY: "clip",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    width: drawerWidthCollapsed,
    [theme.breakpoints.up("sm")]: {
      width: drawerWidthCollapsed
    }
  },
  // Some sem desmontar: a barra continua viva (notificações, som, socket),
  // só não ocupa a tela enquanto a conversa está aberta.
  hiddenInConversation: {
    display: "none"
  },
  // conversa aberta no celular: a faixa da hora/bateria tem a cor do
  // cabeçalho da conversa, como no WhatsApp, e não a do fundo do app
  conversationRoot: {
    backgroundColor: theme.palette.tkv.surface
  },
  appBarSpacer: {
    minHeight: "var(--banner-h, 0px)",
    flex: "none"
  },
  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    // Coluna: o espaçador da barra de cima ocupa o dele e a página ocupa o
    // resto (flex: 1). Antes a página pedia height: 100% e isso somava aos
    // 56px do espaçador — a tela ficava maior que a janela e tudo descia.
    display: "flex",
    flexDirection: "column",
    overflow: "auto"
  },
  // celular com a barra de baixo: a tela vai até o fim e reserva o espaço
  // da cápsula, que flutua por cima sem faixa de fundo
  contentWithNav: {
    paddingBottom: "var(--mobile-nav-space, 0px)",
    backgroundColor: theme.palette.tkv.canvas
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4)
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column"
  },
  containerWithScroll: {
    flex: 1,
    minHeight: 0,
    padding: theme.spacing(0.5, 0),
    overflowY: "auto",
    overflowX: "hidden",
    ...theme.scrollbarStylesSoft
  },

  // ── menu lateral em cartão (referência enviada pelo David) ──
  sidebarCard: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    margin: theme.spacing(0, 1.25, 1.25),
    borderRadius: 16,
    border: `1px solid ${theme.palette.tkv.border}`,
    backgroundColor: theme.palette.tkv.surface,
    boxShadow: theme.shadows[1],
    overflow: "hidden"
  },
  sidebarCardCollapsed: {
    margin: theme.spacing(0, 1, 1.25)
  },
  sidebarTools: {
    flex: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    padding: theme.spacing(0.75, 1, 0),
    color: theme.palette.text.secondary,
    "& .MuiIconButton-root": { padding: 7, color: "inherit" },
    "& .MuiSvgIcon-root": { fontSize: 20 },
    "&:empty": { display: "none" }
  },
  sidebarToolsCollapsed: {
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: theme.spacing(0.75, 0, 0)
  },
  phoneFloatingTools: {
    position: "fixed",
    top: "calc(var(--safe-top, 0px) + var(--banner-h, 0px) + 6px)",
    right: 8,
    zIndex: theme.zIndex.drawer + 3,
    display: "flex",
    gap: 4,
    "&:empty": { display: "none" }
  },
  sidebarSearch: {
    flex: "none",
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 38,
    margin: theme.spacing(1.25, 1.25, 0.5),
    padding: "0 6px 0 10px",
    borderRadius: 10,
    border: `1px solid ${theme.palette.tkv.border}`,
    backgroundColor: theme.palette.tkv.surfaceSunken,
    color: theme.palette.text.secondary,
    cursor: "text",
    transition: "border-color .15s ease, box-shadow .15s ease",
    "&:focus-within": {
      borderColor: theme.palette.tkv.brand.main,
      boxShadow: `0 0 0 3px ${theme.palette.tkv.brand.focusRing}`
    }
  },
  sidebarSearchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: "0.875rem"
  },
  sidebarSearchCollapsed: {
    flex: "none",
    alignSelf: "center",
    margin: theme.spacing(1, 0, 0.5)
  },
  kbd: {
    flex: "none",
    padding: "2px 6px",
    borderRadius: 6,
    border: `1px solid ${theme.palette.tkv.border}`,
    backgroundColor: theme.palette.tkv.surface,
    color: theme.palette.text.secondary,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 11,
    lineHeight: 1.4,
    whiteSpace: "nowrap",
    // em tela de toque não existe teclado para o atalho
    "@media (pointer: coarse)": { display: "none" }
  },
  userArea: {
    flex: "none",
    padding: theme.spacing(0.75),
    borderTop: `1px solid ${theme.palette.tkv.border}`
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: theme.spacing(0.75, 1),
    borderRadius: 12,
    textAlign: "left",
    transition: "background-color .15s ease",
    "&:hover": { backgroundColor: theme.palette.tkv.surfaceHover }
  },
  userCardCollapsed: {
    justifyContent: "center",
    padding: theme.spacing(0.75, 0)
  },
  userAvatarWrap: {
    position: "relative",
    flex: "none",
    display: "flex"
  },
  userAvatar: {
    width: 36,
    height: 36,
    fontSize: "0.8125rem",
    fontWeight: 700,
    backgroundColor: theme.palette.tkv.brand.soft,
    color: theme.palette.tkv.brand.main
  },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: "50%",
    backgroundColor: theme.palette.tkv.semantic.success,
    border: `2px solid ${theme.palette.tkv.surface}`
  },
  userText: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column"
  },
  userName: {
    fontSize: "0.875rem",
    fontWeight: 700,
    lineHeight: 1.3,
    color: theme.palette.text.primary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  userMeta: {
    fontSize: "0.75rem",
    lineHeight: 1.3,
    color: theme.palette.text.secondary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  userChevron: {
    flex: "none",
    fontSize: 20,
    color: theme.palette.text.secondary
  },
  NotificationsPopOver: {
    // color: theme.barraSuperior.secondary.main,
  },
  logo: {
    maxWidth: "192px",
    // cabe na faixa de 56px acima do cartão do menu sem cortar o topo
    maxHeight: appBarHeight - 12,
    objectFit: "contain",
    logo: theme.logo,
    margin: "auto",
    content: `url("${theme.calculatedLogo()}")`
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    logo: theme.logo,
    margin: "auto",
    content: `url("${theme.appLogoFavicon ? theme.appLogoFavicon : "/vector/favicon.png"}")`
  },
  hideLogo: {
    display: "none"
  }
}));

const LoggedInLayout = ({ children, themeToggle }) => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // o mesmo menu de perfil abre da barra de cima (celular) ou do cartão do
  // usuário no rodapé do menu lateral (tablet e desktop)
  const [profileMenuFrom, setProfileMenuFrom] = useState("appbar");
  const [menuQuery, setMenuQuery] = useState("");
  const searchRef = React.useRef(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const isDesktop = window.matchMedia("(min-width:600px)").matches;

    if (!isDesktop) {
      return false;
    }

    return getStoredDrawerOpen();
  });
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  // const [dueDate, setDueDate] = useState("");
  const { user } = useContext(AuthContext);
  // cores da empresa (Configurações > Aparência), assim que há usuário logado
  useAccountTheme(!!user?.id);
  const trialStatus = getTrialStatus(user);

  const theme = useTheme();
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));
  // Três faixas de verdade, não duas:
  //   telefone  (<600px)  -> sem barra lateral, navegação por baixo
  //   tablet    (600-959) -> barra lateral só de ícones
  //   desktop   (>=960)   -> barra lateral completa, a pessoa escolhe
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  // Dentro de uma conversa (de atendimento ou do chat interno), o celular
  // mostra só a conversa, como no WhatsApp: sem a barra de cima e sem a
  // navegação de baixo. A saída é a seta de voltar no cabeçalho dela.
  const inConversation =
    isPhone && /^\/(tickets|chats)\/[^/]+/.test(location.pathname);
  const greaterThenMd = useMediaQuery(theme.breakpoints.up("md"));
  const { colorMode } = useContext(ColorModeContext);

  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});
  // o volume dos avisos continua salvo; só o controle saiu da barra de cima
  const [volume] = useState(localStorage.getItem("volume") || 1);
  const [soundOn, setSoundOn] = useNotificationSound();

  // push: confirma a inscrição deste aparelho para quem entrou e abre a
  // conversa quando a pessoa toca numa notificação com o app já aberto
  useEffect(() => {
    if (user?.id) syncPush({ silent: !isNotificationSoundOn() });
  }, [user?.id]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;
    const onMessage = event => {
      if (event.data?.type === "tkv:navigate" && event.data.url) {
        history.push(event.data.url);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [history]);

  const { dateToClient } = useDate();

  const socketManager = useContext(SocketContext);
  const [wsConnectionIssue, setWsConnectionIssue] = useState(false);

  const [newTicketContact, setNewTicketContact] = useState(null);

  //################### CODIGOS DE TESTE #########################################
  // useEffect(() => {
  //   navigator.getBattery().then((battery) => {
  //     console.log(`Battery Charging: ${battery.charging}`);
  //     console.log(`Battery Level: ${battery.level * 100}%`);
  //     console.log(`Charging Time: ${battery.chargingTime}`);
  //     console.log(`Discharging Time: ${battery.dischargingTime}`);
  //   })
  // }, []);

  // useEffect(() => {
  //   const geoLocation = navigator.geolocation

  //   geoLocation.getCurrentPosition((position) => {
  //     let lat = position.coords.latitude;
  //     let long = position.coords.longitude;

  //     console.log('latitude: ', lat)
  //     console.log('longitude: ', long)
  //   })
  // }, []);

  // useEffect(() => {
  //   const nucleos = window.navigator.hardwareConcurrency;

  //   console.log('Nucleos: ', nucleos)
  // }, []);

  // useEffect(() => {
  //   console.log('userAgent', navigator.userAgent)
  //   if (
  //     navigator.userAgent.match(/Android/i)
  //     || navigator.userAgent.match(/webOS/i)
  //     || navigator.userAgent.match(/iPhone/i)
  //     || navigator.userAgent.match(/iPad/i)
  //     || navigator.userAgent.match(/iPod/i)
  //     || navigator.userAgent.match(/BlackBerry/i)
  //     || navigator.userAgent.match(/Windows Phone/i)
  //   ) {
  //     console.log('é mobile ', true) //celular
  //   }
  //   else {
  //     console.log('não é mobile: ', false) //nao é celular
  //   }
  // }, []);
  //##############################################################################

  useEffect(() => {
    getCurrentUserInfo().then(user => {
      setCurrentUser(user);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentLang = localStorage.getItem("language");
    if (currentLang) {
      setCurrentLanguage(currentLang);
    }
  }, []);

  useEffect(() => {
    window.mentionClick = mention => {
      const contact = {
        id: mention.contactId || mention.id,
        name: mention.name,
        number: mention.number
      };
      setNewTicketContact(contact);
    };
  }, []);

  useEffect(() => {
    if (isPhone) {
      // No telefone a barra lateral nem é montada — quem navega é a
      // MobileNav lá embaixo.
      setDrawerOpen(false);
      return;
    }

    setDrawerVariant("permanent");
    // No tablet a barra fica recolhida: 264px de menu comem metade da tela.
    setDrawerOpen(greaterThenMd ? getStoredDrawerOpen() : false);
  }, [isPhone, greaterThenMd]);

  useEffect(() => {
    // Só o desktop guarda a preferência; no tablet o recolhido é imposto e
    // gravá-lo apagaria a escolha que a pessoa fez no computador.
    if (!greaterThenMd) {
      return;
    }

    persistDrawerOpenState(drawerOpen);
  }, [drawerOpen, greaterThenMd]);

  useEffect(() => {
    if (!socketManager?.subscribeWsConnectionIssue) {
      return undefined;
    }

    return socketManager.subscribeWsConnectionIssue(setWsConnectionIssue);
  }, [socketManager]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const userId = localStorage.getItem("userId");

    const socket = socketManager.GetSocket(companyId);

    const onCompanyAuthLayout = data => {
      const impersonated = localStorage.getItem("impersonated") === "true";
      if (
        !impersonated &&
        !data.user.impersonated &&
        data.user.id === +userId
      ) {
        toastError(
          data.action === "deactivated"
            ? i18n.t("usersPage.deactivatedByAdmin")
            : "Sua conta foi acessada em outro computador."
        );
        setTimeout(() => {
          localStorage.clear();
          window.location.reload();
        }, 1000);
      }
    };

    socket.on(`company-${companyId}-auth`, onCompanyAuthLayout);

    socket.emit("userStatus");
    const interval = setInterval(
      () => {
        socket.emit("userStatus");
      },
      1000 * 60 * 5
    );

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [socketManager]);

  const handleSidebarProfileMenu = event => {
    setProfileMenuFrom("sidebar");
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  // Ctrl+K (ou Cmd+K no Mac) abre o menu, se estiver recolhido, e foca a busca
  useEffect(() => {
    if (isPhone) return undefined;
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setDrawerOpen(true);
        setTimeout(() => searchRef.current?.focus(), 180);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPhone]);

  const handleCloseProfileMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleCloseLanguageMenu = () => {
    setAnchorEl(null);
    setLanguageOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseProfileMenu();
  };

  const handleOpenAboutModal = () => {
    setAboutModalOpen(true);
    handleCloseProfileMenu();
  };

  const handleClickLogout = () => {
    handleCloseProfileMenu();
    handleLogout();
  };

  const drawerClose = () => {
    if (document.body.offsetWidth < 600) {
      setDrawerOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(prevState => {
      const nextState = !prevState;
      if (greaterThenSm) {
        persistDrawerOpenState(nextState);
      }
      return nextState;
    });
  };

  const handleMenuItemClick = () => {
    const { innerWidth: width } = window;
    if (width <= 600) {
      setDrawerOpen(false);
    }
  };

  const toggleColorMode = () => {
    colorMode.toggleColorMode();
  };

  const handleChooseLanguage = language => {
    localStorage.setItem("language", language);
    window.location.reload(false);
  };

  const userCompanyId = Number(user?.companyId ?? user?.company?.id ?? 0);
  const shouldShowCompanyDueDate =
    user?.profile === "admin" && userCompanyId !== 1;
  const companyDueDateText = user?.company?.dueDate
    ? dateToClient(user.company.dueDate)
    : "-";

  // a animação de carregamento já é mostrada pela rota (routes/Route.js):
  // mostrar aqui também empilhava duas animações ao entrar no sistema
  if (loading) {
    return null;
  }

  // teste/assinatura vencida: bloqueia o sistema até pagar
  if (isCompanyExpired(user)) {
    return <Paywall user={user} />;
  }

  const showTrialBanner = !!trialStatus && !inConversation;

  return (
    <div
      className={clsx(
        classes.root,
        isPhone && inConversation && classes.conversationRoot
      )}
      style={{ "--banner-h": showTrialBanner ? "36px" : "0px" }}
    >
      {showTrialBanner && <TrialBanner user={user} status={trialStatus} />}
      {isPhone && !inConversation && (
        <div className={classes.statusBarFill} aria-hidden="true" />
      )}
      {!isPhone && (
        <>
          <Tooltip
            title={
              drawerOpen ? "Recolher menu lateral" : "Expandir menu lateral"
            }
            placement="right"
          >
            <IconButton
              aria-label={
                drawerOpen ? "Recolher menu lateral" : "Expandir menu lateral"
              }
              onClick={handleDrawerToggle}
              className={clsx(
                classes.drawerEdgeToggle,
                !drawerOpen && classes.drawerEdgeToggleClosed,
                inConversation && classes.hiddenInConversation
              )}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          <Drawer
            variant={drawerVariant}
            className={
              drawerOpen ? classes.drawerPaper : classes.drawerPaperClose
            }
            onClose={drawerClose}
            classes={{
              paper: clsx(
                classes.drawerPaper,
                classes.drawerPaperOffset,
                !drawerOpen && classes.drawerPaperClose
              )
            }}
            open={drawerOpen}
          >
            {/* Cartão do menu: busca, itens e, no rodapé, quem está logado. */}
            <div
              className={clsx(
                classes.sidebarCard,
                !drawerOpen && classes.sidebarCardCollapsed
              )}
            >
              {drawerOpen ? (
                <label className={classes.sidebarSearch}>
                  <SearchRoundedIcon fontSize="small" />
                  <InputBase
                    inputRef={searchRef}
                    value={menuQuery}
                    onChange={e => setMenuQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Escape") setMenuQuery("");
                    }}
                    placeholder={i18n.t("mainDrawer.listItems.search")}
                    className={classes.sidebarSearchInput}
                    inputProps={{
                      "aria-label": i18n.t("mainDrawer.listItems.search")
                    }}
                  />
                  {!menuQuery && <kbd className={classes.kbd}>Ctrl K</kbd>}
                </label>
              ) : (
                <Tooltip
                  title={`${i18n.t("mainDrawer.listItems.search")} (Ctrl K)`}
                  placement="right"
                >
                  <IconButton
                    className={classes.sidebarSearchCollapsed}
                    aria-label={i18n.t("mainDrawer.listItems.search")}
                    onClick={() => {
                      setDrawerOpen(true);
                      setTimeout(() => searchRef.current?.focus(), 180);
                    }}
                  >
                    <SearchRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* o que ficava na barra de cima agora mora no topo do menu */}
              <div
                className={clsx(
                  classes.sidebarTools,
                  !drawerOpen && classes.sidebarToolsCollapsed
                )}
              >
                {wsConnectionIssue && (
                  <Tooltip title={i18n.t("common.connection")} arrow>
                    <span
                      aria-label={i18n.t("common.connection")}
                      className={classes.wsConnectionAlertButton}
                    >
                      <Badge
                        variant="dot"
                        overlap="circular"
                        color="secondary"
                        anchorOrigin={{ vertical: "top", horizontal: "right" }}
                        className={classes.wsConnectionBadge}
                      >
                        <SettingsEthernetIcon
                          className={classes.wsConnectionAlertIcon}
                        />
                      </Badge>
                    </span>
                  </Tooltip>
                )}

                <PhoneCall />
              </div>

              <List className={classes.containerWithScroll}>
                <MainListItems
                  drawerClose={drawerClose}
                  drawerOpen={drawerOpen}
                  collapsed={!drawerOpen}
                  query={drawerOpen ? menuQuery : ""}
                />
              </List>

              <div className={classes.userArea}>
                <Tooltip
                  title={!drawerOpen ? user?.name || "" : ""}
                  placement="right"
                >
                  <ButtonBase
                    className={clsx(
                      classes.userCard,
                      !drawerOpen && classes.userCardCollapsed
                    )}
                    onClick={handleSidebarProfileMenu}
                    aria-haspopup="true"
                    aria-controls="menu-appbar"
                  >
                    <span className={classes.userAvatarWrap}>
                      <UserAvatar
                        user={user}
                        size={34}
                        className={classes.userAvatar}
                      />
                      <span className={classes.onlineDot} aria-hidden="true" />
                    </span>
                    {drawerOpen && (
                      <>
                        <span className={classes.userText}>
                          <span className={classes.userName}>
                            {user?.name || "-"}
                          </span>
                          <span className={classes.userMeta}>
                            {user?.profile === "admin"
                              ? i18n.t("userModal.listItems.adminProfile")
                              : i18n.t("userModal.listItems.userProfile")}
                            {" · "}
                            {i18n.t("mainDrawer.listItems.online")}
                          </span>
                        </span>
                        <UnfoldMoreRoundedIcon
                          className={classes.userChevron}
                        />
                      </>
                    )}
                  </ButtonBase>
                </Tooltip>
              </div>
            </div>
          </Drawer>
        </>
      )}
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
      <AboutModal
        open={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={
          profileMenuFrom === "sidebar"
            ? { vertical: "top", horizontal: "left" }
            : { vertical: "bottom", horizontal: "right" }
        }
        transformOrigin={
          profileMenuFrom === "sidebar"
            ? { vertical: "bottom", horizontal: "left" }
            : { vertical: "top", horizontal: "right" }
        }
        open={menuOpen}
        onClose={handleCloseProfileMenu}
      >
        <div className={classes.userMenuInfoContainer}>
          <Typography className={classes.userMenuInfoLine}>
            {i18n.t("common.name")}: {user?.name || "-"}
          </Typography>
          <Typography className={classes.userMenuInfoLine}>
            {i18n.t("common.company")}: {user?.company?.name || "-"}
          </Typography>
          {shouldShowCompanyDueDate && (
            <Typography className={classes.userMenuInfoLine}>
              {i18n.t("mainDrawer.appBar.user.subscriptionValidUntilLabel")}:{" "}
              {companyDueDateText}
            </Typography>
          )}
        </div>
        <Divider />
        <MenuItem onClick={handleOpenUserModal}>
          {i18n.t("mainDrawer.appBar.user.profile")}
        </MenuItem>
        <MenuItem onClick={() => setSoundOn(!soundOn)}>
          {i18n.t("notificationSound.title")}:{" "}
          {soundOn
            ? i18n.t("notificationSound.on")
            : i18n.t("notificationSound.off")}
        </MenuItem>
        <MenuItem onClick={toggleColorMode}>
          {theme.mode === "dark"
            ? i18n.t("mainDrawer.appBar.user.lightmode")
            : i18n.t("mainDrawer.appBar.user.darkmode")}
        </MenuItem>
        <NestedMenuItem
          label={i18n.t("mainDrawer.appBar.user.language")}
          parentMenuOpen={menuOpen}
        >
          {Object.keys(messages).map(m => (
            <MenuItem onClick={() => handleChooseLanguage(m)}>
              <div
                style={{
                  fontWeight: currentLanguage === m ? "bold" : "normal"
                }}
              >
                {messages[m].translations.mainDrawer.appBar.i18n.language}
              </div>
            </MenuItem>
          ))}
        </NestedMenuItem>
        <MenuItem onClick={handleOpenAboutModal}>
          {i18n.t("about.aboutthe")}{" "}
          {currentUser?.super ? "Tekvosoft" : theme.appName}
        </MenuItem>
        <MenuItem onClick={handleClickLogout}>
          {i18n.t("mainDrawer.appBar.user.logout")}
        </MenuItem>
      </Menu>
      {/* sem a barra de cima: no celular só o que precisa aparecer na hora */}
      {isPhone && (
        <div className={classes.phoneFloatingTools}>
          {wsConnectionIssue && (
            <Tooltip title={i18n.t("common.connection")} arrow>
              <span
                aria-label={i18n.t("common.connection")}
                className={classes.wsConnectionAlertButton}
              >
                <Badge
                  variant="dot"
                  overlap="circular"
                  color="secondary"
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  className={classes.wsConnectionBadge}
                >
                  <SettingsEthernetIcon
                    className={classes.wsConnectionAlertIcon}
                  />
                </Badge>
              </span>
            </Tooltip>
          )}

          <PhoneCall />
        </div>
      )}
      <NewTicketModal
        modalOpen={!!newTicketContact}
        contact={newTicketContact}
        onClose={ticket => {
          setNewTicketContact(null);
          if (ticket !== undefined && ticket.uuid !== undefined) {
            history.push(`/tickets/${ticket.uuid}`);
          }
        }}
      />
      {user.id && <NotificationsPopOver volume={volume} headless />}
      <ChatHead />
      {/* sem o balão no menu (o chat interno já está na lista), mas o som de
          mensagem nova do chat continua vindo dele */}
      <span style={{ display: "none" }} aria-hidden="true">
        <ChatPopover />
      </span>
      <main
        className={clsx(
          classes.content,
          isPhone && !inConversation && classes.contentWithNav
        )}
      >
        {!inConversation && <div className={classes.appBarSpacer} />}
        <OnlyForSuperUser user={currentUser} yes={() => <GoogleAnalytics />} />
        {children ? children : null}
      </main>
      {isPhone && !inConversation && (
        <MobileNav onOpenProfile={handleOpenUserModal} />
      )}
    </div>
  );
};

export default LoggedInLayout;
