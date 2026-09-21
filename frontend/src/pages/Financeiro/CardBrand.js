import React from "react";
import CreditCardRoundedIcon from "@material-ui/icons/CreditCardRounded";

/**
 * Logo da bandeira do cartão salvo, desenhado aqui mesmo (sem imagem de
 * terceiro). A bandeira vem do rótulo gravado no pagamento: "VISA •••• 1234".
 */
export const brandOf = label =>
  String(label || "")
    .split("•")[0]
    .trim()
    .toLowerCase();

export const lastDigitsOf = label => {
  const match = String(label || "").match(/(\d{4})\s*$/);
  return match ? match[1] : "";
};

const text = (value, style) => (
  <span
    style={{
      fontWeight: 800,
      fontSize: 13,
      letterSpacing: 0.5,
      color: "#FFFFFF",
      ...style
    }}
  >
    {value}
  </span>
);

const CardBrand = ({ label }) => {
  const brand = brandOf(label);
  if (brand.includes("master")) {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22" aria-label="Mastercard">
        <circle cx="12" cy="11" r="10" fill="#EB001B" />
        <circle cx="22" cy="11" r="10" fill="#F79E1B" />
        <path
          d="M17 2.3a10 10 0 0 1 0 17.4 10 10 0 0 1 0-17.4z"
          fill="#FF5F00"
        />
      </svg>
    );
  }
  if (brand.includes("visa")) return text("VISA", { fontStyle: "italic" });
  if (brand.includes("elo")) return text("elo", { fontSize: 15 });
  if (brand.includes("amex") || brand.includes("american"))
    return text("AMEX", { color: "#2E77BC" });
  if (brand.includes("hiper")) return text("HIPER", { color: "#E4002B" });
  return <CreditCardRoundedIcon style={{ color: "#FFFFFF" }} />;
};

export default CardBrand;
