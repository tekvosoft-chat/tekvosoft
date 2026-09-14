import React, { useContext, useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import BottomNavigation from "@material-ui/core/BottomNavigation";
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction";
import Typography from "@material-ui/core/Typography";
import ButtonBase from "@material-ui/core/ButtonBase";
import Divider from "@material-ui/core/Divider";

import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import ForumIcon from "@material-ui/icons/Forum";
import ViewWeekOutlinedIcon from "@material-ui/icons/ViewWeekOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
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

import BottomSheet from "../components/ui/BottomSheet";
import { AuthContext } from "../context/Auth/AuthContext";
import ColorModeContext from "./themeContext";
import { i18n } from "../translate/i18n";

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
   * A barra agora é um item do layout em coluna, não um elemento fixo.
   *
   * Com position: fixed e bottom: 0 ela se prendia ao fundo da janela de
   * layout do navegador — que no celular fica ATRÁS da barra de ferramentas
   * do Chrome/Safari. Resultado: a navegação aparecia baixa demais, meio
   * escondida, e ainda cobria a última linha de cada tela. Dentro do fluxo
   * ela senta no fim da área visível de verdade (a altura vem do
   * visualViewport, em --vh) e o conteúdo termina exatamente acima dela.
   */
  bar: {
    flex: "none",
    position: "relative",
    zIndex: theme.zIndex.appBar + 2,
    display: "flex",
    alignItems: "stretch",
    height: "auto",
    // 56px de toque + a faixa da barra de gestos do iPhone logo abaixo, como
    // a barra de abas dos apps nativos do iOS (49 + 34). A faixa de gestos
    // vem de --safe-bottom, que o index.html liga com viewport-fit=cover.
    minHeight: "calc(56px + var(--safe-bottom, 0px))",
    padding: "2px 4px 0",
    paddingBottom: "calc(2px + var(--safe-bottom, 0px))",
    borderTop: `1px solid ${theme.palette.tkv.border}`,
    backgroundColor: theme.palette.tkv.surface
  },

  /**
   * O Material-UI v4 dá a cada item min-width de 80px. Cinco itens pedem
   * 400px e um celular comum tem 360: o último item estourava a tela e os
   * rótulos quebravam em duas linhas. Aqui cada item divide a largura por
   * igual e o rótulo nunca quebra.
   */
  action: {
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "none",
    padding: "5px 0 3px",
    height: 52,
    color: theme.palette.text.secondary,
    "& .MuiBottomNavigationAction-wrapper": { gap: 2 },
    "& .MuiBottomNavigationAction-label": {
      fontSize: "0.65625rem",
      fontWeight: 500,
      letterSpacing: "-0.01em",
      lineHeight: 1.25,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%",
      opacity: 1,
      transition: "none"
    },
    "&.Mui-selected": {
      color: theme.palette.tkv.brand.main,
      "& .MuiBottomNavigationAction-label": {
        fontSize: "0.65625rem",
        fontWeight: 700
      },
      "& $iconPill": { backgroundColor: theme.palette.tkv.brand.soft }
    }
  },
  // "pílula" atrás do ícone ativo: indica onde a pessoa está sem depender
  // só da cor do texto, que é pequeno
  iconPill: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 28,
    borderRadius: theme.palette.tkv.radius.pill,
    transition: "background-color .15s ease",
    "& svg": { fontSize: 22 }
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
    "&:hover": { backgroundColor: theme.palette.tkv.surfaceHover }
  },
  tileActive: {
    backgroundColor: theme.palette.tkv.brand.soft,
    "& $tileIcon": {
      backgroundColor: theme.palette.tkv.brand.main,
      color: theme.palette.tkv.brand.contrastText
    },
    "& $tileLabel": {
      color: theme.palette.tkv.brand.main,
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

  const isAdmin = user?.profile === "admin";
  const showCampaigns = !!localStorage.getItem("cshow");
  const isDark = localStorage.getItem("preferredTheme") === "dark";

  const t = key => i18n.t(`mainDrawer.listItems.${key}`);

  // ── itens fixos da barra ──
  const barItems = useMemo(() => {
    const tickets = {
      to: "/tickets",
      label: t("tickets"),
      icon: <WhatsAppIcon />
    };
    const contacts = {
      to: "/contacts",
      label: t("contacts"),
      icon: <ContactPhoneOutlinedIcon />
    };
    const chats = {
      to: "/chats",
      label: t("chats"),
      short: t("chatsShort"),
      icon: <ForumIcon />
    };

    if (isAdmin) {
      return [
        { to: "/", label: t("dashboard"), icon: <DashboardOutlinedIcon /> },
        tickets,
        contacts,
        chats
      ];
    }
    return [
      tickets,
      { to: "/kanban", label: t("kanban"), icon: <ViewWeekOutlinedIcon /> },
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
            to: "/quick-messages",
            label: t("quickMessages"),
            icon: <FlashOnIcon />
          },
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

  return (
    <>
      <BottomNavigation
        value={currentIndex}
        showLabels
        className={classes.bar}
        component="nav"
        aria-label={i18n.t("mainDrawer.listItems.menu")}
      >
        {barItems.map((item, index) => (
          <BottomNavigationAction
            key={item.to}
            value={index}
            label={item.short || item.label}
            icon={<span className={classes.iconPill}>{item.icon}</span>}
            className={classes.action}
            onClick={() => go(item.to)}
          />
        ))}
        <BottomNavigationAction
          value="more"
          label={t("more")}
          icon={
            <span className={classes.iconPill}>
              <MoreHorizIcon />
            </span>
          }
          className={classes.action}
          onClick={() => setSheetOpen(true)}
        />
      </BottomNavigation>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={i18n.t("mainDrawer.listItems.menu")}
        subtitle={user?.name}
      >
        {sections.map(section => (
          <div key={section.label}>
            <Typography className={classes.sectionLabel} component="h3">
              {section.label}
            </Typography>
            <div className={classes.grid}>
              {section.items.map(item => (
                <ButtonBase
                  key={item.to}
                  className={`${classes.tile}${isActive(item.to) ? ` ${classes.tileActive}` : ""}`}
                  onClick={() => go(item.to)}
                  aria-current={isActive(item.to) ? "page" : undefined}
                >
                  <span className={classes.tileIcon}>{item.icon}</span>
                  <span className={classes.tileLabel}>{item.label}</span>
                </ButtonBase>
              ))}
            </div>
          </div>
        ))}

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
