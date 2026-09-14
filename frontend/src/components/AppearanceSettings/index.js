import React, { useContext, useMemo, useRef, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Button,
  ButtonBase,
  CircularProgress,
  Typography
} from "@material-ui/core";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";
import ColorizeOutlinedIcon from "@material-ui/icons/ColorizeOutlined";
import WbSunnyOutlinedIcon from "@material-ui/icons/WbSunnyOutlined";
import Brightness2OutlinedIcon from "@material-ui/icons/Brightness2Outlined";
import { toast } from "react-toastify";

import ColorModeContext from "../../layout/themeContext";
import useSettings from "../../hooks/useSettings";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import {
  THEME_PRESETS,
  contrastRatio,
  darken,
  lighten,
  neutralDark,
  neutralLight,
  readableOn,
  tintNeutrals
} from "../../theme/tokens";

/**
 * Configurações > Aparência.
 *
 * O admin escolhe um tema e o sistema muda NA HORA — antes mesmo de salvar
 * terminar. Em seguida a escolha é gravada nas configurações da empresa, e
 * o servidor avisa os outros usuários pelo socket: a equipe inteira passa a
 * ver as novas cores sem recarregar a página.
 *
 * Cada cartão mostra uma miniatura de verdade do tema (fundo, campo, botão,
 * cor principal), calculada com as mesmas funções que montam o tema — o que
 * aparece na prévia é o que vai aparecer no sistema.
 */

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(3),
      padding: theme.spacing(3),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(2, 1.5) }
    },
    head: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing(2)
    },
    title: {
      fontSize: "1.125rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    subtitle: {
      marginTop: 4,
      maxWidth: 560,
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    modeSwitch: {
      display: "inline-flex",
      position: "relative",
      padding: 4,
      borderRadius: t.radius.md,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`
    },
    modeSquare: {
      position: "absolute",
      top: 4,
      bottom: 4,
      width: "calc(50% - 4px)",
      borderRadius: t.radius.sm,
      backgroundColor: t.surface,
      boxShadow: theme.shadows[2],
      transition: "transform .28s cubic-bezier(.2, .8, .2, 1)"
    },
    modeOption: {
      position: "relative",
      zIndex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minWidth: 104,
      height: 36,
      padding: "0 14px",
      borderRadius: t.radius.sm,
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 18 }
    },
    modeOptionActive: { color: theme.palette.text.primary },

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: theme.spacing(2),
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "1fr 1fr",
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
      padding: theme.spacing(1.5, 1.5, 2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      transition:
        "border-color .15s ease, box-shadow .15s ease, transform .15s ease",
      "&:hover": {
        borderColor: t.borderStrong,
        boxShadow: theme.shadows[3]
      },
      "&:active": { transform: "scale(0.985)" }
    },
    cardActive: {
      borderColor: "var(--card-accent)",
      boxShadow: "0 0 0 1px var(--card-accent)",
      "&:hover": { borderColor: "var(--card-accent)" }
    },
    check: {
      position: "absolute",
      top: 8,
      right: 8,
      zIndex: 2,
      width: 26,
      height: 26,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--card-accent)",
      color: "var(--card-accent-text)",
      boxShadow: theme.shadows[3],
      "& svg": { fontSize: 18 }
    },

    // miniatura do tema
    preview: {
      position: "relative",
      height: 92,
      borderRadius: t.radius.md,
      overflow: "hidden",
      border: "1px solid var(--pv-border)",
      backgroundColor: "var(--pv-canvas)",
      [theme.breakpoints.down("xs")]: { height: 72 }
    },
    pvBar: {
      height: 18,
      backgroundColor: "var(--pv-surface)",
      borderBottom: "1px solid var(--pv-border)"
    },
    pvRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "12px 12px 0",
      [theme.breakpoints.down("xs")]: { padding: "8px 8px 0", gap: 6 }
    },
    pvInput: {
      flex: 1,
      height: 22,
      borderRadius: 999,
      backgroundColor: "var(--pv-surface)",
      border: "1px solid var(--pv-border)"
    },
    pvButton: {
      width: 34,
      height: 22,
      borderRadius: 999,
      backgroundColor: "var(--pv-main)"
    },
    pvStrip: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 5,
      background: "linear-gradient(90deg, var(--pv-main), var(--pv-accent))"
    },

    nameRow: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1)
    },
    name: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      [theme.breakpoints.down("xs")]: { fontSize: "0.875rem" }
    },
    dots: { display: "flex", gap: 4, flex: "none" },
    dot: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      border: "1px solid rgba(0,0,0,0.08)"
    },
    description: {
      marginTop: -6,
      fontSize: "0.8125rem",
      lineHeight: 1.45,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: { display: "none" }
    },

    customInput: {
      position: "absolute",
      inset: 0,
      opacity: 0,
      cursor: "pointer",
      width: "100%",
      height: "100%"
    },
    customIcon: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 36,
      height: 36,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.9)",
      color: "#1A1626",
      boxShadow: theme.shadows[3],
      pointerEvents: "none"
    },
    footer: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.5),
      flexWrap: "wrap"
    },
    saving: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    }
  };
});

/**
 * Cor personalizada -> par claro/escuro utilizável.
 * No claro, escurece até texto branco ter contraste de leitura (4.5);
 * no escuro, clareia até destacar do fundo escuro.
 */
const deriveCustom = hex => {
  let light = hex;
  for (let i = 0; i < 20 && contrastRatio(light, "#FFFFFF") < 4.5; i += 1) {
    light = darken(light, 0.03);
  }
  let dark = hex;
  for (let i = 0; i < 20 && contrastRatio(dark, "#121019") < 5; i += 1) {
    dark = lighten(dark, 0.03);
  }
  return { preset: "custom", light, dark, base: hex };
};

const previewVars = (colors, isDark, accent) => {
  const main = isDark ? colors.dark : colors.light;
  const n = tintNeutrals(isDark ? neutralDark : neutralLight, main);
  return {
    "--pv-canvas": n.canvas,
    "--pv-surface": n.surface,
    "--pv-border": n.border,
    "--pv-main": main,
    "--pv-accent": accent || main,
    "--card-accent": main,
    "--card-accent-text": readableOn(main)
  };
};

const AppearanceSettings = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { colorMode, accountTheme, mode } = useContext(ColorModeContext);
  const { update } = useSettings();
  const [saving, setSaving] = useState(false);
  const customTimer = useRef(null);
  const themeBeforeCustom = useRef(null);

  const isDark = mode === "dark" || theme.palette.type === "dark";
  const activeId = accountTheme?.preset || "tekvosoft";
  const custom =
    accountTheme?.preset === "custom" ? accountTheme : deriveCustom("#0F766E");

  const presets = useMemo(
    () =>
      THEME_PRESETS.map(p => ({
        ...p,
        name: i18n.t(`settings.appearance.presets.${p.id}.name`),
        description: i18n.t(`settings.appearance.presets.${p.id}.description`)
      })),
    []
  );

  const persist = async (next, previous) => {
    // aplica primeiro: a pessoa vê a mudança no mesmo instante do clique
    colorMode.applyAccountTheme(next);
    setSaving(true);
    try {
      await update({
        key: "appTheme",
        value: next ? JSON.stringify(next) : ""
      });
      toast.success(
        next
          ? i18n.t("settings.appearance.applied")
          : i18n.t("settings.appearance.restored"),
        { autoClose: 1800 }
      );
    } catch (err) {
      colorMode.applyAccountTheme(previous);
      toastError(err);
    }
    setSaving(false);
  };

  const choosePreset = preset => {
    if (activeId === preset.id && accountTheme) return;
    persist(
      { preset: preset.id, light: preset.light, dark: preset.dark },
      accountTheme
    );
  };

  return (
    <div className={classes.root}>
      <div className={classes.head}>
        <div>
          <Typography component="h2" className={classes.title}>
            {i18n.t("settings.appearance.title")}
          </Typography>
          <Typography className={classes.subtitle}>
            {i18n.t("settings.appearance.subtitle")}
          </Typography>
        </div>

        {/* claro/escuro: preferência deste navegador, com o quadrado que desliza */}
        <div
          className={classes.modeSwitch}
          role="radiogroup"
          aria-label={i18n.t("settings.appearance.mode")}
        >
          <span
            className={classes.modeSquare}
            style={{ transform: `translateX(${isDark ? "100%" : "0"})` }}
            aria-hidden="true"
          />
          <ButtonBase
            role="radio"
            aria-checked={!isDark}
            className={`${classes.modeOption}${!isDark ? ` ${classes.modeOptionActive}` : ""}`}
            onClick={() => colorMode.setColorMode("light")}
          >
            <WbSunnyOutlinedIcon />
            {i18n.t("settings.appearance.light")}
          </ButtonBase>
          <ButtonBase
            role="radio"
            aria-checked={isDark}
            className={`${classes.modeOption}${isDark ? ` ${classes.modeOptionActive}` : ""}`}
            onClick={() => colorMode.setColorMode("dark")}
          >
            <Brightness2OutlinedIcon />
            {i18n.t("settings.appearance.dark")}
          </ButtonBase>
        </div>
      </div>

      <div className={classes.grid} role="radiogroup">
        {presets.map(preset => {
          const active = activeId === preset.id;
          const vars = previewVars(preset, isDark, preset.accent);
          const main = isDark ? preset.dark : preset.light;
          return (
            <ButtonBase
              key={preset.id}
              role="radio"
              aria-checked={active}
              className={`${classes.card}${active ? ` ${classes.cardActive}` : ""}`}
              style={vars}
              onClick={() => choosePreset(preset)}
              disabled={saving}
            >
              {active && (
                <span className={classes.check} aria-hidden="true">
                  <CheckRoundedIcon />
                </span>
              )}
              <div className={classes.preview} aria-hidden="true">
                <div className={classes.pvBar} />
                <div className={classes.pvRow}>
                  <span className={classes.pvInput} />
                  <span className={classes.pvButton} />
                </div>
                <span className={classes.pvStrip} />
              </div>
              <div className={classes.nameRow}>
                <Typography component="span" className={classes.name}>
                  {preset.name}
                </Typography>
                <span className={classes.dots} aria-hidden="true">
                  <span
                    className={classes.dot}
                    style={{ backgroundColor: main }}
                  />
                  <span
                    className={classes.dot}
                    style={{ backgroundColor: preset.accent }}
                  />
                  <span
                    className={classes.dot}
                    style={{ backgroundColor: vars["--pv-canvas"] }}
                  />
                </span>
              </div>
              <Typography component="span" className={classes.description}>
                {preset.description}
              </Typography>
            </ButtonBase>
          );
        })}

        {/* cor personalizada: o seletor de cor do próprio aparelho */}
        {(() => {
          const active = activeId === "custom";
          const vars = previewVars(custom, isDark, null);
          return (
            <div
              className={`${classes.card}${active ? ` ${classes.cardActive}` : ""}`}
              style={vars}
            >
              {active && (
                <span className={classes.check} aria-hidden="true">
                  <CheckRoundedIcon />
                </span>
              )}
              <div className={classes.preview}>
                <div className={classes.pvBar} />
                <div className={classes.pvRow}>
                  <span className={classes.pvInput} />
                  <span className={classes.pvButton} />
                </div>
                <span className={classes.pvStrip} />
                <span className={classes.customIcon}>
                  <ColorizeOutlinedIcon fontSize="small" />
                </span>
                <input
                  type="color"
                  className={classes.customInput}
                  value={custom.base || custom.light}
                  aria-label={i18n.t("settings.appearance.custom")}
                  disabled={saving}
                  onChange={e => {
                    // pinta enquanto a pessoa escolhe; grava quando ela para
                    // (no celular o seletor nativo nem sempre avisa ao fechar)
                    if (!customTimer.current) {
                      themeBeforeCustom.current = accountTheme;
                    }
                    const next = deriveCustom(e.target.value);
                    colorMode.applyAccountTheme(next);
                    clearTimeout(customTimer.current);
                    customTimer.current = setTimeout(() => {
                      customTimer.current = null;
                      persist(next, themeBeforeCustom.current);
                    }, 700);
                  }}
                />
              </div>
              <div className={classes.nameRow}>
                <Typography component="span" className={classes.name}>
                  {i18n.t("settings.appearance.custom")}
                </Typography>
                <span className={classes.dots} aria-hidden="true">
                  <span
                    className={classes.dot}
                    style={{
                      backgroundColor: isDark ? custom.dark : custom.light
                    }}
                  />
                </span>
              </div>
              <Typography component="span" className={classes.description}>
                {i18n.t("settings.appearance.customDescription")}
              </Typography>
            </div>
          );
        })()}
      </div>

      <div className={classes.footer}>
        <Button
          variant="outlined"
          disabled={saving || !accountTheme}
          onClick={() => persist(null, accountTheme)}
        >
          {i18n.t("settings.appearance.restore")}
        </Button>
        {saving && (
          <span className={classes.saving}>
            <CircularProgress size={14} />
          </span>
        )}
      </div>
    </div>
  );
};

export default AppearanceSettings;
