/**
 * Tekvosoft — construção do tema do Material-UI.
 *
 * Este arquivo é o coração do redesign. Em vez de estilizar tela por tela,
 * definimos aqui como CADA componente do Material-UI se parece. São 223
 * arquivos usando Button, Paper, Table, Dialog e TextField: mexer uma vez
 * aqui muda o sistema inteiro e — mais importante — impede que as telas
 * voltem a divergir com o tempo.
 *
 * Duas regras que este arquivo respeita:
 *
 *   1. Whitelabel continua funcionando. A cor principal chega por parâmetro,
 *      vinda das Configurações. Todo o resto (hover, borda, fundo suave,
 *      cor do texto em cima) é DERIVADO dela em tokens.js.
 *
 *   2. Nada quebra. As chaves antigas da paleta (bordabox, inputdigita,
 *      fancyBackground, boxticket...) continuam existindo e agora apontam
 *      para os tokens novos. Componentes que ainda as usam seguem de pé e
 *      ganham a aparência nova de graça.
 */

import { createTheme } from "@material-ui/core/styles";

import {
  alpha,
  brandStates,
  buildShadows,
  fontStack,
  layout,
  monoStack,
  neutralDark,
  neutralLight,
  radius,
  semanticDark,
  semanticLight,
  SPACING_UNIT
} from "./tokens";

export default function createAppTheme({
  mode = "light",
  primaryColor,
  locale,
  appLogoLight,
  appLogoDark,
  appLogoFavicon,
  appName,
  calculatedLogoLight,
  calculatedLogoDark
} = {}) {
  const isDark = mode === "dark";
  const n = isDark ? neutralDark : neutralLight;
  const sem = isDark ? semanticDark : semanticLight;
  const b = brandStates(primaryColor, isDark);

  const shadows = buildShadows(isDark);

  // Barras de rolagem finas e discretas. Mantemos os dois nomes antigos
  // porque 35 componentes espalham `...theme.scrollbarStyles`.
  const scrollbarStyles = {
    "&::-webkit-scrollbar": { width: 8, height: 8 },
    "&::-webkit-scrollbar-track": { background: "transparent" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: isDark ? "#3C3452" : "#D6D1E6",
      borderRadius: radius.pill,
      border: "2px solid transparent",
      backgroundClip: "content-box"
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: isDark ? "#4E4468" : "#C0B9D6"
    }
  };

  const scrollbarStylesSoft = {
    "&::-webkit-scrollbar": { width: 6 },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: isDark ? "#2E2842" : "#E2DEEE",
      borderRadius: radius.pill
    }
  };

  const focusRing = {
    outline: "none",
    boxShadow: `0 0 0 3px ${b.focusRing}`
  };

  const theme = createTheme(
    {
      // ───────────────────────────────────────────────────────
      // Paleta
      // ───────────────────────────────────────────────────────
      palette: {
        type: mode,

        primary: {
          main: b.main,
          light: b.hover,
          dark: b.active,
          contrastText: b.contrastText
        },
        secondary: {
          main: sem.info,
          contrastText: "#FFFFFF"
        },
        error: { main: sem.danger, contrastText: "#FFFFFF" },
        warning: { main: sem.warning, contrastText: "#FFFFFF" },
        success: { main: sem.success, contrastText: "#FFFFFF" },
        info: { main: sem.info, contrastText: "#FFFFFF" },

        background: {
          default: n.canvas,
          paper: n.surface
        },
        text: {
          primary: n.textPrimary,
          secondary: n.textSecondary,
          disabled: n.textDisabled,
          hint: n.textTertiary
        },
        divider: n.border,
        action: {
          active: n.textSecondary,
          hover: n.surfaceHover,
          hoverOpacity: 0.06,
          selected: b.soft,
          selectedOpacity: 0.1,
          disabled: n.textDisabled,
          disabledBackground: isDark ? "#262134" : "#EFEDF5",
          focus: b.focusRing
        },

        // ── camada nova: tokens nomeados por função ──
        // É por aqui que os componentes novos falam com o tema.
        tkv: {
          brand: b,
          neutral: n,
          semantic: sem,
          radius,
          layout,
          isDark,
          // superfícies
          canvas: n.canvas,
          surface: n.surface,
          surfaceRaised: n.surfaceRaised,
          surfaceSunken: n.surfaceSunken,
          surfaceHover: n.surfaceHover,
          border: n.border,
          borderStrong: n.borderStrong
        },

        // ───────────────────────────────────────────────────
        // Compatibilidade: chaves da versão antiga do tema.
        // Continuam existindo para não quebrar os componentes
        // que ainda as consomem; agora apontam para os tokens
        // novos, então herdam o visual novo sem edição.
        // ───────────────────────────────────────────────────
        textPrimary: b.main,
        textCommon: n.textPrimary,
        borderPrimary: b.border,
        backgroundContrast: {
          default: n.surfaceSunken,
          paper: n.surfaceSunken,
          border: n.border
        },
        dark: { main: isDark ? n.textSecondary : "#333333" },
        light: { main: isDark ? n.surfaceSunken : "#F3F3F3" },
        chatBubbleFromMe: { main: isDark ? "#2E2547" : "#EDE6FE" },
        chatBubbleReceived: { main: isDark ? n.surfaceRaised : "#FFFFFF" },
        chatBackground: { main: n.canvas },
        tabHeaderBackground: n.surfaceSunken,
        optionsBackground: n.canvas,
        options: n.surfaceSunken,
        fontecor: b.main,
        fancyBackground: n.canvas,
        bordabox: n.border,
        newmessagebox: n.surfaceSunken,
        inputdigita: n.surface,
        contactdrawer: n.surface,
        announcements: n.surfaceSunken,
        login: n.surface,
        announcementspopover: n.surface,
        chatlist: { main: n.border },
        boxlist: n.surfaceSunken,
        boxchatlist: n.surfaceSunken,
        total: n.surface,
        messageIcons: n.textTertiary,
        inputBackground: n.surface,
        barraSuperior: n.surface,
        boxticket: n.surfaceSunken,
        campaigntab: n.surfaceSunken
      },

      // ───────────────────────────────────────────────────────
      // Tipografia
      // ───────────────────────────────────────────────────────
      typography: {
        fontFamily: fontStack,
        fontSize: 14,
        h1: { fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em" },
        h2: { fontSize: "1.625rem", fontWeight: 700, letterSpacing: "-0.02em" },
        h3: {
          fontSize: "1.375rem",
          fontWeight: 700,
          letterSpacing: "-0.015em"
        },
        h4: {
          fontSize: "1.1875rem",
          fontWeight: 700,
          letterSpacing: "-0.01em"
        },
        h5: {
          fontSize: "1.0625rem",
          fontWeight: 700,
          letterSpacing: "-0.01em"
        },
        h6: { fontSize: "0.9375rem", fontWeight: 700 },
        subtitle1: { fontSize: "0.9375rem", fontWeight: 600 },
        subtitle2: { fontSize: "0.8125rem", fontWeight: 600 },
        body1: { fontSize: "0.875rem", lineHeight: 1.55 },
        body2: { fontSize: "0.8125rem", lineHeight: 1.55 },
        caption: { fontSize: "0.75rem", lineHeight: 1.45 },
        overline: {
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase"
        },
        // Botões em caixa alta são a marca registrada de interface datada.
        button: {
          fontSize: "0.875rem",
          fontWeight: 600,
          textTransform: "none",
          letterSpacing: 0
        }
      },

      shape: { borderRadius: radius.md },
      spacing: SPACING_UNIT,
      shadows,

      // ───────────────────────────────────────────────────────
      // Padrões de componentes
      // ───────────────────────────────────────────────────────
      props: {
        MuiButton: { disableElevation: true },
        MuiPaper: { elevation: 0 },
        MuiTextField: { variant: "outlined", size: "small" },
        MuiFormControl: { variant: "outlined", size: "small" },
        MuiSelect: { variant: "outlined" },
        MuiTooltip: { arrow: true },
        MuiLink: { underline: "hover" },
        MuiCircularProgress: { thickness: 4 }
      },

      overrides: {
        // ── base global ──
        MuiCssBaseline: {
          "@global": {
            html: { WebkitFontSmoothing: "antialiased" },
            body: {
              fontFamily: fontStack,
              backgroundColor: n.canvas,
              color: n.textPrimary
            },
            "*": scrollbarStyles,
            "::selection": {
              backgroundColor: b.soft,
              color: n.textPrimary
            },
            // Foco visível só para teclado — o mouse não fica sujando a tela.
            "a:focus-visible, button:focus-visible, [tabindex]:focus-visible":
              focusRing,
            code: { fontFamily: monoStack },

            /**
             * Tabela larga vira lista de cartões no celular.
             *
             * Uma tabela de seis colunas não cabe em 390px: ou corta a última
             * coluna, ou obriga a arrastar para o lado dentro do cartão —
             * que é justamente o gesto que queremos eliminar. Aqui cada linha
             * vira um cartão e cada célula uma dupla rótulo/valor, lendo de
             * cima para baixo, que é como se lê no celular.
             *
             * A página adere pondo `className="tkv-stack"` na Table e
             * `data-label` em cada célula do corpo. Sem data-label a célula
             * some, o que serve para colunas decorativas (avatar, caixa de
             * seleção) que não fazem sentido na versão empilhada.
             */
            "@media (max-width: 599.95px)": {
              ".tkv-stack thead": { display: "none" },
              ".tkv-stack tbody": { display: "block" },
              ".tkv-stack tbody tr": {
                display: "block",
                border: `1px solid ${n.border}`,
                borderRadius: radius.md,
                backgroundColor: n.surface,
                marginBottom: 10,
                padding: "4px 14px"
              },
              ".tkv-stack tbody td": {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                border: "none",
                padding: "9px 0",
                textAlign: "right",
                width: "auto"
              },
              ".tkv-stack tbody td + td": {
                borderTop: `1px solid ${n.border}`
              },
              ".tkv-stack tbody td::before": {
                content: "attr(data-label)",
                flex: "none",
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: n.textSecondary,
                textAlign: "left"
              },
              ".tkv-stack tbody td:not([data-label])": { display: "none" },
              // célula sem valor não vira linha órfã com rótulo solto
              ".tkv-stack tbody td:empty": { display: "none" }
            }
          }
        },

        // ── superfícies ──
        MuiPaper: {
          rounded: { borderRadius: radius.lg },
          outlined: {
            border: `1px solid ${n.border}`,
            backgroundColor: n.surface
          },
          elevation1: { boxShadow: shadows[1] },
          elevation4: { boxShadow: shadows[3] },
          elevation8: { boxShadow: shadows[5] }
        },
        MuiCard: {
          root: {
            borderRadius: radius.lg,
            border: `1px solid ${n.border}`,
            backgroundColor: n.surface,
            boxShadow: "none"
          }
        },
        MuiCardContent: {
          root: { padding: 20, "&:last-child": { paddingBottom: 20 } }
        },
        MuiDivider: { root: { backgroundColor: n.border } },

        // ── botões ──
        MuiButton: {
          root: {
            borderRadius: radius.sm,
            minHeight: 38,
            padding: "7px 16px",
            transition: "background-color .15s ease, box-shadow .15s ease",
            "&.Mui-focusVisible": focusRing
          },
          sizeSmall: {
            minHeight: 32,
            padding: "4px 12px",
            fontSize: "0.8125rem"
          },
          sizeLarge: {
            minHeight: 46,
            padding: "10px 24px",
            fontSize: "0.9375rem"
          },
          contained: {
            backgroundColor: n.surface,
            color: n.textPrimary,
            border: `1px solid ${n.border}`,
            "&:hover": { backgroundColor: n.surfaceHover }
          },
          containedPrimary: {
            backgroundColor: b.main,
            color: b.contrastText,
            border: "1px solid transparent",
            "&:hover": { backgroundColor: b.hover },
            "&:active": { backgroundColor: b.active }
          },
          containedSecondary: {
            "&:hover": { backgroundColor: sem.info }
          },
          outlined: {
            borderColor: n.borderStrong,
            color: n.textPrimary,
            "&:hover": {
              backgroundColor: n.surfaceHover,
              borderColor: n.borderStrong
            }
          },
          outlinedPrimary: {
            borderColor: b.border,
            color: b.main,
            "&:hover": { backgroundColor: b.soft, borderColor: b.main }
          },
          text: {
            padding: "7px 12px",
            "&:hover": { backgroundColor: n.surfaceHover }
          },
          textPrimary: {
            color: b.main,
            "&:hover": { backgroundColor: b.soft }
          },
          startIcon: { marginRight: 8 },
          endIcon: { marginLeft: 8 }
        },
        MuiIconButton: {
          root: {
            borderRadius: radius.sm,
            padding: 9,
            color: n.textSecondary,
            "&:hover": { backgroundColor: n.surfaceHover },
            "&.Mui-focusVisible": focusRing
          },
          colorPrimary: {
            color: b.main,
            "&:hover": { backgroundColor: b.soft }
          },
          sizeSmall: { padding: 6 }
        },
        MuiButtonGroup: {
          groupedOutlined: { borderColor: n.border }
        },
        MuiFab: {
          root: { boxShadow: shadows[5], textTransform: "none" }
        },

        // ── campos ──
        MuiOutlinedInput: {
          root: {
            borderRadius: radius.sm,
            backgroundColor: n.surface,
            "& fieldset": {
              borderColor: n.border,
              transition: "border-color .15s ease"
            },
            "&:hover fieldset": { borderColor: n.borderStrong },
            "&.Mui-focused fieldset": { borderColor: b.main, borderWidth: 2 },
            "&.Mui-disabled": { backgroundColor: n.surfaceSunken },
            "&.Mui-error fieldset": { borderColor: sem.danger }
          },
          input: { padding: "11px 14px" },
          inputMarginDense: { paddingTop: 9, paddingBottom: 9 },
          notchedOutline: { borderColor: n.border },
          adornedStart: { paddingLeft: 12 },
          multiline: { padding: "11px 14px" }
        },
        MuiFilledInput: {
          root: {
            borderRadius: radius.sm,
            backgroundColor: n.surfaceSunken,
            "&:hover": { backgroundColor: n.surfaceHover },
            "&.Mui-focused": { backgroundColor: n.surfaceSunken }
          },
          underline: { "&:before, &:after": { display: "none" } }
        },
        MuiInput: {
          // A variante "standard" (sublinhada) ainda aparece em telas antigas.
          // Deixamos o sublinhado discreto em vez de preto sólido.
          underline: {
            "&:before": { borderBottomColor: n.border },
            "&:hover:not(.Mui-disabled):before": {
              borderBottomColor: n.borderStrong
            },
            "&:after": { borderBottomColor: b.main }
          }
        },
        MuiInputBase: {
          root: { fontSize: "0.875rem", color: n.textPrimary },
          input: {
            "&::placeholder": { color: n.textTertiary, opacity: 1 }
          }
        },
        MuiInputLabel: {
          root: {
            fontSize: "0.875rem",
            color: n.textSecondary,
            "&.Mui-focused": { color: b.main }
          }
          // Nada de engrossar o rótulo quando ele sobe para a borda: o
          // Material-UI v4 calcula a largura da greta do contorno a partir do
          // texto ANTES de aplicar o estilo, e o rótulo em negrito passa a
          // não caber no vão, escapando por cima da linha.
        },
        MuiFormLabel: {
          root: { "&.Mui-focused": { color: b.main } }
        },
        MuiFormHelperText: {
          root: { fontSize: "0.75rem", marginLeft: 2, marginTop: 5 },
          contained: { marginLeft: 2, marginRight: 2 }
        },
        MuiSelect: {
          select: { "&:focus": { backgroundColor: "transparent" } },
          icon: { color: n.textTertiary }
        },
        MuiCheckbox: {
          root: { color: n.borderStrong, borderRadius: radius.xs },
          colorPrimary: { "&.Mui-checked": { color: b.main } }
        },
        MuiRadio: {
          root: { color: n.borderStrong },
          colorPrimary: { "&.Mui-checked": { color: b.main } }
        },
        MuiSwitch: {
          switchBase: { "&.Mui-checked + .MuiSwitch-track": { opacity: 1 } },
          colorPrimary: {
            "&.Mui-checked": { color: "#FFFFFF" },
            "&.Mui-checked + .MuiSwitch-track": { backgroundColor: b.main }
          },
          track: { backgroundColor: n.borderStrong, opacity: 1 }
        },
        MuiSlider: {
          thumb: { boxShadow: shadows[2] }
        },

        // ── tabelas ──
        MuiTableContainer: { root: scrollbarStyles },
        MuiTable: { root: { borderCollapse: "separate", borderSpacing: 0 } },
        MuiTableHead: {
          root: {
            "& .MuiTableCell-head": {
              backgroundColor: n.surfaceSunken,
              color: n.textSecondary,
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              borderBottom: `1px solid ${n.border}`,
              paddingTop: 12,
              paddingBottom: 12,
              // O cartão da listagem é que rola; com o cabeçalho grudado no
              // topo a pessoa não perde de vista o nome das colunas ao
              // descer uma lista longa.
              position: "sticky",
              top: 0,
              zIndex: 2
            }
          }
        },
        MuiTableCell: {
          root: {
            borderBottom: `1px solid ${n.border}`,
            padding: "12px 16px",
            fontSize: "0.875rem"
          },
          sizeSmall: { padding: "9px 14px" },
          body: { color: n.textPrimary }
        },
        MuiTableRow: {
          root: {
            transition: "background-color .12s ease",
            "&:hover": { backgroundColor: n.surfaceHover },
            "&:last-child .MuiTableCell-body": { borderBottom: "none" }
          },
          head: { "&:hover": { backgroundColor: "transparent" } }
        },
        MuiTablePagination: {
          toolbar: { minHeight: 52, paddingLeft: 12 },
          caption: { fontSize: "0.8125rem", color: n.textSecondary }
        },

        // ── navegação ──
        MuiAppBar: {
          root: { boxShadow: "none" },
          // Barra superior neutra, não um bloco roxo de ponta a ponta.
          // O roxo rende mais quando aparece no que se clica — item de menu
          // ativo, botão principal, ícone de métrica — do que como faixa de
          // 56px que empurra o contraste de tudo que fica em cima dela.
          colorPrimary: {
            backgroundColor: n.surface,
            color: n.textPrimary,
            borderBottom: `1px solid ${n.border}`
          }
        },
        MuiToolbar: {
          dense: { minHeight: layout.appBarHeight }
        },
        MuiDrawer: {
          paper: {
            backgroundColor: n.surface,
            borderRight: `1px solid ${n.border}`
          },
          paperAnchorDockedLeft: { borderRight: `1px solid ${n.border}` }
        },
        MuiTabs: {
          root: { minHeight: 44 },
          indicator: {
            height: 3,
            borderRadius: `${radius.pill}px ${radius.pill}px 0 0`,
            backgroundColor: b.main
          },
          scrollButtons: { color: n.textSecondary }
        },
        MuiTab: {
          root: {
            minHeight: 44,
            minWidth: 0,
            padding: "10px 18px",
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "none",
            letterSpacing: 0,
            color: n.textSecondary,
            "&:hover": { color: n.textPrimary },
            "&.Mui-selected": { color: b.main }
          },
          textColorPrimary: {
            color: n.textSecondary,
            "&.Mui-selected": { color: b.main }
          }
        },
        MuiBottomNavigation: {
          root: { backgroundColor: n.surface, height: layout.bottomNavHeight }
        },
        MuiBottomNavigationAction: {
          root: {
            color: n.textTertiary,
            minWidth: 0,
            padding: "6px 0",
            "&.Mui-selected": { color: b.main }
          },
          label: {
            fontSize: "0.6875rem",
            fontWeight: 600,
            "&.Mui-selected": { fontSize: "0.6875rem" }
          }
        },

        // ── listas e menus ──
        MuiList: { padding: { paddingTop: 6, paddingBottom: 6 } },
        MuiListItem: {
          root: {
            borderRadius: radius.sm,
            "&.Mui-selected": {
              backgroundColor: b.soft,
              "&:hover": { backgroundColor: b.softHover }
            }
          },
          button: { "&:hover": { backgroundColor: n.surfaceHover } }
        },
        MuiListItemIcon: {
          root: { minWidth: 38, color: n.textSecondary }
        },
        MuiListItemText: {
          primary: { fontSize: "0.875rem" },
          secondary: { fontSize: "0.75rem", color: n.textTertiary }
        },
        MuiListSubheader: {
          root: {
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: n.textTertiary,
            lineHeight: "32px"
          }
        },
        MuiMenu: {
          paper: {
            borderRadius: radius.md,
            border: `1px solid ${n.border}`,
            boxShadow: shadows[6],
            marginTop: 6
          },
          list: { padding: 6 }
        },
        MuiMenuItem: {
          root: {
            borderRadius: radius.xs,
            fontSize: "0.875rem",
            minHeight: 38,
            "&:hover": { backgroundColor: n.surfaceHover },
            "&.Mui-selected": {
              backgroundColor: b.soft,
              "&:hover": { backgroundColor: b.softHover }
            }
          }
        },
        MuiPopover: {
          paper: {
            borderRadius: radius.md,
            border: `1px solid ${n.border}`,
            boxShadow: shadows[6]
          }
        },

        // ── modais ──
        MuiDialog: {
          paper: {
            borderRadius: radius.xl,
            border: `1px solid ${n.border}`,
            boxShadow: shadows[8]
          },
          paperFullScreen: { borderRadius: 0 }
        },
        MuiBackdrop: {
          root: {
            backgroundColor: isDark
              ? "rgba(6, 4, 12, 0.72)"
              : "rgba(26, 22, 38, 0.45)"
          }
        },
        MuiDialogTitle: {
          root: {
            padding: "20px 24px 8px",
            "& .MuiTypography-root": {
              fontSize: "1.0625rem",
              fontWeight: 700,
              letterSpacing: "-0.01em"
            }
          }
        },
        MuiDialogContent: {
          root: { padding: "8px 24px 20px", ...scrollbarStyles }
        },
        MuiDialogActions: {
          root: {
            padding: "14px 24px",
            gap: 8,
            borderTop: `1px solid ${n.border}`
          }
        },

        // ── feedback ──
        MuiTooltip: {
          tooltip: {
            backgroundColor: isDark ? "#3A3350" : "#2A2440",
            color: "#FFFFFF",
            fontSize: "0.75rem",
            fontWeight: 500,
            borderRadius: radius.xs,
            padding: "7px 10px"
          },
          arrow: { color: isDark ? "#3A3350" : "#2A2440" }
        },
        MuiChip: {
          root: {
            borderRadius: radius.xs,
            height: 26,
            fontSize: "0.75rem",
            fontWeight: 600,
            backgroundColor: n.surfaceSunken,
            color: n.textSecondary
          },
          outlined: { borderColor: n.border },
          colorPrimary: { backgroundColor: b.soft, color: b.main },
          deleteIcon: {
            color: "inherit",
            opacity: 0.6,
            "&:hover": { opacity: 1 }
          }
        },
        MuiBadge: {
          badge: {
            fontSize: "0.6875rem",
            fontWeight: 700,
            minWidth: 18,
            height: 18
          }
        },
        MuiAvatar: {
          root: { fontSize: "0.8125rem", fontWeight: 600 },
          colorDefault: { backgroundColor: b.soft, color: b.main }
        },
        MuiLinearProgress: {
          root: {
            height: 6,
            borderRadius: radius.pill,
            backgroundColor: n.surfaceSunken
          },
          bar: { borderRadius: radius.pill }
        },
        MuiSkeleton: {
          root: { backgroundColor: isDark ? "#272134" : "#EDEAF5" },
          text: { borderRadius: radius.xs, transform: "none" }
        },
        MuiAlert: {
          root: {
            borderRadius: radius.md,
            fontSize: "0.875rem",
            alignItems: "center"
          },
          standardSuccess: {
            backgroundColor: sem.successSoft,
            color: sem.success
          },
          standardError: { backgroundColor: sem.dangerSoft, color: sem.danger },
          standardWarning: {
            backgroundColor: sem.warningSoft,
            color: sem.warning
          },
          standardInfo: { backgroundColor: sem.infoSoft, color: sem.info }
        },
        MuiSnackbarContent: {
          root: { borderRadius: radius.md, boxShadow: shadows[6] }
        },
        MuiAccordion: {
          root: {
            border: `1px solid ${n.border}`,
            borderRadius: radius.md,
            boxShadow: "none",
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: "8px 0" }
          }
        },
        MuiAccordionSummary: {
          root: { padding: "0 16px", "&.Mui-expanded": { minHeight: 52 } }
        },
        MuiStepIcon: {
          root: {
            color: n.borderStrong,
            "&.MuiStepIcon-active": { color: b.main }
          }
        },
        MuiPickersDay: {
          daySelected: { backgroundColor: b.main }
        }
      },

      // ───────────────────────────────────────────────────────
      // Extensões que o restante do código já consumia
      // ───────────────────────────────────────────────────────
      scrollbarStyles,
      scrollbarStylesSoft,
      mode,
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      calculatedLogoLight,
      calculatedLogoDark,
      calculatedLogo: () =>
        mode === "light" ? calculatedLogoLight?.() : calculatedLogoDark?.(),

      // atalhos do design system para componentes novos
      tkv: {
        brand: b,
        neutral: n,
        semantic: sem,
        radius,
        layout,
        shadows,
        isDark,
        alpha,
        focusRing
      }
    },
    locale || {}
  );

  return theme;
}
