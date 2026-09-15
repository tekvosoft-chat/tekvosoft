import React, { useEffect, useState } from "react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Dialog from "@material-ui/core/Dialog";
import IconButton from "@material-ui/core/IconButton";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import FacebookIcon from "@material-ui/icons/Facebook";
import InstagramIcon from "@material-ui/icons/Instagram";
import StarRoundedIcon from "@material-ui/icons/StarRounded";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import CropFreeRoundedIcon from "@material-ui/icons/CropFreeRounded";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import RefreshRoundedIcon from "@material-ui/icons/RefreshRounded";
import ReplayRoundedIcon from "@material-ui/icons/ReplayRounded";
import LinkOffRoundedIcon from "@material-ui/icons/LinkOffRounded";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import VpnKeyOutlinedIcon from "@material-ui/icons/VpnKeyOutlined";
import SettingsBackupRestoreRoundedIcon from "@material-ui/icons/SettingsBackupRestoreRounded";
import AutorenewRoundedIcon from "@material-ui/icons/AutorenewRounded";

import api from "../../services/api";
import BottomSheet from "../../components/ui/BottomSheet";
import { i18n } from "../../translate/i18n";
import { formatWhatsappDigits } from "../../helpers/formatWhatsappDisplay";

/**
 * Conexões como instâncias (no espírito da Evolution API): um cartão por
 * número, com a foto do perfil do WhatsApp, o nome, o número e a situação.
 * Tocar no cartão abre o painel com tudo o que dá para fazer com ela.
 */
const TONE = {
  CONNECTED: "success",
  qrcode: "warning",
  passkey_required: "warning",
  PAIRING: "warning",
  TIMEOUT: "warning",
  OPENING: "info",
  DISCONNECTED: "danger"
};

const locales = { pt: ptBR, pt_PT: ptBR, es };

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const sem = t.semantic;
  const toneBg = {
    success: sem.successSoft,
    warning: sem.warningSoft,
    info: sem.infoSoft,
    danger: sem.dangerSoft
  };
  const toneFg = {
    success: sem.success,
    warning: sem.warning,
    info: sem.info,
    danger: sem.danger
  };
  const tones = {};
  Object.keys(toneBg).forEach(k => {
    tones[`tone_${k}`] = {
      "--tone": toneFg[k],
      "--tone-soft": toneBg[k]
    };
  });
  return {
    ...tones,
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
      gap: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "1fr",
        gap: theme.spacing(1.25)
      }
    },
    card: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      textAlign: "left",
      gap: theme.spacing(1.5),
      padding: theme.spacing(2),
      borderRadius: t.radius.xl,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden",
      transition:
        "transform .18s ease, box-shadow .18s ease, border-color .18s",
      animation: "$rise .35s ease both",
      "&::before": {
        content: "''",
        position: "absolute",
        inset: "0 0 auto 0",
        height: 4,
        backgroundColor: "var(--tone)"
      },
      "&:hover": {
        transform: "translateY(-2px)",
        borderColor: t.borderStrong,
        boxShadow: "0 14px 32px -20px rgba(12, 10, 20, 0.45)"
      }
    },
    top: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
    avatarBox: { position: "relative", flex: "none" },
    avatar: {
      width: 60,
      height: 60,
      fontSize: "1.25rem",
      fontWeight: 700,
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      boxShadow: "0 0 0 3px var(--surface), 0 0 0 5px var(--tone)"
    },
    channel: {
      position: "absolute",
      right: -4,
      bottom: -4,
      width: 24,
      height: 24,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#FFFFFF",
      border: `2px solid ${t.surface}`,
      "& svg": { fontSize: 14 }
    },
    ch_whatsapp: { backgroundColor: "#25D366" },
    ch_facebook: { backgroundColor: "#1877F2" },
    ch_instagram: {
      background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)"
    },
    texts: { flex: 1, minWidth: 0 },
    name: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      "& span": {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    },
    star: { flex: "none", fontSize: 18, color: "#F5B300" },
    sub: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    pill: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "4px 12px 4px 10px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 700,
      color: "var(--tone)",
      backgroundColor: "var(--tone-soft)"
    },
    dot: {
      position: "relative",
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: "var(--tone)"
    },
    pulse: {
      "&::after": {
        content: "''",
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        backgroundColor: "var(--tone)",
        animation: "$pulse 1.6s ease-out infinite"
      }
    },
    queues: { display: "flex", flexWrap: "wrap", gap: 6 },
    queue: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 9px",
      borderRadius: 999,
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      backgroundColor: t.surfaceSunken
    },
    qdot: { width: 7, height: 7, borderRadius: "50%" },
    foot: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      paddingTop: theme.spacing(1.25),
      borderTop: `1px solid ${t.border}`
    },
    updated: {
      flex: 1,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
    },
    cta: {
      borderRadius: 999,
      textTransform: "none",
      fontWeight: 700,
      boxShadow: "none"
    },
    newCard: {
      minHeight: 190,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: t.radius.xl,
      border: `2px dashed ${t.borderStrong}`,
      color: t.brand.text,
      fontWeight: 700,
      transition: "background-color .15s ease, border-color .15s ease",
      "&:hover": {
        backgroundColor: t.brand.textSoft,
        borderColor: t.brand.text
      },
      [theme.breakpoints.down("xs")]: { minHeight: 90, flexDirection: "row" }
    },
    newIcon: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.brand.textSoft,
      "& svg": { fontSize: 28 }
    },

    // painel de detalhes
    dialogPaper: { borderRadius: t.radius.xl, overflow: "hidden" },
    hero: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: theme.spacing(4, 3, 2.5),
      textAlign: "center",
      background: `linear-gradient(180deg, var(--tone-soft), transparent)`,
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1, 2, 2) }
    },
    close: { position: "absolute", top: 8, right: 8 },
    heroAvatar: {
      width: 104,
      height: 104,
      fontSize: "2rem",
      fontWeight: 700,
      marginBottom: 8,
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      boxShadow: "0 0 0 4px var(--surface), 0 0 0 7px var(--tone)"
    },
    heroName: {
      fontSize: "1.375rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    body: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2),
      padding: theme.spacing(0, 3, 3),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(0, 0.5, 1) }
    },
    main: {
      height: 48,
      borderRadius: 999,
      fontWeight: 700,
      textTransform: "none"
    },
    tiles: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 10,
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8
      }
    },
    tile: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "14px 6px",
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      textAlign: "center",
      "& svg": { fontSize: 24, color: t.brand.text },
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    tileDanger: { color: sem.danger, "& svg": { color: sem.danger } },
    rows: {
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      overflow: "hidden"
    },
    row: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      padding: "11px 14px",
      fontSize: "0.875rem",
      "& + $row": { borderTop: `1px solid ${t.border}` },
      "& > span:first-child": { color: theme.palette.text.secondary },
      "& > span:last-child": {
        color: theme.palette.text.primary,
        fontWeight: 600,
        textAlign: "right"
      }
    },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(8px)" },
      to: { opacity: 1, transform: "none" }
    },
    "@keyframes pulse": {
      from: { transform: "scale(1)", opacity: 0.6 },
      to: { transform: "scale(3)", opacity: 0 }
    }
  };
});

const ChannelIcon = ({ channel }) =>
  channel === "facebook" ? (
    <FacebookIcon />
  ) : channel === "instagram" ? (
    <InstagramIcon />
  ) : (
    <WhatsAppIcon />
  );

// foto, nome do perfil e número da sessão aberta
const useInstanceProfile = whatsApp => {
  const [profile, setProfile] = useState({});
  useEffect(() => {
    if (whatsApp.status !== "CONNECTED" || whatsApp.channel !== "whatsapp") {
      setProfile({});
      return undefined;
    }
    let alive = true;
    api
      .get(`/whatsapp/${whatsApp.id}/profile-picture`)
      .then(({ data }) => alive && setProfile(data || {}))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [whatsApp.id, whatsApp.status, whatsApp.channel]);
  return profile;
};

const initials = name =>
  String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0])
    .join("")
    .toUpperCase();

const statusLabel = status =>
  i18n.t(`instances.status.${status}`, {
    defaultValue: i18n.t("instances.status.OPENING")
  });

const ago = date => {
  try {
    const lang = (localStorage.getItem("language") || "pt").replace("-", "_");
    return formatDistanceToNowStrict(parseISO(date), {
      addSuffix: true,
      locale: locales[lang] || (lang.startsWith("pt") ? ptBR : enUS)
    });
  } catch (e) {
    return "";
  }
};

const primaryAction = (whatsApp, actions) => {
  switch (whatsApp.status) {
    case "qrcode":
      return {
        label: i18n.t("instances.actions.scan"),
        onClick: actions.scan,
        icon: <CropFreeRoundedIcon />
      };
    case "DISCONNECTED":
      return {
        label: i18n.t("instances.actions.retry"),
        onClick: actions.retry,
        icon: <ReplayRoundedIcon />
      };
    case "passkey_required":
      return {
        label: i18n.t("instances.actions.passkey"),
        onClick: actions.passkey,
        icon: <VpnKeyOutlinedIcon />
      };
    default:
      return null;
  }
};

export const InstanceCard = ({ whatsApp, index, onOpen, actions }) => {
  const classes = useStyles();
  const theme = useTheme();
  const profile = useInstanceProfile(whatsApp);
  const tone = TONE[whatsApp.status] || "info";
  const number = profile.number ? formatWhatsappDigits(profile.number) : null;
  const main = primaryAction(whatsApp, actions);
  const busy = whatsApp.status === "OPENING";

  return (
    <ButtonBase
      component="div"
      role="button"
      className={`${classes.card} ${classes[`tone_${tone}`]}`}
      style={{
        animationDelay: `${Math.min(index, 8) * 40}ms`,
        "--surface": theme.palette.tkv.surface
      }}
      onClick={() => onOpen(whatsApp, profile)}
    >
      <div className={classes.top}>
        <div className={classes.avatarBox}>
          <Avatar src={profile.url || undefined} className={classes.avatar}>
            {initials(profile.pushName || whatsApp.name)}
          </Avatar>
          <span
            className={`${classes.channel} ${classes[`ch_${whatsApp.channel}`] || classes.ch_whatsapp}`}
          >
            <ChannelIcon channel={whatsApp.channel} />
          </span>
        </div>
        <div className={classes.texts}>
          <div className={classes.name}>
            <span>{whatsApp.name}</span>
            {whatsApp.isDefault && (
              <StarRoundedIcon
                className={classes.star}
                titleAccess={i18n.t("instances.default")}
              />
            )}
          </div>
          <div className={classes.sub}>
            {[profile.pushName, number].filter(Boolean).join(" · ") ||
              i18n.t("instances.noProfile")}
          </div>
        </div>
      </div>

      <span className={classes.pill}>
        <span
          className={`${classes.dot}${tone === "success" || busy ? ` ${classes.pulse}` : ""}`}
        />
        {statusLabel(whatsApp.status)}
      </span>

      {whatsApp.queues?.length > 0 && (
        <div className={classes.queues}>
          {whatsApp.queues.slice(0, 4).map(q => (
            <span key={q.id} className={classes.queue}>
              <span
                className={classes.qdot}
                style={{ backgroundColor: q.color }}
              />
              {q.name}
            </span>
          ))}
          {whatsApp.queues.length > 4 && (
            <span className={classes.queue}>+{whatsApp.queues.length - 4}</span>
          )}
        </div>
      )}

      <div className={classes.foot}>
        <span className={classes.updated}>
          {i18n.t("instances.updated", { time: ago(whatsApp.updatedAt) })}
        </span>
        {main && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            className={classes.cta}
            startIcon={main.icon}
            onClick={e => {
              e.stopPropagation();
              main.onClick(whatsApp);
            }}
          >
            {main.label}
          </Button>
        )}
      </div>
    </ButtonBase>
  );
};

export const NewInstanceCard = ({ onClick }) => {
  const classes = useStyles();
  return (
    <ButtonBase className={classes.newCard} onClick={onClick}>
      <span className={classes.newIcon}>
        <AddRoundedIcon />
      </span>
      {i18n.t("instances.new")}
    </ButtonBase>
  );
};

export const InstanceGrid = ({ children }) => {
  const classes = useStyles();
  return <div className={classes.grid}>{children}</div>;
};

export const InstanceDetails = ({
  open,
  whatsApp,
  profile = {},
  onClose,
  actions
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  if (!whatsApp) return null;

  const status = whatsApp.status;
  const tone = TONE[status] || "info";
  const number = profile.number ? formatWhatsappDigits(profile.number) : null;
  const main = primaryAction(whatsApp, actions);
  const run = fn => () => {
    onClose();
    fn(whatsApp);
  };

  const tiles = [
    {
      key: "edit",
      icon: <EditOutlinedIcon />,
      onClick: actions.edit,
      show: true
    },
    {
      key: "privacy",
      icon: <LockOutlinedIcon />,
      onClick: actions.privacy,
      show: status === "CONNECTED"
    },
    {
      key: "refresh",
      icon: <RefreshRoundedIcon />,
      onClick: actions.refresh,
      show: status === "CONNECTED" && whatsApp.channel === "whatsapp"
    },
    {
      key: "newQr",
      icon: <AutorenewRoundedIcon />,
      onClick: actions.newQr,
      show: status === "DISCONNECTED"
    },
    {
      key: "resetPasskey",
      icon: <SettingsBackupRestoreRoundedIcon />,
      onClick: actions.resetPasskey,
      show: status === "passkey_required"
    },
    {
      key: "disconnect",
      icon: <LinkOffRoundedIcon />,
      onClick: actions.disconnect,
      show: ["CONNECTED", "PAIRING", "TIMEOUT"].includes(status)
    },
    {
      key: "delete",
      icon: <DeleteOutlineRoundedIcon />,
      onClick: actions.remove,
      show: true,
      danger: true
    }
  ].filter(tile => tile.show);

  const content = (
    <div
      className={classes[`tone_${tone}`]}
      style={{ "--surface": theme.palette.tkv.surface }}
    >
      <div className={classes.hero}>
        {!isPhone && (
          <IconButton
            className={classes.close}
            onClick={onClose}
            aria-label={i18n.t("common.close")}
          >
            <CloseRoundedIcon />
          </IconButton>
        )}
        <Avatar src={profile.url || undefined} className={classes.heroAvatar}>
          {initials(profile.pushName || whatsApp.name)}
        </Avatar>
        <span className={classes.heroName}>{whatsApp.name}</span>
        <span className={classes.sub}>
          {[profile.pushName, number].filter(Boolean).join(" · ") ||
            i18n.t("instances.noProfile")}
        </span>
        <span
          className={classes.pill}
          style={{ alignSelf: "center", marginTop: 6 }}
        >
          <span
            className={`${classes.dot}${tone === "success" ? ` ${classes.pulse}` : ""}`}
          />
          {statusLabel(status)}
        </span>
      </div>
      <div className={classes.body}>
        {main && (
          <Button
            variant="contained"
            color="primary"
            className={classes.main}
            startIcon={main.icon}
            onClick={run(main.onClick)}
          >
            {main.label}
          </Button>
        )}
        <div className={classes.tiles}>
          {tiles.map(tile => (
            <ButtonBase
              key={tile.key}
              className={`${classes.tile}${tile.danger ? ` ${classes.tileDanger}` : ""}`}
              onClick={run(tile.onClick)}
            >
              {tile.icon}
              {i18n.t(`instances.actions.${tile.key}`)}
            </ButtonBase>
          ))}
        </div>
        <div className={classes.rows}>
          <div className={classes.row}>
            <span>{i18n.t("instances.channel")}</span>
            <span>
              {whatsApp.channel === "whatsapp" ? "WhatsApp" : whatsApp.channel}
            </span>
          </div>
          <div className={classes.row}>
            <span>{i18n.t("instances.queues")}</span>
            <span>{whatsApp.queues?.map(q => q.name).join(", ") || "—"}</span>
          </div>
          <div className={classes.row}>
            <span>{i18n.t("instances.default")}</span>
            <span>
              {whatsApp.isDefault
                ? i18n.t("instances.yes")
                : i18n.t("instances.no")}
            </span>
          </div>
          <div className={classes.row}>
            <span>{i18n.t("instances.lastUpdate")}</span>
            <span>{ago(whatsApp.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return isPhone ? (
    <BottomSheet open={open} onClose={onClose} showClose={false}>
      {content}
    </BottomSheet>
  ) : (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      classes={{ paper: classes.dialogPaper }}
    >
      {content}
    </Dialog>
  );
};
