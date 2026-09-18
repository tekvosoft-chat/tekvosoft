import React from "react";
import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";

/**
 * Cartão de crédito desenhado na tela.
 *
 * Vai preenchendo conforme a pessoa digita e vira para o verso quando ela
 * chega no código de segurança — assim fica claro onde cada número entra.
 */
const BRANDS = [
  { id: "visa", label: "VISA", test: /^4/, tone: ["#1A1F71", "#3C4CAD"] },
  {
    id: "mastercard",
    label: "Mastercard",
    test: /^(5[1-5]|2[2-7])/,
    tone: ["#1C1C1C", "#4A3220"]
  },
  { id: "amex", label: "AMEX", test: /^3[47]/, tone: ["#0F5C8C", "#1C8FC7"] },
  {
    id: "elo",
    label: "Elo",
    test: /^(4011|4312|4389|5041|5066|5090|6277|6362|6363|650|651|655)/,
    tone: ["#111111", "#3E1F1F"]
  },
  {
    id: "hipercard",
    label: "Hipercard",
    test: /^(606282|3841)/,
    tone: ["#7A0C17", "#B4222F"]
  },
  {
    id: "diners",
    label: "Diners",
    test: /^3(0[0-5]|[68])/,
    tone: ["#12324A", "#2E6B8F"]
  }
];

export const brandOf = number => {
  const digits = String(number || "").replace(/\D/g, "");
  return BRANDS.find(brand => brand.test.test(digits)) || null;
};

/** 4 4 4 4 (ou 4 6 5 no Amex), no jeito que aparece no cartão. */
export const formatCardNumber = value => {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 19);
  const amex = /^3[47]/.test(digits);
  const groups = amex ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const parts = [];
  let rest = digits;
  groups.forEach(size => {
    if (!rest) return;
    parts.push(rest.slice(0, size));
    rest = rest.slice(size);
  });
  return parts.join(" ").trim();
};

/** Digita só números e o barra entra sozinho: 12/2030. */
export const formatExpiry = value => {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const useStyles = makeStyles(theme => ({
  scene: {
    perspective: 1200,
    width: "100%",
    maxWidth: 340,
    margin: "0 auto",
    marginBottom: theme.spacing(2)
  },
  card: {
    position: "relative",
    width: "100%",
    paddingTop: "61%",
    transformStyle: "preserve-3d",
    transition: "transform .55s cubic-bezier(.4, .2, .2, 1)"
  },
  flipped: { transform: "rotateY(180deg)" },
  face: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
    color: "#FFFFFF",
    backfaceVisibility: "hidden",
    background: "linear-gradient(135deg, #22252C 0%, #3A3F4B 100%)",
    boxShadow: "0 18px 40px -22px rgba(9, 12, 20, 0.9)",
    transition: "background .5s ease",
    overflow: "hidden",
    "&::after": {
      content: "''",
      position: "absolute",
      right: -50,
      top: -70,
      width: 180,
      height: 180,
      borderRadius: "50%",
      background: "rgba(255, 255, 255, 0.07)"
    }
  },
  back: { transform: "rotateY(180deg)", justifyContent: "flex-start" },
  topRow: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  chip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    background: "linear-gradient(135deg, #E9C777 0%, #B98F3C 100%)",
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.25)"
  },
  brand: {
    fontSize: "0.8125rem",
    fontWeight: 800,
    letterSpacing: "0.04em",
    opacity: 0.95
  },
  number: {
    position: "relative",
    zIndex: 1,
    fontSize: "1.125rem",
    fontWeight: 600,
    letterSpacing: "0.09em",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    [theme.breakpoints.down("xs")]: { fontSize: "1rem" }
  },
  digit: {
    display: "inline-block",
    animation: "$digitIn .22s ease-out both"
  },
  bottomRow: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12
  },
  label: {
    fontSize: "0.5625rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    opacity: 0.6
  },
  fieldValue: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 190
  },
  stripe: {
    height: 40,
    margin: "6px -18px 16px",
    backgroundColor: "rgba(0, 0, 0, 0.72)"
  },
  ccvRow: { position: "relative", zIndex: 1, display: "flex", gap: 10 },
  ccvBox: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    color: "#1A1C22",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 10px",
    fontWeight: 700,
    letterSpacing: "0.18em"
  },
  focus: {
    boxShadow: "inset 0 0 0 2px rgba(255, 255, 255, 0.45)",
    borderRadius: 6
  },
  "@keyframes digitIn": {
    from: { opacity: 0, transform: "translateY(-4px)" },
    to: { opacity: 1, transform: "none" }
  }
}));

const CardPreview = ({ number, holder, expiry, ccv, flipped, focus }) => {
  const classes = useStyles();
  const brand = brandOf(number);
  const shown = formatCardNumber(number);
  const mask = /^3[47]/.test(String(number || "").replace(/\D/g, ""))
    ? "•••• •••••• •••••"
    : "•••• •••• •••• ••••";
  const display = shown + mask.slice(shown.length);
  const t = key => i18n.t(`payment.cardPreview.${key}`);

  return (
    <div className={classes.scene} aria-hidden="true">
      <div className={`${classes.card}${flipped ? ` ${classes.flipped}` : ""}`}>
        <div
          className={classes.face}
          style={
            brand
              ? {
                  background: `linear-gradient(135deg, ${brand.tone[0]} 0%, ${brand.tone[1]} 100%)`
                }
              : undefined
          }
        >
          <div className={classes.topRow}>
            <span className={classes.chip} />
            <span className={classes.brand}>{brand?.label || ""}</span>
          </div>
          <div
            className={`${classes.number}${focus === "number" ? ` ${classes.focus}` : ""}`}
          >
            {display.split("").map((char, index) => (
              <span
                // a posição é o que identifica o dígito nesta linha fixa
                // eslint-disable-next-line react/no-array-index-key
                key={`${index}-${char}`}
                className={
                  char === "•" || char === " " ? undefined : classes.digit
                }
              >
                {char}
              </span>
            ))}
          </div>
          <div className={classes.bottomRow}>
            <div
              className={focus === "holder" ? classes.focus : undefined}
              style={{ minWidth: 0 }}
            >
              <div className={classes.label}>{t("holder")}</div>
              <div className={classes.fieldValue}>
                {holder || t("holderPlaceholder")}
              </div>
            </div>
            <div className={focus === "expiry" ? classes.focus : undefined}>
              <div className={classes.label}>{t("expiry")}</div>
              <div className={classes.fieldValue}>{expiry || "MM/AAAA"}</div>
            </div>
          </div>
        </div>

        <div
          className={`${classes.face} ${classes.back}`}
          style={
            brand
              ? {
                  background: `linear-gradient(135deg, ${brand.tone[0]} 0%, ${brand.tone[1]} 100%)`
                }
              : undefined
          }
        >
          <div className={classes.stripe} />
          <div className={classes.ccvRow}>
            <span className={classes.label} style={{ alignSelf: "center" }}>
              {t("ccv")}
            </span>
            <span className={classes.ccvBox}>
              {"•".repeat(String(ccv || "").length) || "•••"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
