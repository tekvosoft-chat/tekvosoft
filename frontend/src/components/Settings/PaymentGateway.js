import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Switch from "@material-ui/core/Switch";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import Collapse from "@material-ui/core/Collapse";
import FlashOnRoundedIcon from "@material-ui/icons/FlashOnRounded";
import CreditCardRoundedIcon from "@material-ui/icons/CreditCardRounded";
import ReceiptRoundedIcon from "@material-ui/icons/ReceiptRounded";

import useSettings from "../../hooks/useSettings";
import EfiSettings from "../PaymentGateways/Efi/EfiSettings";
import { getBackendURL } from "../../services/config";
import { i18n } from "../../translate/i18n";

/**
 * Formas de pagamento da plataforma (só o super admin vê).
 *
 * Pix é pela Efí; cartão de crédito e boleto são pelo Asaas. Cada forma tem
 * um botão de ligar/desligar — o cliente só enxerga no pagamento o que
 * estiver ligado aqui. Abaixo de cada uma fica a explicação de como ela
 * funciona e o que precisa ser preenchido.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: { display: "flex", flexDirection: "column", gap: theme.spacing(2) },
    intro: { fontSize: "0.9375rem", color: theme.palette.text.secondary },
    card: {
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden"
    },
    head: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: theme.spacing(2)
    },
    icon: {
      flex: "none",
      width: 44,
      height: 44,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#FFFFFF",
      "& svg": { fontSize: 24 }
    },
    texts: { flex: 1, minWidth: 0 },
    title: {
      fontSize: "1rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    provider: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    body: {
      padding: theme.spacing(0, 2, 2),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5)
    },
    how: {
      padding: theme.spacing(1.5),
      borderRadius: t.radius.md,
      backgroundColor: t.surfaceSunken,
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary,
      "& b": { color: theme.palette.text.primary },
      "& ol": { margin: "6px 0 0", paddingLeft: 18 },
      "& li": { marginBottom: 2 }
    },
    fields: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 12
    },
    webhook: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary,
      "& code": {
        padding: "6px 8px",
        borderRadius: 6,
        backgroundColor: t.surfaceSunken,
        color: theme.palette.text.primary,
        fontSize: "0.75rem",
        wordBreak: "break-all"
      }
    }
  };
});

const Method = ({
  classes,
  icon,
  color,
  title,
  provider,
  enabled,
  onToggle,
  children
}) => (
  <div className={classes.card}>
    <div className={classes.head}>
      <span className={classes.icon} style={{ backgroundColor: color }}>
        {icon}
      </span>
      <div className={classes.texts}>
        <div className={classes.title}>{title}</div>
        <div className={classes.provider}>{provider}</div>
      </div>
      <Switch color="primary" checked={enabled} onChange={onToggle} />
    </div>
    <Collapse in={enabled} unmountOnExit>
      <div className={classes.body}>{children}</div>
    </Collapse>
  </div>
);

export default function PaymentGateway({ settings }) {
  const classes = useStyles();
  const { update } = useSettings();
  const p = key => i18n.t(`paymentGateways.${key}`);
  // lista de passos de cada forma de pagamento (vem das traduções)
  const steps = key =>
    i18n.t(`paymentGateways.${key}`, { returnObjects: true }) || [];

  const [values, setValues] = useState({
    pix: true,
    card: false,
    boleto: false,
    asaasApiKey: "",
    asaasEnv: "sandbox",
    asaasWebhookToken: ""
  });

  useEffect(() => {
    if (!Array.isArray(settings)) return;
    const get = key => settings.find(s => s.key === key)?.value;
    setValues({
      pix: get("_pixEnabled") !== "disabled",
      card: get("_cardEnabled") === "enabled",
      boleto: get("_boletoEnabled") === "enabled",
      asaasApiKey: get("_asaasApiKey") || "",
      asaasEnv: get("_asaasEnv") || "sandbox",
      asaasWebhookToken: get("_asaasWebhookToken") || ""
    });
  }, [settings]);

  const save = async (key, value) => {
    await update({ key, value });
    toast.success(i18n.t("settings.success"));
  };

  const toggle = (field, key) => async (_, checked) => {
    setValues(v => ({ ...v, [field]: checked }));
    await save(key, checked ? "enabled" : "disabled");
    // o Pix continua saindo pela Efí: mantém o gateway antigo coerente
    if (field === "pix")
      await update({ key: "_paymentGateway", value: checked ? "efi" : "" });
  };

  const setField = (field, key) => event => {
    const { value } = event.target;
    setValues(v => ({ ...v, [field]: value }));
    if (event.type === "change" && field === "asaasEnv") save(key, value);
  };

  const asaasWebhookUrl = `${getBackendURL()}/subscription/asaas/webhook`;

  return (
    <div className={classes.root}>
      <Typography className={classes.intro}>{p("intro")}</Typography>

      <Method
        classes={classes}
        color="#32BCAD"
        icon={<FlashOnRoundedIcon />}
        title={p("pix.title")}
        provider={p("pix.provider")}
        enabled={values.pix}
        onToggle={toggle("pix", "_pixEnabled")}
      >
        <How classes={classes} text={p("pix.how")} steps={steps("pix.steps")} />
        <EfiSettings settings={settings} />
      </Method>

      <Method
        classes={classes}
        color="#4B6FFF"
        icon={<CreditCardRoundedIcon />}
        title={p("card.title")}
        provider={p("card.provider")}
        enabled={values.card}
        onToggle={toggle("card", "_cardEnabled")}
      >
        <How
          classes={classes}
          text={p("card.how")}
          steps={steps("card.steps")}
        />
        <AsaasFields
          classes={classes}
          values={values}
          setField={setField}
          save={save}
          webhookUrl={asaasWebhookUrl}
          p={p}
        />
      </Method>

      <Method
        classes={classes}
        color="#F59E0B"
        icon={<ReceiptRoundedIcon />}
        title={p("boleto.title")}
        provider={p("boleto.provider")}
        enabled={values.boleto}
        onToggle={toggle("boleto", "_boletoEnabled")}
      >
        <How
          classes={classes}
          text={p("boleto.how")}
          steps={steps("boleto.steps")}
        />
        <AsaasFields
          classes={classes}
          values={values}
          setField={setField}
          save={save}
          webhookUrl={asaasWebhookUrl}
          p={p}
        />
      </Method>
    </div>
  );
}

// explicação de como a forma de pagamento funciona, em passos
const How = ({ classes, text, steps }) => (
  <div className={classes.how}>
    {text}
    {Array.isArray(steps) && steps.length > 0 && (
      <ol>
        {steps.map(step => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    )}
  </div>
);

// os campos do Asaas aparecem no cartão e no boleto (é a mesma conta)
const AsaasFields = ({ classes, values, setField, save, webhookUrl, p }) => (
  <>
    <div className={classes.fields}>
      <TextField
        label={p("asaas.key")}
        variant="outlined"
        size="small"
        type="password"
        value={values.asaasApiKey}
        onChange={setField("asaasApiKey", "_asaasApiKey")}
        onBlur={() => save("_asaasApiKey", values.asaasApiKey.trim())}
      />
      <TextField
        select
        label={p("asaas.env")}
        variant="outlined"
        size="small"
        value={values.asaasEnv}
        onChange={event => {
          setField("asaasEnv", "_asaasEnv")(event);
          save("_asaasEnv", event.target.value);
        }}
      >
        <MenuItem value="sandbox">{p("asaas.sandbox")}</MenuItem>
        <MenuItem value="production">{p("asaas.production")}</MenuItem>
      </TextField>
      <TextField
        label={p("asaas.webhookToken")}
        variant="outlined"
        size="small"
        value={values.asaasWebhookToken}
        onChange={setField("asaasWebhookToken", "_asaasWebhookToken")}
        onBlur={() =>
          save("_asaasWebhookToken", values.asaasWebhookToken.trim())
        }
      />
    </div>
    <div className={classes.webhook}>
      <span>{p("asaas.webhookUrl")}</span>
      <code>{webhookUrl}</code>
    </div>
  </>
);
