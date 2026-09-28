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
  Tooltip,
  useTheme,
  useMediaQuery,
  ButtonBase,
  InputBase
} from "@material-ui/core";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";

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
import { planAllows } from "../helpers/planFeatures";
import TopProgress from "../components/TopProgress";
import UpdateAnnouncement from "../components/UpdateAnnouncement";

import { useDate } from "../hooks/useDate";
import useAuth from "../hooks/useAuth.js";

import ColorModeContext from "../layout/themeContext";
import NestedMenuItem from "material-ui-nested-menu-item";
import GoogleAnalytics from "../components/GoogleAnalytics";
import OnlyForSuperUser from "../components/OnlyForSuperUser";
import NewTicketModal from "../components/NewTicketModal/index.js";
import NewConversationModal from "../components/NewConversationModal";
import CreateOutlinedIcon from "@material-ui/icons/CreateOutlined";
import PullToRefresh from "../components/PullToRefresh";
import HapticsBridge from "../components/Haptics/HapticsBridge";
import CalendarReminders from "../components/CalendarReminders";

const drawerWidth = 264;
const appBarHeight = 56;

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    height: "var(--vh)",
    boxSizing: "border-box",
    // entalhe / barra de status: no PWA do iPhone o conteúdo não pode
    // começar embaixo da hora e da bateria
    paddingTop: "var(--safe-top, 0px)",
    // celular deitado: o recorte da câmera fica na lateral
    paddingLeft: "env(safe-area-inset-left, 0px)",
    paddingRight: "env(safe-area-inset-right, 0px)",
    backgroundColor: theme.palette.fancyBackground,
    // Antes havia aqui dois estilos globais herdados (borda verde-azulada
    // cravada em todo botão contornado e uma cor de aba inválida). Eles
    // passavam por cima do tema e deixavam "Novo" e "Cancelar" com cores
    // que não existem no resto do sistema. O tema já cuida dos dois.
    [theme.breakpoints.down("xs")]: {
      position: "relative",
      "--mobile-nav-space":
        "calc(76px + max(0px, var(--safe-bottom, 0px) - 6px))",
      // teclado aberto: o menu de baixo some, e o espaço dele junto
      "html.kb-open &": { "--mobile-nav-space": "0px" },
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
  // enquanto a tela sob demanda baixa: uma barrinha fina animada no topo
  pageLoading: {
    height: 3,
    width: "100%",
    background: `linear-gradient(90deg, transparent, ${theme.palette.tkv.brand.main}, transparent)`,
    backgroundSize: "40% 100%",
    backgroundRepeat: "no-repeat",
    animation: "$loadingBar 1s ease-in-out infinite"
  },
  "@keyframes loadingBar": {
    from: { backgroundPosition: "-40% 0" },
    to: { backgroundPosition: "140% 0" }
  },
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
  phoneFloatingTools: {
    position: "fixed",
    top: "calc(var(--safe-top, 0px) + var(--banner-h, 0px) + 6px)",
    right: 8,
    zIndex: theme.zIndex.drawer + 3,
    display: "flex",
    gap: 4,
    "&:empty": { display: "none" }
  },
  // busca e, ao lado, o lápis de nova conversa (como no Chatwoot)
  sidebarTop: {
    flex: "none",
    display: "flex",
    alignItems: "center",
    gap: 6,
    margin: theme.spacing(1.25, 1.25, 0.5),
    "& $sidebarSearch": { flex: 1, minWidth: 0, margin: 0 }
  },
  composeButton: {
    flex: "none",
    width: 38,
    height: 38,
    borderRadius: 10,
    border: `1px solid ${theme.palette.tkv.border}`,
    color: theme.palette.text.secondary,
    "&:hover": {
      color: theme.palette.tkv.brand.text,
      backgroundColor: theme.palette.tkv.brand.textSoft
    },
    "& svg": { fontSize: 19 }
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
    padding: theme.spacing(0.875, 1),
    borderRadius: 12,
    textAlign: "left",
    transition: "background-color .15s ease",
    "&:hover": { backgroundColor: theme.palette.tkv.surfaceHover },
    "&:active": { backgroundColor: theme.palette.tkv.brand.textSoft }
  },
  userCardActive: {
    backgroundColor: theme.palette.tkv.brand.textSoft,
    "&:hover": { backgroundColor: theme.palette.tkv.brand.textSoft },
    "& $userName": { color: theme.palette.tkv.brand.text }
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
    backgroundColor: theme.palette.tkv.surfaceSunken,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.tkv.border}`
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
    flexDirection: "column",
    gap: 1
  },
  userName: {
    fontSize: "0.875rem",
    fontWeight: 600,
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
  // puxar para atualizar (celular): muda a chave e a tela aberta recarrega
  const [refreshKey, setRefreshKey] = React.useState(0);
  const pullRefresh = () =>
    new Promise(resolve => {
      window.dispatchEvent(new CustomEvent("tkv:refresh"));
      setRefreshKey(key => key + 1);
      setTimeout(resolve, 400);
    });
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // o mesmo menu de perfil abre da barra de cima (celular) ou do cartão do
  // usuário no rodapé do menu lateral (tablet e desktop)
  const [profileMenuFrom] = useState("appbar");
  const [menuQuery, setMenuQuery] = useState("");
  const searchRef = React.useRef(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  // menu lateral fixo no computador: sempre aberto, sem recolher
  const [drawerOpen, setDrawerOpen] = useState(
    () => window.matchMedia("(min-width:600px)").matches
  );
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  // const [dueDate, setDueDate] = useState("");
  const { user } = useContext(AuthContext);
  // cores da empresa (Configurações > Aparência), assim que há usuário logado
  useAccountTheme(!!user?.id);
  const trialStatus = getTrialStatus(user);

  const theme = useTheme();
  // telefone (<600px): sem barra lateral, a navegação fica embaixo.
  // Do tablet para cima: menu lateral fixo e sempre aberto, em árvore.
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  // Dentro de uma conversa (de atendimento ou do chat interno), o celular
  // mostra só a conversa, como no WhatsApp: sem a barra de cima e sem a
  // navegação de baixo. A saída é a seta de voltar no cabeçalho dela.
  const inConversation =
    isPhone && /^\/(tickets|chats)\/[^/]+/.test(location.pathname);
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
  // o aviso de conexão agora é do NetworkStatus, na tela inteira

  const [newTicketContact, setNewTicketContact] = useState(null);
  // lápis do menu lateral: nova conversa (caixa de entrada + contato)
  const [composeOpen, setComposeOpen] = useState(false);

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
    setDrawerOpen(true);
  }, [isPhone]);

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

  // tocar no próprio nome (lá embaixo do menu) abre direto a página de perfil;
  // idioma, sobre e sair ficam dentro dela
  const handleSidebarProfileMenu = () => {
    setMenuOpen(false);
    history.push("/profile");
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
    handleCloseProfileMenu();
    history.push("/profile");
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
          <Drawer
            variant={drawerVariant}
            className={classes.drawerPaper}
            onClose={drawerClose}
            classes={{
              paper: clsx(classes.drawerPaper, classes.drawerPaperOffset)
            }}
            open={drawerOpen}
          >
            {/* Cartão do menu: busca, itens e, no rodapé, quem está logado. */}
            <div className={clsx(classes.sidebarCard)}>
              <div className={classes.sidebarTop}>
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
                <Tooltip
                  title={i18n.t("mainDrawer.tree.compose", "Nova conversa")}
                >
                  <IconButton
                    className={classes.composeButton}
                    aria-label={i18n.t(
                      "mainDrawer.tree.compose",
                      "Nova conversa"
                    )}
                    onClick={() => setComposeOpen(true)}
                  >
                    <CreateOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </div>

              {/* o que ficava na barra de cima agora mora no topo do menu */}
              <div className={clsx(classes.sidebarTools)}>
                <PhoneCall />
              </div>

              <List className={classes.containerWithScroll}>
                <MainListItems drawerClose={drawerClose} query={menuQuery} />
              </List>

              <div className={classes.userArea}>
                <Tooltip title="" placement="right">
                  <ButtonBase
                    className={clsx(
                      classes.userCard,
                      location.pathname === "/profile" && classes.userCardActive
                    )}
                    onClick={handleSidebarProfileMenu}
                  >
                    <span className={classes.userAvatarWrap}>
                      <UserAvatar
                        user={user}
                        size={36}
                        className={classes.userAvatar}
                      />
                      <span className={classes.onlineDot} aria-hidden="true" />
                    </span>
                    {drawerOpen && (
                      <span className={classes.userText}>
                        <span className={classes.userName}>
                          {user?.name || "-"}
                        </span>
                        <span className={classes.userMeta}>
                          {user?.statusText ||
                            (user?.profile === "admin"
                              ? i18n.t("userModal.listItems.adminProfile")
                              : i18n.t("userModal.listItems.userProfile"))}
                        </span>
                      </span>
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
          {currentUser?.super ? "vuup.me" : theme.appName}
        </MenuItem>
        <MenuItem onClick={handleClickLogout}>
          {i18n.t("mainDrawer.appBar.user.logout")}
        </MenuItem>
      </Menu>
      {/* sem a barra de cima: no celular só o que precisa aparecer na hora */}
      {isPhone && (
        <div className={classes.phoneFloatingTools}>
          <PhoneCall />
        </div>
      )}
      <NewConversationModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
      />
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
      {planAllows(user, "useInternalChat") && <ChatHead />}
      <TopProgress />
      <UpdateAnnouncement />
      {/* sem o balão no menu (o chat interno já está na lista), mas o som de
          mensagem nova do chat continua vindo dele */}
      {planAllows(user, "useInternalChat") && (
        <span style={{ display: "none" }} aria-hidden="true">
          <ChatPopover />
        </span>
      )}
      <main
        className={clsx(
          classes.content,
          isPhone && !inConversation && classes.contentWithNav
        )}
      >
        {!inConversation && <div className={classes.appBarSpacer} />}
        <OnlyForSuperUser user={currentUser} yes={() => <GoogleAnalytics />} />
        {/* a tela aberta carrega aqui dentro, sem derrubar o menu */}
        <React.Suspense fallback={<div className={classes.pageLoading} />}>
          {/* puxar para atualizar remonta a tela: ela busca tudo de novo */}
          <React.Fragment key={refreshKey}>
            {children ? children : null}
          </React.Fragment>
        </React.Suspense>
      </main>
      <HapticsBridge />
      <CalendarReminders />
      {isPhone && <PullToRefresh onRefresh={pullRefresh} />}
      {isPhone && !inConversation && (
        <MobileNav onOpenProfile={handleOpenUserModal} />
      )}
    </div>
  );
};

export default LoggedInLayout;
