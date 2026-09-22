import React, { useContext, useEffect, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import InputBase from "@material-ui/core/InputBase";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import ChevronRightRoundedIcon from "@material-ui/icons/ChevronRightRounded";
import moment from "moment";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import UserAvatar from "../../components/ui/UserAvatar";
import UserModal from "../../components/UserModal";
import AboutModal from "../../components/AboutModal";
import PageLoader from "../../components/ui/PageLoader";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import useNotificationSound from "../../hooks/useNotificationSound";
import { isTouchDevice, useHaptics } from "../../helpers/haptics";
import { messages } from "../../translate/languages";
import { i18n } from "../../translate/i18n";

/**
 * Perfil (admin e atendente), minimalista.
 *
 * No computador ocupa a área toda: cabeçalho em cima e duas colunas embaixo
 * (status e bio à esquerda, com a bio crescendo até o fim; preferências e
 * conta à direita, com a conta ancorada embaixo). Tudo em
 * tons neutros — a cor do tema só aparece no que a pessoa aciona (status
 * escolhido, chave ligada, salvar, campo em edição, toque nos botões).
 */
const STATUS_PRESETS = [
  "Disponível",
  "Almoçando",
  "Em reunião",
  "Focado",
  "Home office",
  "De férias"
];

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const text = theme.palette.text;
  const pressed = {
    color: t.brand.text,
    backgroundColor: t.brand.textSoft
  };
  return {
    page: { overflowY: "auto", ...theme.scrollbarStyles },
    card: {
      flex: "1 0 auto",
      width: "100%",
      maxWidth: 1180,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      padding: theme.spacing(3.5, 4),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: {
        padding: theme.spacing(2),
        border: "none",
        backgroundColor: "transparent"
      }
    },
    head: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(2.5),
      paddingBottom: theme.spacing(3),
      borderBottom: `1px solid ${t.border}`,
      [theme.breakpoints.down("xs")]: {
        flexWrap: "wrap",
        gap: theme.spacing(1.5),
        paddingBottom: theme.spacing(2)
      }
    },
    avatar: {
      backgroundColor: `${t.surfaceSunken} !important`,
      color: `${text.primary} !important`,
      border: `1px solid ${t.border}`
    },
    who: { flex: 1, minWidth: 0 },
    name: {
      fontSize: "1.375rem",
      fontWeight: 700,
      lineHeight: 1.25,
      color: text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    status: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      margin: "2px 0 4px",
      fontSize: "0.875rem",
      color: text.primary,
      "&::before": {
        content: '""',
        flex: "none",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: t.semantic.success
      }
    },
    muted: { fontSize: "0.8125rem", color: text.secondary },
    ghost: {
      flex: "none",
      height: 36,
      padding: "0 14px",
      borderRadius: 10,
      border: `1px solid ${t.border}`,
      textTransform: "none",
      fontWeight: 600,
      color: text.primary,
      "&:active": { ...pressed, borderColor: t.brand.textBorder },
      [theme.breakpoints.down("xs")]: { width: "100%" }
    },
    body: {
      flex: 1,
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
      paddingTop: theme.spacing(3),
      [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "minmax(0, 1fr)",
        paddingTop: theme.spacing(2)
      }
    },
    column: {
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(3)
    },
    left: {
      paddingRight: theme.spacing(4),
      [theme.breakpoints.down("sm")]: { paddingRight: 0 }
    },
    right: {
      paddingLeft: theme.spacing(4),
      borderLeft: `1px solid ${t.border}`,
      [theme.breakpoints.down("sm")]: {
        paddingLeft: 0,
        paddingTop: theme.spacing(3),
        marginTop: theme.spacing(3),
        borderLeft: "none",
        borderTop: `1px solid ${t.border}`
      }
    },
    grow: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minHeight: 0
    },
    bottom: {
      marginTop: "auto",
      [theme.breakpoints.down("sm")]: { marginTop: 0 }
    },
    label: {
      marginBottom: theme.spacing(1.25),
      fontSize: "0.6875rem",
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: text.secondary
    },
    field: {
      width: "100%",
      padding: "9px 12px",
      borderRadius: 10,
      border: `1px solid ${t.border}`,
      fontSize: "0.9375rem",
      color: text.primary,
      transition: "border-color .15s ease, box-shadow .15s ease",
      "&.Mui-focused": {
        borderColor: t.brand.main,
        boxShadow: `0 0 0 3px ${t.brand.textSoft}`
      }
    },
    bioField: {
      flex: 1,
      alignItems: "stretch",
      "& textarea": {
        height: "100% !important",
        minHeight: 140,
        resize: "none",
        overflowY: "auto",
        lineHeight: 1.5
      },
      [theme.breakpoints.down("sm")]: {
        flex: "none",
        "& textarea": { height: "auto !important" }
      }
    },
    presets: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
    preset: {
      height: 30,
      padding: "0 12px",
      borderRadius: t.radius.pill,
      border: `1px solid ${t.border}`,
      fontSize: "0.8125rem",
      color: text.secondary,
      transition: "all .15s ease",
      "&:hover": { color: text.primary },
      "&:active": pressed
    },
    presetOn: {
      ...pressed,
      borderColor: t.brand.textBorder,
      "&:hover": { color: t.brand.text }
    },
    bioFoot: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 10
    },
    hint: { fontSize: "0.75rem", color: text.secondary },
    save: {
      height: 36,
      padding: "0 18px",
      borderRadius: 10,
      textTransform: "none",
      fontWeight: 600,
      "&.Mui-disabled": {
        color: text.disabled,
        backgroundColor: t.surfaceSunken
      }
    },
    row: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      minHeight: 48,
      padding: "2px 8px",
      margin: "0 -8px",
      borderRadius: 8,
      justifyContent: "flex-start",
      textAlign: "left",
      fontSize: "0.9375rem",
      color: text.primary,
      boxSizing: "content-box",
      transition: "background-color .12s ease, color .12s ease",
      "& + &": { borderTop: `1px solid ${t.border}` }
    },
    rowButton: { "&:active": pressed },
    rowText: { flex: 1, minWidth: 0 },
    chevron: { color: text.disabled },
    danger: { color: t.semantic.danger },
    switch: {
      "& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track": {
        backgroundColor: t.borderStrong || text.disabled,
        opacity: 1
      }
    },
    select: {
      fontSize: "0.875rem",
      "& .MuiSelect-select": { paddingRight: 28 },
      "&:before, &:after": { display: "none" }
    }
  };
});

const Profile = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { user, handleLogout } = useContext(AuthContext);
  const { colorMode } = useContext(ColorModeContext);
  const [soundOn, setSoundOn] = useNotificationSound();
  const [hapticsOn, setHapticsOn] = useHaptics();
  const [profile, setProfile] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const isDark = theme.mode === "dark";
  const language =
    localStorage.getItem("language") || i18n.language?.split("-")[0] || "pt";

  const load = () =>
    api
      .get("/profile/me")
      .then(({ data }) => {
        setProfile(data);
        setStatusText(data.statusText || "");
        setBio(data.bio || "");
      })
      .catch(toastError);

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/profile/me", { statusText, bio });
      setProfile(data);
      toast.success("Perfil atualizado");
    } catch (err) {
      toastError(err);
    }
    setSaving(false);
  };

  if (!profile) return <PageLoader />;

  const changed =
    statusText !== (profile.statusText || "") || bio !== (profile.bio || "");
  const isAdmin = profile.profile === "admin";
  const showDue =
    isAdmin && Number(profile.companyId) !== 1 && user?.company?.dueDate;

  // ligada: cor do tema; desligada: cinza
  const isPreset = preset =>
    statusText === preset || statusText.endsWith(` ${preset}`);

  const toggle = (checked, onChange) => (
    <Switch
      className={classes.switch}
      color="primary"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
    />
  );

  return (
    <MainContainer className={classes.page}>
      <div className={classes.card}>
        <div className={classes.head}>
          <UserAvatar user={profile} size={80} className={classes.avatar} />
          <div className={classes.who}>
            <div className={classes.name}>{profile.name}</div>
            {profile.statusText && (
              <div className={classes.status}>{profile.statusText}</div>
            )}
            <div className={classes.muted}>
              {profile.email} · {isAdmin ? "Administrador" : "Atendente"} ·{" "}
              {profile.company?.name} · desde{" "}
              {moment(profile.createdAt).format("MMM [de] YYYY")}
            </div>
          </div>
          <Button className={classes.ghost} onClick={() => setEditOpen(true)}>
            Editar dados
          </Button>
        </div>

        <div className={classes.body}>
          <div className={`${classes.column} ${classes.left}`}>
            <div>
              <div className={classes.label}>Status</div>
              <InputBase
                className={classes.field}
                placeholder="O que você está fazendo agora?"
                value={statusText}
                inputProps={{ maxLength: 80 }}
                onChange={e => setStatusText(e.target.value)}
              />
              <div className={classes.presets}>
                {STATUS_PRESETS.map(preset => (
                  <ButtonBase
                    key={preset}
                    className={`${classes.preset}${isPreset(preset) ? ` ${classes.presetOn}` : ""}`}
                    onClick={() =>
                      setStatusText(isPreset(preset) ? "" : preset)
                    }
                  >
                    {preset}
                  </ButtonBase>
                ))}
              </div>
            </div>

            <div className={classes.grow}>
              <div className={classes.label}>Sobre mim</div>
              <InputBase
                className={`${classes.field} ${classes.bioField}`}
                multiline
                rows={6}
                placeholder="Sua função e como a equipe pode te ajudar."
                value={bio}
                inputProps={{ maxLength: 600 }}
                onChange={e => setBio(e.target.value)}
              />
              <div className={classes.bioFoot}>
                <span className={classes.hint}>
                  {bio.length}/600 · aparece no seu perfil do chat interno
                </span>
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  className={classes.save}
                  disabled={!changed || saving}
                  onClick={save}
                >
                  {saving ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </div>
          </div>

          <div className={`${classes.column} ${classes.right}`}>
            <div>
              <div className={classes.label}>Preferências deste aparelho</div>
              <div className={classes.row}>
                <span className={classes.rowText}>Som das notificações</span>
                {toggle(soundOn, setSoundOn)}
              </div>
              <div className={classes.row}>
                <span className={classes.rowText}>Modo escuro</span>
                {toggle(isDark, () => colorMode.toggleColorMode())}
              </div>
              {isTouchDevice() && (
                <div className={classes.row}>
                  <span className={classes.rowText}>Vibração</span>
                  {toggle(hapticsOn, setHapticsOn)}
                </div>
              )}
              <div className={classes.row}>
                <span className={classes.rowText}>Idioma</span>
                <Select
                  className={classes.select}
                  value={
                    messages[language] ? language : Object.keys(messages)[0]
                  }
                  onChange={e => {
                    localStorage.setItem("language", e.target.value);
                    window.location.reload(false);
                  }}
                >
                  {Object.keys(messages).map(key => (
                    <MenuItem key={key} value={key}>
                      {
                        messages[key].translations.mainDrawer.appBar.i18n
                          .language
                      }
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>

            <div className={classes.bottom}>
              <div className={classes.label}>Conta</div>
              {showDue && (
                <div className={classes.row}>
                  <span className={classes.rowText}>Assinatura válida até</span>
                  <span className={classes.muted}>
                    {moment(user.company.dueDate).format("DD/MM/YYYY")}
                  </span>
                </div>
              )}
              <ButtonBase
                className={`${classes.row} ${classes.rowButton}`}
                onClick={() => setAboutOpen(true)}
              >
                <span className={classes.rowText}>
                  Sobre o{" "}
                  {user?.super ? "Tekvosoft" : theme.appName || "sistema"}
                </span>
                <ChevronRightRoundedIcon className={classes.chevron} />
              </ButtonBase>
              <ButtonBase
                className={`${classes.row} ${classes.rowButton}`}
                onClick={handleLogout}
              >
                <span className={`${classes.rowText} ${classes.danger}`}>
                  Sair
                </span>
              </ButtonBase>
            </div>
          </div>
        </div>
      </div>

      <UserModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          load();
        }}
        userId={user?.id}
      />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </MainContainer>
  );
};

export default Profile;
