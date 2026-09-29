import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Badge } from "@material-ui/core";
import ButtonBase from "@material-ui/core/ButtonBase";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import ChatBubbleOutlineRoundedIcon from "@material-ui/icons/ChatBubbleOutlineRounded";
import InboxOutlinedIcon from "@material-ui/icons/InboxOutlined";
import ScheduleRoundedIcon from "@material-ui/icons/ScheduleRounded";
import CheckCircleOutlineRoundedIcon from "@material-ui/icons/CheckCircleOutlineRounded";
import GroupOutlinedIcon from "@material-ui/icons/GroupOutlined";
import MoveToInboxOutlinedIcon from "@material-ui/icons/MoveToInboxOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import LanguageRoundedIcon from "@material-ui/icons/LanguageRounded";
import InstagramIcon from "@material-ui/icons/Instagram";
import FacebookIcon from "@material-ui/icons/Facebook";
import ViewWeekOutlinedIcon from "@material-ui/icons/ViewWeekOutlined";
import ForumOutlinedIcon from "@material-ui/icons/ForumOutlined";
import EventOutlinedIcon from "@material-ui/icons/EventOutlined";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import LocalAtmOutlinedIcon from "@material-ui/icons/LocalAtmOutlined";
import TuneRoundedIcon from "@material-ui/icons/TuneRounded";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import DeveloperBoardRoundedIcon from "@material-ui/icons/DeveloperBoardRounded";
import ExpandMoreRoundedIcon from "@material-ui/icons/ExpandMoreRounded";
import { isArray } from "lodash";

import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { SocketContext } from "../context/Socket/SocketContext";
import api from "../services/api";
import toastError from "../errors/toastError";
import useSettings from "../hooks/useSettings";
import { loadJSON } from "../helpers/loadJSON";
import { planAllows } from "../helpers/planFeatures";
import useSupportUnread from "../hooks/useSupportUnread";
import { sameNav, setTicketsNav, useTicketsNav } from "../helpers/ticketsNav";

const gitinfo = loadJSON("/gitinfo.json");

/**
 * Menu lateral em árvore, enxuto como o do Chatwoot.
 *
 * Em cima ficam só as áreas (Conversas, Kanban, Chat interno…). Quem tem
 * filhos abre com a setinha, sem sair da página: Conversas mostra os atalhos
 * da lista (todas, não atendidas, resolvidas), as caixas de entrada e as
 * filas; Configurações junta o que é de administrador. Os filhos de
 * Conversas filtram a lista na hora e não fecham a conversa aberta.
 */
const OPEN_KEY = "tkv:navOpen";
const DEFAULT_OPEN = { conversations: true, channels: true, queues: true };

const readOpen = () => {
  try {
    return { ...DEFAULT_OPEN, ...JSON.parse(localStorage.getItem(OPEN_KEY)) };
  } catch {
    return { ...DEFAULT_OPEN };
  }
};

// compara sem acento e sem maiúscula: "configuracoes" acha "Configurações"
const normalize = text =>
  String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const t = (key, fallback) => i18n.t(`mainDrawer.tree.${key}`, fallback);

const CHANNEL_ICONS = {
  whatsapp: WhatsAppIcon,
  webchat: LanguageRoundedIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon
};

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    root: { display: "flex", flexDirection: "column", padding: "2px 8px" },
    list: { listStyle: "none", margin: 0, padding: 0 },
    // filhos: recuados, com a linha-guia à esquerda
    children: {
      listStyle: "none",
      margin: "1px 0 2px 17px",
      padding: "0 0 0 8px",
      borderLeft: `1px solid ${tkv.border}`
    },
    row: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      minHeight: 32,
      padding: "5px 8px",
      borderRadius: 8,
      // botão não herda a fonte da página; sem isto os itens que filtram
      // saíam na fonte do sistema e os links, em Inter
      fontFamily: "inherit",
      fontSize: "0.875rem",
      fontWeight: 500,
      lineHeight: 1.3,
      textAlign: "left",
      justifyContent: "flex-start",
      color: theme.palette.text.primary,
      textDecoration: "none",
      transition: "background-color .12s ease",
      "&:hover": { backgroundColor: tkv.surfaceHover },
      "&.Mui-focusVisible": { boxShadow: `0 0 0 2px ${tkv.brand.focusRing}` }
    },
    active: {
      color: tkv.brand.text,
      backgroundColor: tkv.brand.textSoft,
      fontWeight: 600,
      "&:hover": { backgroundColor: tkv.brand.textSoft },
      "& $icon": { color: tkv.brand.text }
    },
    // pai fechado com um filho ativo: só o texto marca onde a pessoa está
    parentActive: { fontWeight: 600 },
    icon: {
      flex: "none",
      display: "flex",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 18 }
    },
    label: {
      flex: "0 1 auto",
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    hint: {
      flex: "1 1 0",
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontWeight: 400,
      color: theme.palette.text.secondary
    },
    chevron: {
      flex: "none",
      marginLeft: "auto",
      fontSize: 18,
      color: theme.palette.text.secondary,
      transition: "transform .18s ease"
    },
    chevronClosed: { transform: "rotate(-90deg)" },
    dot: { flex: "none", width: 8, height: 8, margin: 5, borderRadius: "50%" },
    // caixa de entrada fora do ar
    offline: {
      flex: "none",
      width: 7,
      height: 7,
      marginLeft: "auto",
      borderRadius: "50%",
      backgroundColor: tkv.semantic.danger
    },
    empty: {
      padding: "6px 8px",
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    buildInfo: {
      padding: theme.spacing(1.5, 1),
      fontSize: "0.6875rem",
      fontWeight: 500,
      textAlign: "center",
      color: theme.palette.text.disabled
    }
  };
});

const chatsReducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = isArray(action.payload) ? action.payload : [];
    const merged = [...state];
    chats.forEach(chat => {
      const index = merged.findIndex(item => item.id === chat.id);
      if (index !== -1) merged[index] = chat;
      else merged.push(chat);
    });
    return merged;
  }
  if (action.type === "CHANGE_CHAT") {
    return state.map(chat =>
      chat.id === action.payload.chat.id ? action.payload.chat : chat
    );
  }
  return state;
};

// texto miúdo ao lado da caixa de entrada: o site do chat ou o status
const inboxHint = inbox => {
  const domain = inbox?.config?.domain;
  if (domain) return String(domain).replace(/^https?:\/\//, "");
  return "";
};

const MainListItems = ({ drawerClose, query = "" }) => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const { getSetting } = useSettings();
  const supportUnread = useSupportUnread();
  const nav = useTicketsNav();

  const [open, setOpen] = useState(readOpen);
  const [queues, setQueues] = useState([]);
  const [showGroups, setShowGroups] = useState(false);
  const [chats, dispatch] = useReducer(chatsReducer, []);

  const isAdmin = user?.profile === "admin";

  // admin vê todas as filas da empresa; atendente, só as dele
  useEffect(() => {
    if (!isAdmin) {
      setQueues(user?.queues || []);
      return;
    }
    api
      .get("/queue")
      .then(({ data }) => setQueues(Array.isArray(data) ? data : []))
      .catch(() => setQueues(user?.queues || []));
  }, [isAdmin, user]);

  useEffect(() => {
    Promise.all([getSetting("CheckMsgIsGroup"), getSetting("groupsTab")]).then(
      ([ignoreGroups, groupsTab]) =>
        setShowGroups(ignoreGroups === "disabled" && groupsTab === "enabled")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // bolinha do chat interno: conversas da equipe com mensagem não lida
  useEffect(() => {
    if (!planAllows(user, "useInternalChat")) return;
    api
      .get("/chats/", { params: { searchParam: "", pageNumber: 1 } })
      .then(({ data }) =>
        dispatch({ type: "LOAD_CHATS", payload: data.records })
      )
      .catch(toastError);
  }, [user]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);
    const onChat = data => {
      if (data.action === "new-message" || data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    };
    socket.on(`company-${companyId}-chat`, onChat);
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const internalUnread = chats.some(chat =>
    (chat.users || []).some(
      member => member.userId === user.id && member.unreads > 0
    )
  );

  const connectionWarning = (whatsApps || []).some(item =>
    ["qrcode", "PAIRING", "DISCONNECTED", "TIMEOUT", "OPENING"].includes(
      item.status
    )
  );

  const toggle = key =>
    setOpen(previous => {
      const next = { ...previous, [key]: !previous[key] };
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next));
      } catch {
        // sem armazenamento, só não lembra
      }
      return next;
    });

  // filtro da lista de conversas: a conversa aberta continua aberta
  const goTickets = target => {
    setTicketsNav(target);
    if (!location.pathname.startsWith("/tickets")) history.push("/tickets");
    if (drawerClose) drawerClose();
  };

  const onTickets = location.pathname.startsWith("/tickets");
  const isActive = item =>
    item.nav
      ? onTickets && sameNav(nav, item.nav)
      : item.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.to);

  const inboxes = whatsApps || [];

  const tree = [
    isAdmin && {
      key: "dashboard",
      icon: <DashboardOutlinedIcon />,
      label: i18n.t("mainDrawer.listItems.dashboard"),
      to: "/"
    },
    {
      key: "conversations",
      icon: <ChatBubbleOutlineRoundedIcon />,
      label: t("conversations", "Conversas"),
      children: [
        {
          key: "all",
          icon: <InboxOutlinedIcon />,
          label: t("all", "Todas as conversas"),
          nav: { view: "all", queue: null, inbox: null }
        },
        {
          key: "pending",
          icon: <ScheduleRoundedIcon />,
          label: t("pending", "Não atendidas"),
          nav: { view: "pending", queue: null, inbox: null }
        },
        {
          key: "closed",
          icon: <CheckCircleOutlineRoundedIcon />,
          label: t("closed", "Resolvidas"),
          nav: { view: "closed", queue: null, inbox: null }
        },
        showGroups && {
          key: "groups",
          icon: <GroupOutlinedIcon />,
          label: t("groups", "Grupos"),
          nav: { view: "groups", queue: null, inbox: null }
        },
        {
          key: "channels",
          icon: <MoveToInboxOutlinedIcon />,
          label: t("channels", "Canais"),
          empty: t("noChannels", "Nenhuma caixa de entrada"),
          children: inboxes.map(inbox => {
            const Icon =
              CHANNEL_ICONS[inbox.channel || "whatsapp"] || WhatsAppIcon;
            return {
              key: `inbox-${inbox.id}`,
              icon: <Icon />,
              label: inbox.name,
              hint: inboxHint(inbox),
              offline:
                (inbox.channel || "whatsapp") === "whatsapp" &&
                inbox.status !== "CONNECTED",
              nav: { view: "all", queue: null, inbox: inbox.id }
            };
          })
        },
        {
          key: "queues",
          icon: <AccountTreeOutlinedIcon />,
          label: t("queues", "Filas"),
          empty: t("noQueues", "Nenhuma fila"),
          children: queues.map(queue => ({
            key: `queue-${queue.id}`,
            dot: queue.color || "#7C7C7C",
            label: queue.name,
            nav: { view: "all", queue: queue.id, inbox: null }
          }))
        }
      ]
    },
    planAllows(user, "useKanban") && {
      key: "kanban",
      icon: <ViewWeekOutlinedIcon />,
      label: i18n.t("mainDrawer.listItems.kanban"),
      to: "/kanban"
    },
    planAllows(user, "useInternalChat") && {
      key: "chats",
      icon: (
        <Badge color="secondary" variant="dot" invisible={!internalUnread}>
          <ForumOutlinedIcon />
        </Badge>
      ),
      label: i18n.t("mainDrawer.listItems.chats"),
      to: "/chats"
    },
    planAllows(user, "useSchedules") && {
      key: "schedules",
      icon: <EventOutlinedIcon />,
      label: i18n.t("mainDrawer.listItems.schedules"),
      to: "/schedules"
    },
    isAdmin && {
      key: "settings",
      icon: (
        <Badge color="error" variant="dot" invisible={!connectionWarning}>
          <SettingsOutlinedIcon />
        </Badge>
      ),
      label: t("settings", "Configurações"),
      children: [
        {
          key: "connections",
          icon: (
            <Badge color="error" variant="dot" invisible={!connectionWarning}>
              <SyncAltIcon />
            </Badge>
          ),
          label: i18n.t("mainDrawer.listItems.connections"),
          to: "/connections"
        },
        {
          key: "queuesPage",
          icon: <AccountTreeOutlinedIcon />,
          label: i18n.t("mainDrawer.listItems.queues"),
          to: "/queues"
        },
        {
          key: "users",
          icon: <PeopleAltOutlinedIcon />,
          label: i18n.t("mainDrawer.listItems.users"),
          to: "/users"
        },
        planAllows(user, "useExternalApi") && {
          key: "api",
          icon: <CodeRoundedIcon />,
          label: i18n.t("mainDrawer.listItems.messagesAPI"),
          to: "/messages-api"
        },
        {
          key: "financeiro",
          icon: <LocalAtmOutlinedIcon />,
          label: i18n.t("mainDrawer.listItems.financeiro"),
          to: "/financeiro"
        },
        {
          key: "general",
          icon: <TuneRoundedIcon />,
          label: t("general", "Geral"),
          to: "/settings"
        }
      ]
    },
    // pipeline de IA: só o dono da instalação
    user?.super && {
      key: "devPipeline",
      icon: <DeveloperBoardRoundedIcon />,
      label: t("devPipeline", "Pipeline de IA"),
      to: "/dev-pipeline"
    },
    {
      key: "helps",
      icon: (
        <Badge badgeContent={supportUnread} color="primary" max={99}>
          <HelpOutlineIcon />
        </Badge>
      ),
      label: i18n.t("mainDrawer.listItems.helps"),
      to: "/helps"
    }
  ];

  const searching = !!query.trim();
  const term = normalize(query);

  // busca: fica quem bate e os pais de quem bate (abertos)
  const filterTree = items =>
    items
      .filter(Boolean)
      .map(item => {
        if (item.children) {
          const children = filterTree(item.children);
          if (!searching) return { ...item, children };
          if (normalize(item.label).includes(term)) return item;
          return children.length ? { ...item, children } : null;
        }
        return !searching || normalize(item.label).includes(term) ? item : null;
      })
      .filter(Boolean);

  const hasActive = item =>
    item.children ? item.children.some(hasActive) : isActive(item);

  const renderItem = item => {
    if (item.children) {
      const expanded = searching || !!open[item.key];
      return (
        <li key={item.key}>
          <ButtonBase
            className={clsx(classes.row, {
              [classes.parentActive]: !expanded && hasActive(item)
            })}
            onClick={() => toggle(item.key)}
            aria-expanded={expanded}
          >
            {item.icon && <span className={classes.icon}>{item.icon}</span>}
            <span className={classes.label}>{item.label}</span>
            <ExpandMoreRoundedIcon
              className={clsx(classes.chevron, {
                [classes.chevronClosed]: !expanded
              })}
            />
          </ButtonBase>
          {expanded && (
            <ul className={classes.children}>
              {item.children.length ? (
                item.children.map(renderItem)
              ) : (
                <li className={classes.empty}>{item.empty}</li>
              )}
            </ul>
          )}
        </li>
      );
    }

    const active = isActive(item);
    const content = (
      <>
        {item.dot ? (
          <span className={classes.dot} style={{ backgroundColor: item.dot }} />
        ) : (
          item.icon && <span className={classes.icon}>{item.icon}</span>
        )}
        <span className={classes.label}>{item.label}</span>
        {item.hint && <span className={classes.hint}>· {item.hint}</span>}
        {item.offline && (
          <span
            className={classes.offline}
            title={t("offline", "Desconectada")}
          />
        )}
      </>
    );

    return (
      <li key={item.key}>
        {item.nav ? (
          <ButtonBase
            className={clsx(classes.row, { [classes.active]: active })}
            aria-current={active ? "page" : undefined}
            onClick={() => goTickets(item.nav)}
          >
            {content}
          </ButtonBase>
        ) : (
          <ButtonBase
            component={RouterLink}
            to={item.to}
            className={clsx(classes.row, { [classes.active]: active })}
            aria-current={active ? "page" : undefined}
            onClick={drawerClose}
          >
            {content}
          </ButtonBase>
        )}
      </li>
    );
  };

  return (
    <div className={classes.root}>
      <ul className={classes.list}>{filterTree(tree).map(renderItem)}</ul>
      {!searching && isAdmin && (
        <Typography className={classes.buildInfo}>
          {`${gitinfo.tagName || gitinfo.branchName + " " + gitinfo.commitHash}`}
          &nbsp;/&nbsp;
          {`${gitinfo.buildTimestamp}`}
        </Typography>
      )}
    </div>
  );
};

export default MainListItems;
