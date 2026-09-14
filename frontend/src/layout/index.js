import React, { useState, useContext, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import clsx from "clsx";
import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import AccountCircle from "@material-ui/icons/AccountCircle";
import SettingsEthernetIcon from "@material-ui/icons/SettingsEthernet";
import CachedIcon from "@material-ui/icons/Cached";

import MainListItems from "./MainListItems";
import MobileNav from "./MobileNav";
import NotificationsPopOver from "../components/NotificationsPopOver";
import { Backendlogs } from "../components/Backendlogs";
import { PhoneCall } from "../components/PhoneCall";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import AboutModal from "../components/AboutModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import DarkMode from "../components/DarkMode";
import { i18n } from "../translate/i18n";
import { messages } from "../translate/languages";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";

import { SocketContext } from "../context/Socket/SocketContext";
import ChatPopover from "../pages/Chat/ChatPopover";

import { useDate } from "../hooks/useDate";
import useAuth from "../hooks/useAuth.js";

import ColorModeContext from "../layout/themeContext";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import LanguageIcon from "@material-ui/icons/Language";
import { getBackendURL } from "../services/config";
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
    backgroundColor: theme.palette.fancyBackground,
    // Antes havia aqui dois estilos globais herdados (borda verde-azulada
    // cravada em todo botão contornado e uma cor de aba inválida). Eles
    // passavam por cima do tema e deixavam "Novo" e "Cancelar" com cores
    // que não existem no resto do sistema. O tema já cuida dos dois.
    [theme.breakpoints.down("xs")]: {
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
    backgroundColor: theme.palette.tkv.surfaceSunken,
    border: `1px solid ${theme.palette.tkv.border}`,
    transition: "background-color .15s ease",
    "&:hover": { backgroundColor: theme.palette.tkv.surfaceHover },
    [theme.breakpoints.down("xs")]: {
      borderRadius: 20
    }
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
  userInfoPanel: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "flex",
      flex: 1,
      minWidth: 0,
      maxWidth: 120,
      flexDirection: "column",
      justifyContent: "center",
      height: 40,
      paddingLeft: 14,
      paddingRight: 8,
      borderRadius: "20px 0 0 20px",
      boxSizing: "border-box",
      overflow: "hidden"
    }
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
    [theme.breakpoints.down("xs")]: {
      paddingLeft: theme.spacing(1),
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
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    // no celular não existe barra lateral: a de cima ocupa tudo
    width: "100%",
    marginLeft: 0,
    [theme.breakpoints.up("sm")]: {
      marginLeft: drawerWidthCollapsed,
      width: `calc(100% - ${drawerWidthCollapsed}px)`
    }
  },
  appBarShift: {
    [theme.breakpoints.up("sm")]: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    }
  },
  menuButton: {
    marginRight: theme.spacing(1),
    color: "inherit"
  },
  appBarLogo: {
    height: 24,
    width: "auto",
    maxWidth: 104,
    objectFit: "contain",
    marginRight: theme.spacing(1),
    // a logo clara é feita para fundo escuro; no modo claro a barra é roxa,
    // então ela funciona nos dois casos
    display: "block"
  },
  menuButtonHidden: {
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
  appBarSpacer: {
    minHeight: appBarHeight,
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
    padding: theme.spacing(1),
    overflowY: "auto",
    overflowX: "hidden",
    ...theme.scrollbarStyles
  },
  NotificationsPopOver: {
    // color: theme.barraSuperior.secondary.main,
  },
  logo: {
    maxWidth: "192px",
    maxHeight: "72px",
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

  const theme = useTheme();
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
  const canAccessBackendlogs =
    currentUser?.super || localStorage.getItem("impersonated") === "true";

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);

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
        toastError("Sua conta foi acessada em outro computador.");
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

  const handleProfileMenu = event => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

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

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div className={classes.root}>
      {!isPhone && (
        <Drawer
          variant={drawerVariant}
          className={
            drawerOpen ? classes.drawerPaper : classes.drawerPaperClose
          }
          onClose={drawerClose}
          classes={{
            paper: clsx(
              classes.drawerPaper,
              !drawerOpen && classes.drawerPaperClose
            )
          }}
          open={drawerOpen}
        >
          <div
            className={classes.toolbarIcon}
            onClick={handleDrawerToggle}
            style={{ cursor: "pointer" }}
          >
            <img
              className={
                drawerOpen
                  ? classes.logo
                  : !isMobile
                    ? classes.logoIcon
                    : classes.hideLogo
              }
              alt="logo"
            />
          </div>
          <Divider />
          <List className={classes.containerWithScroll}>
            <MainListItems
              drawerClose={drawerClose}
              drawerOpen={drawerOpen}
              collapsed={!drawerOpen}
            />
          </List>
          <Divider />
        </Drawer>
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
      <AppBar
        position="absolute"
        className={clsx(
          classes.appBar,
          drawerOpen && classes.appBarShift,
          inConversation && classes.hiddenInConversation
        )}
        color="primary"
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          {isPhone ? (
            <img
              className={classes.appBarLogo}
              src={theme.calculatedLogo?.()}
              alt={theme.appName || "Tekvosoft"}
            />
          ) : (
            <IconButton
              edge="start"
              aria-label={
                drawerOpen ? "Recolher menu lateral" : "Expandir menu lateral"
              }
              onClick={handleDrawerToggle}
              className={classes.menuButton}
            >
              {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          )}

          <Typography
            component="h2"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          />

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

          {canAccessBackendlogs && <Backendlogs />}

          <PhoneCall />

          <NotificationsVolume setVolume={setVolume} volume={volume} />

          {user.id && <NotificationsPopOver volume={volume} />}

          <AnnouncementsPopover />

          <ChatPopover />

          <div className={classes.userInfoWrapper}>
            <div
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenu}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleProfileMenu(event);
                }
              }}
              role="button"
              tabIndex={0}
              className={classes.profileTrigger}
            >
              <div className={classes.userInfoPanel}>
                <Typography noWrap className={classes.userInfoName}>
                  {user?.name || currentUser?.name || "-"}
                </Typography>
                <Typography noWrap className={classes.userInfoCompany}>
                  {user?.company?.name || "-"}
                </Typography>
              </div>
              <div className={classes.profileAvatarSlot}>
                <AccountCircle
                  className={classes.avatar}
                  style={{ color: theme.palette.tkv.brand.main }}
                />
              </div>
            </div>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right"
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right"
              }}
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
                    {i18n.t(
                      "mainDrawer.appBar.user.subscriptionValidUntilLabel"
                    )}
                    : {companyDueDateText}
                  </Typography>
                )}
              </div>
              <Divider />
              <MenuItem onClick={handleOpenUserModal}>
                {i18n.t("mainDrawer.appBar.user.profile")}
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
          </div>
        </Toolbar>
      </AppBar>
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
      <main className={classes.content}>
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
