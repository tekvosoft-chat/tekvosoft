import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useHistory, useLocation } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";
import Divider from "@material-ui/core/Divider";

import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import DashboardIcon from "@material-ui/icons/Dashboard";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import ContactPhoneIcon from "@material-ui/icons/ContactPhone";
import ForumIcon from "@material-ui/icons/Forum";
import ForumOutlinedIcon from "@material-ui/icons/ForumOutlined";
import ViewWeekOutlinedIcon from "@material-ui/icons/ViewWeekOutlined";
import ViewWeekIcon from "@material-ui/icons/ViewWeek";
import EventIcon from "@material-ui/icons/Event";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ListIcon from "@material-ui/icons/ListAlt";
import PersonOutlineIcon from "@material-ui/icons/PersonOutline";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import VolumeUpRoundedIcon from "@material-ui/icons/VolumeUpRounded";
import VolumeOffRoundedIcon from "@material-ui/icons/VolumeOffRounded";
import Switch from "@material-ui/core/Switch";

import BottomSheet from "../components/ui/BottomSheet";
import { AuthContext } from "../context/Auth/AuthContext";
import ColorModeContext from "./themeContext";
import { i18n } from "../translate/i18n";
import useNotificationSound from "../hooks/useNotificationSound";
import {
  activatePush,
  pushState
} from "../components/NotificationSoundSetting";
import NotificationsActiveRoundedIcon from "@material-ui/icons/NotificationsActiveRounded";

/**
 * Navegação do celular.
 *
 * Substitui o menu lateral que deslizava para o lado. Três decisões:
 *
 * 1. As quatro telas que a pessoa realmente abre o dia todo ficam fixas na
 *    barra de baixo, ao alcance do polegar, com destino visível o tempo todo.
 *
 * 2. Todo o resto vai para o "Mais", que sobe como painel. Em vez de uma
 *    lista comprida, os itens viram uma grade de três colunas agrupada por
 *    seção: cabe muito mais coisa na primeira dobra e a busca visual é por
 *    ícone + rótulo, não por leitura linha a linha.
 *
 * 3. O que a barra mostra depende do perfil. O Dashboard é só de admin, então
 *    para o atendente comum o primeiro item é o Kanban — ninguém recebe um
 *    atalho que leva a uma tela vazia.
 */
const useStyles = makeStyles(theme => ({
  /**
   * A barra é um item do layout em coluna, não um elemento fixo.
   *
   * Com position: fixed e bottom: 0 ela se prendia ao fundo da janela de
   * layout do navegador — que no celular fica ATRÁS da barra de ferramentas
   * do Chrome/Safari. Dentro do fluxo ela senta no fim da área visível de
   * verdade (a altura vem do visualViewport, em --vh).
   *
   * O desenho é uma cápsula flutuante, como a barra de abas do iOS: solta das
   * bordas, com sombra, e a faixa da barra de gestos do iPhone logo abaixo.
   */
  barWrap: {
    position: "relative",
    flex: "none",
    zIndex: theme.zIndex.appBar + 2,
    padding: "6px 12px 0",
    // a cápsula termina acima da barrinha de gestos, sem sobrar vão demais
    paddingBottom: "max(8px, calc(var(--safe-bottom, 0px) - 6px))",
    backgroundColor: theme.palette.background.default
  },
  bar: {
    position: "relative",
    display: "flex",
    alignItems: "stretch",
    height: 62,
    padding: 5,
    borderRadius: theme.palette.tkv.radius.pill,
    backgroundColor:
      theme.mode === "dark"
        ? theme.palette.tkv.surfaceRaised
        : theme.palette.tkv.surface,
    boxShadow:
      theme.mode === "dark"
        ? `0 10px 28px rgba(0, 0, 0, 0.5), inset 0 0 0 1px ${theme.palette.tkv.border}`
        : `0 10px 28px rgba(26, 22, 38, 0.12), 0 2px 6px rgba(26, 22, 38, 0.06), inset 0 0 0 1px ${theme.palette.tkv.border}`
  },

  /**
   * Um só destaque para o item ativo, que DESLIZA até o próximo item tocado.
   * Ele tem a largura exata de um item e anda de item em item com
   * translateX(n × 100%); no caminho estica e volta ao tamanho, como uma gota
   * — o olho acompanha de onde saiu e para onde foi. O movimento é só de
   * transform, que o navegador anima fora da thread principal: não trava
   * enquanto a tela nova está sendo montada.
   */
  barIndicator: {
    position: "absolute",
    zIndex: 0,
    top: 5,
    bottom: 5,
    left: 5,
    borderRadius: theme.palette.tkv.radius.pill,
    backgroundColor: theme.palette.tkv.brand.textSoft,
    boxShadow: `inset 0 0 0 1px ${theme.palette.tkv.brand.textBorder}`,
    pointerEvents: "none",
    willChange: "transform",
    transition: "transform .42s cubic-bezier(.3, .7, .2, 1)"
  },
  action: {
    position: "relative",
    zIndex: 1,
    flex: "1 1 0",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: theme.palette.tkv.radius.pill,
    color: theme.palette.text.secondary,
    WebkitTapHighlightColor: "transparent",
    transition: "color .25s ease",
    "&:active $icon": { transform: "scale(0.88)" }
  },
  actionActive: {
    color: theme.palette.tkv.brand.text,
    "& $icon": { transform: "translateY(-1px) scale(1.08)" },
    "& $label": { fontWeight: 700 }
  },
  icon: {
    display: "flex",
    transition: "transform .38s cubic-bezier(.34, 1.56, .64, 1)",
    "& svg": { fontSize: 23 }
  },
  label: {
    maxWidth: "100%",
    padding: "0 2px",
    fontSize: "0.6875rem",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  // ── grade do painel "Mais" ──
  sectionLabel: {
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: theme.palette.text.secondary,
    padding: theme.spacing(1.5, 1, 1)
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing(0.5)
  },
  gridsWrap: { position: "relative" },
  // o quadrado da grade: sai do item atual e desliza até o item tocado
  tileSquare: {
    position: "absolute",
    zIndex: 0,
    left: 0,
    top: 0,
    borderRadius: theme.palette.tkv.radius.md,
    backgroundColor: theme.palette.tkv.brand.textSoft,
    boxShadow: `inset 0 0 0 1.5px ${theme.palette.tkv.brand.textBorder}`,
    pointerEvents: "none",
    transition:
      "transform .3s cubic-bezier(.2, .8, .2, 1), width .3s cubic-bezier(.2, .8, .2, 1), height .3s cubic-bezier(.2, .8, .2, 1), opacity .2s ease"
  },
  tile: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    padding: theme.spacing(1.5, 0.5),
    borderRadius: theme.palette.tkv.radius.md,
    width: "100%",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    transition: "transform .12s ease",
    "&:active": { transform: "scale(0.96)" }
  },
  tileActive: {
    "& $tileIcon": {
      backgroundColor: theme.palette.tkv.brand.main,
      color: theme.palette.tkv.brand.contrastText
    },
    "& $tileLabel": {
      color: theme.palette.tkv.brand.text,
      fontWeight: 700
    }
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.palette.tkv.radius.md,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.tkv.surfaceSunken,
    color: theme.palette.text.secondary,
    "& svg": { fontSize: 22 }
  },
  tileLabel: {
    fontSize: "0.6875rem",
    fontWeight: 500,
    lineHeight: 1.25,
    color: theme.palette.text.secondary
  },

  // ── ações de conta ──
  accountRow: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    paddingTop: theme.spacing(1)
  },
  accountItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    width: "100%",
    padding: theme.spacing(1.25, 1.5),
    borderRadius: theme.palette.tkv.radius.sm,
    justifyContent: "flex-start",
    fontSize: "0.875rem",
    color: theme.palette.text.primary,
    "&:hover": { backgroundColor: theme.palette.tkv.surfaceHover },
    "& svg": { fontSize: 20, color: theme.palette.text.secondary }
  },
  danger: {
    color: theme.palette.tkv.semantic.danger,
    "& svg": { color: theme.palette.tkv.semantic.danger }
  }
}));

const MobileNav = ({ onOpenProfile }) => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const { user, handleLogout } = useContext(AuthContext);
  const { colorMode } = useContext(ColorModeContext);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [soundOn, setSoundOn] = useNotificationSound();
  const [push, setPush] = useState(pushState);

  const isAdmin = user?.profile === "admin";
  const showCampaigns = !!localStorage.getItem("cshow");
  const isDark = localStorage.getItem("preferredTheme") === "dark";

  const t = key => i18n.t(`mainDrawer.listItems.${key}`);

  // ── itens fixos da barra ──
  const barItems = useMemo(() => {
    // ícone vazado parado, preenchido quando é a tela atual
    const tickets = {
      to: "/tickets",
      label: t("tickets"),
      // rótulo curto: "Atendimentos" não cabe inteiro num item da barra
      short: t("ticketsShort"),
      icon: <WhatsAppIcon />,
      activeIcon: <WhatsAppIcon />
    };
    const contacts = {
      to: "/contacts",
      label: t("contacts"),
      icon: <ContactPhoneOutlinedIcon />,
      activeIcon: <ContactPhoneIcon />
    };
    const chats = {
      to: "/chats",
      label: t("chats"),
      short: t("chatsShort"),
      icon: <ForumOutlinedIcon />,
      activeIcon: <ForumIcon />
    };

    if (isAdmin) {
      return [
        {
          to: "/",
          label: t("dashboard"),
          icon: <DashboardOutlinedIcon />,
          activeIcon: <DashboardIcon />
        },
        tickets,
        contacts,
        chats
      ];
    }
    return [
      tickets,
      {
        to: "/kanban",
        label: t("kanban"),
        icon: <ViewWeekOutlinedIcon />,
        activeIcon: <ViewWeekIcon />
      },
      contacts,
      chats
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // ── grade do painel ──
  const sections = useMemo(() => {
    const list = [
      {
        label: t("service"),
        items: [
          { to: "/tickets", label: t("tickets"), icon: <WhatsAppIcon /> },
          { to: "/kanban", label: t("kanban"), icon: <ViewWeekOutlinedIcon /> },
          {
            to: "/contacts",
            label: t("contacts"),
            icon: <ContactPhoneOutlinedIcon />
          },
          { to: "/schedules", label: t("schedules"), icon: <EventIcon /> },
          { to: "/tags", label: t("tags"), icon: <LocalOfferIcon /> },
          { to: "/chats", label: t("chats"), icon: <ForumIcon /> },
          { to: "/helps", label: t("helps"), icon: <HelpOutlineIcon /> }
        ]
      }
    ];

    if (isAdmin) {
      list.push({
        label: t("management"),
        items: [
          { to: "/", label: t("dashboard"), icon: <DashboardOutlinedIcon /> }
        ]
      });

      const admin = [];
      if (showCampaigns) {
        admin.push({
          to: "/campaigns",
          label: t("campaigns"),
          icon: <ListIcon />
        });
      }
      admin.push(
        {
          to: "/announcements",
          label: t("annoucements"),
          icon: <AnnouncementIcon />
        },
        { to: "/connections", label: t("connections"), icon: <SyncAltIcon /> },
        {
          to: "/queues",
          label: t("queues"),
          icon: <AccountTreeOutlinedIcon />
        },
        { to: "/users", label: t("users"), icon: <PeopleAltOutlinedIcon /> },
        {
          to: "/messages-api",
          label: t("messagesAPI"),
          icon: <CodeRoundedIcon />
        },
        { to: "/financeiro", label: t("financeiro"), icon: <LocalAtmIcon /> },
        {
          to: "/settings",
          label: t("settings"),
          icon: <SettingsOutlinedIcon />
        }
      );

      list.push({ label: t("administration"), items: admin });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showCampaigns]);

  const isActive = to =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  // Qual item da barra está aceso. -1 quando a tela atual mora no "Mais":
  // assim nenhum item fica destacado por engano.
  const currentIndex = barItems.findIndex(i => isActive(i.to));

  const go = to => {
    setSheetOpen(false);
    if (location.pathname !== to) {
      history.push(to);
    }
  };

  // Troca de tela só depois que o destaque começou a andar: montar a tela
  // nova ocupa o navegador por alguns quadros, e se a animação começasse
  // junto ela "pularia" direto para o fim. Dois quadros bastam.
  const frames = useRef([]);
  useEffect(() => () => frames.current.forEach(cancelAnimationFrame), []);
  const goAfterPaint = to => {
    const first = requestAnimationFrame(() => {
      frames.current.push(requestAnimationFrame(() => go(to)));
    });
    frames.current.push(first);
  };

  // ── pílula da barra: fica no item da tela atual; com o painel aberto (ou
  // quando a tela atual mora dentro do "Mais"), fica no "Mais" ──
  const slots = barItems.length + 1;
  const [pressed, setPressed] = useState(null);
  const barIndex =
    pressed !== null
      ? pressed
      : sheetOpen || currentIndex === -1
        ? barItems.length
        : currentIndex;
  useLayoutEffect(() => setPressed(null), [location.pathname, sheetOpen]);

  const indicatorRef = useRef(null);
  const lastIndex = useRef(barIndex);
  useLayoutEffect(() => {
    const el = indicatorRef.current;
    const from = lastIndex.current;
    lastIndex.current = barIndex;
    if (!el || from === barIndex || typeof el.animate !== "function") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    // a gota: sai do item de origem, estica no meio do caminho e assenta
    const distance = Math.min(Math.abs(barIndex - from), 3);
    el.animate(
      [
        { transform: `translateX(${from * 100}%) scaleX(1)` },
        {
          transform: `translateX(${(from + barIndex) * 50}%) scaleX(${
            1 + 0.22 * distance
          }) scaleY(0.92)`,
          offset: 0.45
        },
        { transform: `translateX(${barIndex * 100}%) scaleX(1)` }
      ],
      { duration: 380 + distance * 50, easing: "cubic-bezier(.3, .7, .2, 1)" }
    );
  }, [barIndex]);

  // ── quadrado da grade do "Mais" ──
  const tileRefs = useRef({});
  const [target, setTarget] = useState(null);
  const [square, setSquare] = useState(null);
  const activeTile =
    target ||
    sections
      .flatMap(sec => sec.items)
      .map(i => i.to)
      .find(to => isActive(to));

  const measure = useCallback(() => {
    const el = activeTile && tileRefs.current[activeTile];
    if (!el) {
      setSquare(null);
      return;
    }
    setSquare({
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight
    });
  }, [activeTile]);

  useLayoutEffect(() => {
    measure();
  }, [measure, sheetOpen]);

  useLayoutEffect(() => {
    if (!sheetOpen) setTarget(null);
  }, [sheetOpen]);

  const pickTile = to => {
    setTarget(to);
    // deixa o quadrado chegar antes de trocar de tela
    setTimeout(() => go(to), 230);
  };

  return (
    <>
      <div className={classes.barWrap}>
        <nav
          className={classes.bar}
          aria-label={i18n.t("mainDrawer.listItems.menu")}
        >
          <span
            ref={indicatorRef}
            className={classes.barIndicator}
            style={{
              width: `calc((100% - 10px) / ${slots})`,
              transform: `translateX(${barIndex * 100}%)`
            }}
            aria-hidden="true"
          />
          {barItems.map((item, index) => {
            const active = barIndex === index;
            return (
              <ButtonBase
                key={item.to}
                disableRipple
                className={`${classes.action}${active ? ` ${classes.actionActive}` : ""}`}
                aria-current={currentIndex === index ? "page" : undefined}
                aria-label={item.label}
                onClick={() => {
                  if (barIndex === index && location.pathname === item.to) {
                    return;
                  }
                  setPressed(index);
                  goAfterPaint(item.to);
                }}
              >
                <span className={classes.icon}>
                  {active ? item.activeIcon : item.icon}
                </span>
                <span className={classes.label}>
                  {item.short || item.label}
                </span>
              </ButtonBase>
            );
          })}
          <ButtonBase
            disableRipple
            className={`${classes.action}${barIndex === barItems.length ? ` ${classes.actionActive}` : ""}`}
            aria-label={t("more")}
            aria-expanded={sheetOpen}
            onClick={() => {
              setPressed(barItems.length);
              setSheetOpen(true);
            }}
          >
            <span className={classes.icon}>
              <MoreHorizIcon />
            </span>
            <span className={classes.label}>{t("more")}</span>
          </ButtonBase>
        </nav>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={i18n.t("mainDrawer.listItems.menu")}
        subtitle={user?.name}
      >
        <div className={classes.gridsWrap}>
          <span
            className={classes.tileSquare}
            aria-hidden="true"
            style={
              square
                ? {
                    transform: `translate(${square.x}px, ${square.y}px)`,
                    width: square.w,
                    height: square.h,
                    opacity: 1
                  }
                : { opacity: 0 }
            }
          />
          {sections.map(section => (
            <div key={section.label}>
              <Typography className={classes.sectionLabel} component="h3">
                {section.label}
              </Typography>
              <div className={classes.grid}>
                {section.items.map(item => (
                  <ButtonBase
                    key={item.to}
                    ref={el => {
                      tileRefs.current[item.to] = el;
                    }}
                    className={`${classes.tile}${activeTile === item.to ? ` ${classes.tileActive}` : ""}`}
                    onClick={() => pickTile(item.to)}
                    aria-current={isActive(item.to) ? "page" : undefined}
                  >
                    <span className={classes.tileIcon}>{item.icon}</span>
                    <span className={classes.tileLabel}>{item.label}</span>
                  </ButtonBase>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Divider style={{ marginTop: 16 }} />

        <div className={classes.accountRow}>
          <ButtonBase
            className={classes.accountItem}
            onClick={() => {
              setSheetOpen(false);
              onOpenProfile?.();
            }}
          >
            <PersonOutlineIcon />
            {i18n.t("mainDrawer.appBar.user.profile")}
          </ButtonBase>
          {push === "off" && (
            <ButtonBase
              className={classes.accountItem}
              onClick={() => activatePush(!soundOn, () => setPush(pushState()))}
            >
              <NotificationsActiveRoundedIcon />
              <span style={{ flex: 1, textAlign: "left" }}>
                {i18n.t("push.enableOnPhone")}
              </span>
            </ButtonBase>
          )}
          <ButtonBase
            className={classes.accountItem}
            onClick={() => setSoundOn(!soundOn)}
            role="switch"
            aria-checked={soundOn}
          >
            {soundOn ? <VolumeUpRoundedIcon /> : <VolumeOffRoundedIcon />}
            <span style={{ flex: 1, textAlign: "left" }}>
              {i18n.t("notificationSound.title")}
            </span>
            <Switch
              size="small"
              color="primary"
              checked={soundOn}
              tabIndex={-1}
              style={{ pointerEvents: "none" }}
            />
          </ButtonBase>
          <ButtonBase
            className={classes.accountItem}
            onClick={() => colorMode.toggleColorMode()}
          >
            {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
            {isDark
              ? i18n.t("mainDrawer.appBar.user.lightmode")
              : i18n.t("mainDrawer.appBar.user.darkmode")}
          </ButtonBase>
          <ButtonBase
            className={`${classes.accountItem} ${classes.danger}`}
            onClick={() => {
              setSheetOpen(false);
              handleLogout();
            }}
          >
            <ExitToAppIcon />
            {i18n.t("mainDrawer.appBar.user.logout")}
          </ButtonBase>
        </div>
      </BottomSheet>
    </>
  );
};

export default MobileNav;
