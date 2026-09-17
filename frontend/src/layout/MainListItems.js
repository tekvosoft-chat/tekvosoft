import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";
import clsx from "clsx";
import Tooltip from "@material-ui/core/Tooltip";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import EventIcon from "@material-ui/icons/Event";

import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import { i18n } from "../translate/i18n";
import ViewWeekOutlinedIcon from "@material-ui/icons/ViewWeekOutlined";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { loadJSON } from "../helpers/loadJSON";
import { planAllows } from "../helpers/planFeatures";

const gitinfo = loadJSON("/gitinfo.json");

const useStyles = makeStyles(theme => ({
  subheader: {
    padding: theme.spacing(2, 2.5, 0.5),
    lineHeight: "24px"
  },

  // ── item de navegação ──
  item: {
    borderRadius: theme.palette.tkv.radius.sm,
    margin: theme.spacing(0.25, 1.5),
    width: "auto",
    padding: theme.spacing(0.875, 1.25),
    color: theme.palette.text.secondary,
    transition: "background-color .13s ease, color .13s ease",
    "&:hover": {
      backgroundColor: theme.palette.tkv.surfaceHover,
      color: theme.palette.text.primary
    }
  },
  itemActive: {
    backgroundColor: theme.palette.tkv.brand.soft,
    color: theme.palette.tkv.brand.main,
    fontWeight: 600,
    "&:hover": {
      backgroundColor: theme.palette.tkv.brand.softHover,
      color: theme.palette.tkv.brand.main
    },
    "& $itemIcon": { color: theme.palette.tkv.brand.main },
    "& .MuiListItemText-primary": { fontWeight: 600 }
  },
  itemCollapsed: {
    justifyContent: "center",
    margin: theme.spacing(0.25, 1),
    padding: theme.spacing(1.125, 0)
  },
  itemIcon: {
    minWidth: 34,
    color: "inherit",
    "& svg": { fontSize: 21 }
  },
  itemIconCollapsed: {
    minWidth: 0
  },
  itemText: {
    margin: 0,
    "& .MuiListItemText-primary": {
      fontSize: "0.875rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  },
  menuRoot: {
    display: "flex",
    flexDirection: "column"
  },
  menuDivider: {
    margin: theme.spacing(1, 1.5)
  },
  sectionLabel: {
    padding: theme.spacing(1.75, 2.25, 0.5),
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: theme.palette.text.disabled,
    whiteSpace: "nowrap"
  },
  moreToggle: {
    color: theme.palette.text.secondary,
    "& .MuiListItemText-primary": { fontWeight: 500 }
  },
  subItem: {
    marginLeft: theme.spacing(3),
    "& $itemIcon svg": { fontSize: 19 }
  },
  buildInfo: {
    fontSize: "0.6875rem",
    padding: theme.spacing(1.5, 2.5),
    textAlign: "center",
    color: theme.palette.text.disabled,
    fontWeight: 500
  }
}));

/**
 * Estado recolhido da barra lateral.
 *
 * Vai por contexto e não por prop porque são dezoito chamadas de
 * ListItemLink espalhadas pelo arquivo — passar prop em todas seria ruído
 * sem benefício.
 */
const SidebarContext = React.createContext({ collapsed: false, query: "" });

// compara sem acento e sem maiúscula: "configuracoes" acha "Configurações"
const normalize = text =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Item de navegação.
 *
 * Duas correções de usabilidade aqui:
 *
 * 1. Estado ativo. Antes nada indicava em que página a pessoa estava — o menu
 *    tinha dezoito itens idênticos. Agora o item da rota atual fica com fundo
 *    e texto na cor da marca.
 *
 * 2. Recolhido. Antes o rótulo continuava sendo renderizado e era cortado no
 *    meio pela largura de 72px, virando "A", "T", "R". Agora o texto some e o
 *    nome aparece em tooltip ao passar o mouse.
 */
function ListItemLink(props) {
  const { icon, primary, to, className } = props;
  const classes = useStyles();
  const location = useLocation();
  const { collapsed, query } = useContext(SidebarContext);

  const active =
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  const item = (
    <ListItem
      button
      dense
      component={renderLink}
      aria-current={active ? "page" : undefined}
      className={clsx(
        classes.item,
        active && classes.itemActive,
        collapsed && classes.itemCollapsed,
        className
      )}
    >
      {icon ? (
        <ListItemIcon
          className={clsx(
            classes.itemIcon,
            collapsed && classes.itemIconCollapsed
          )}
        >
          {icon}
        </ListItemIcon>
      ) : null}
      {!collapsed && (
        <ListItemText primary={primary} className={classes.itemText} />
      )}
    </ListItem>
  );

  // busca do menu: item que não bate some
  if (query && !normalize(primary).includes(normalize(query))) {
    return null;
  }

  return (
    <li>
      {collapsed ? (
        <Tooltip title={primary} placement="right">
          {item}
        </Tooltip>
      ) : (
        item
      )}
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach(chat => {
        const chatIndex = state.findIndex(u => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex(u => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex(u => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map(chat => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = props => {
  const classes = useStyles();
  const { drawerClose, drawerOpen, collapsed = !drawerOpen } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);

  const [showCampaigns, setShowCampaigns] = useState(false);
  const history = useHistory();
  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onCompanyChatMainListItems = data => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    };

    socket.on(`company-${companyId}-chat`, onCompanyChatMainListItems);
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter(whats => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber }
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const query = props.query || "";
  const searching = !!query.trim();

  const campaignsBlock = showCampaigns && planAllows(user, "useCampaigns") && (
    <>
      {/* Recolhida, a barra é estreita demais para o submenu: nesse estado o
          item vira atalho direto para a listagem, com o nome em tooltip. */}
      {(!searching ||
        normalize(i18n.t("mainDrawer.listItems.campaigns")).includes(
          normalize(query)
        )) && (
        <Tooltip
          title={collapsed ? i18n.t("mainDrawer.listItems.campaigns") : ""}
          placement="right"
        >
          <ListItem
            button
            dense
            className={clsx(classes.item, collapsed && classes.itemCollapsed)}
            onClick={() =>
              collapsed
                ? history.push("/campaigns")
                : setOpenCampaignSubmenu(prev => !prev)
            }
          >
            <ListItemIcon
              className={clsx(
                classes.itemIcon,
                collapsed && classes.itemIconCollapsed
              )}
            >
              <EventAvailableIcon />
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText
                  primary={i18n.t("mainDrawer.listItems.campaigns")}
                  className={classes.itemText}
                />
                {openCampaignSubmenu ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </>
            )}
          </ListItem>
        </Tooltip>
      )}
      <Collapse
        in={(openCampaignSubmenu || searching) && !collapsed}
        timeout="auto"
        unmountOnExit
      >
        <List component="div" disablePadding>
          <ListItemLink
            to="/campaigns"
            primary="Listagem"
            icon={<ListIcon />}
            className={classes.subItem}
          />
          <ListItemLink
            to="/contact-lists"
            primary="Listas de Contatos"
            icon={<PeopleIcon />}
            className={classes.subItem}
          />
          <ListItemLink
            to="/campaigns-config"
            primary="Configurações"
            icon={<SettingsOutlinedIcon />}
            className={classes.subItem}
          />
        </List>
      </Collapse>
    </>
  );

  /**
   * Organização do menu, pelo que a pessoa vai fazer:
   *
   *   (topo)         Dashboard — a visão geral abre o dia do gestor
   *   ATENDIMENTO    Atendimentos, Kanban, Chat Interno, Agendamentos
   *   CONTATOS       Contatos, Tags, Campanhas
   *   GESTÃO         Conexões, Filas & Chatbot, Usuários, Informativos
   *   SISTEMA        API, Financeiro, Configurações, Ajuda
   *
   * Antes Agendamentos ficava junto de Tags, o Dashboard no meio das
   * configurações e metade do menu escondida em "Mais". Os títulos somem
   * com o menu recolhido (vira uma linha) e durante a busca. As permissões
   * são as mesmas: o que era só de admin continua só de admin.
   */
  const Section = ({ label }) =>
    searching ? null : collapsed ? (
      <Divider className={classes.menuDivider} />
    ) : (
      <Typography component="div" className={classes.sectionLabel}>
        {label}
      </Typography>
    );

  return (
    <SidebarContext.Provider value={{ collapsed, query }}>
      <div onClick={drawerClose} className={classes.menuRoot}>
        <Can
          role={user.profile}
          perform="drawer-admin-items:view"
          yes={() => (
            <ListItemLink
              to="/"
              primary={i18n.t("mainDrawer.listItems.dashboard")}
              icon={<DashboardOutlinedIcon />}
            />
          )}
        />

        <Section label={i18n.t("mainDrawer.sections.service")} />
        <ListItemLink
          to="/tickets"
          primary={i18n.t("mainDrawer.listItems.tickets")}
          icon={<WhatsAppIcon />}
        />
        {planAllows(user, "useKanban") && (
          <ListItemLink
            to="/kanban"
            primary={i18n.t("mainDrawer.listItems.kanban")}
            icon={<ViewWeekOutlinedIcon />}
          />
        )}
        {planAllows(user, "useInternalChat") && (
          <ListItemLink
            to="/chats"
            primary={i18n.t("mainDrawer.listItems.chats")}
            icon={
              <Badge color="secondary" variant="dot" invisible={invisible}>
                <ForumIcon />
              </Badge>
            }
          />
        )}
        {planAllows(user, "useSchedules") && (
          <ListItemLink
            to="/schedules"
            primary={i18n.t("mainDrawer.listItems.schedules")}
            icon={<EventIcon />}
          />
        )}

        {/* contatos agora ficam na tela de conversas (busca e "+") */}
        <Can
          role={user.profile}
          perform="drawer-admin-items:view"
          yes={() =>
            campaignsBlock ? (
              <>
                <Section label={i18n.t("mainDrawer.sections.audience")} />
                {campaignsBlock}
              </>
            ) : null
          }
        />

        <Can
          role={user.profile}
          perform="drawer-admin-items:view"
          yes={() => (
            <>
              <Section label={i18n.t("mainDrawer.sections.management")} />
              <ListItemLink
                to="/connections"
                primary={i18n.t("mainDrawer.listItems.connections")}
                icon={
                  <Badge
                    badgeContent={connectionWarning ? "!" : 0}
                    color="error"
                  >
                    <SyncAltIcon />
                  </Badge>
                }
              />
              <ListItemLink
                to="/queues"
                primary={i18n.t("mainDrawer.listItems.queues")}
                icon={<AccountTreeOutlinedIcon />}
              />
              <ListItemLink
                to="/users"
                primary={i18n.t("mainDrawer.listItems.users")}
                icon={<PeopleAltOutlinedIcon />}
              />

              <Section label={i18n.t("mainDrawer.sections.system")} />
              {planAllows(user, "useExternalApi") && (
                <ListItemLink
                  to="/messages-api"
                  primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                  icon={<CodeRoundedIcon />}
                />
              )}
              <ListItemLink
                to="/financeiro"
                primary={i18n.t("mainDrawer.listItems.financeiro")}
                icon={<LocalAtmIcon />}
              />
              <ListItemLink
                to="/settings"
                primary={i18n.t("mainDrawer.listItems.settings")}
                icon={<SettingsOutlinedIcon />}
              />
            </>
          )}
        />
        <ListItemLink
          to="/helps"
          primary={i18n.t("mainDrawer.listItems.helps")}
          icon={<HelpOutlineIcon />}
        />
        {drawerOpen && !searching && user.profile === "admin" && (
          <Typography className={classes.buildInfo}>
            {`${gitinfo.tagName || gitinfo.branchName + " " + gitinfo.commitHash}`}
            &nbsp;/&nbsp;
            {`${gitinfo.buildTimestamp}`}
          </Typography>
        )}
      </div>
    </SidebarContext.Provider>
  );
};

export default MainListItems;
