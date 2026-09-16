import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import QRCode from "qrcode.react";

import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import TextField from "@material-ui/core/TextField";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import PixIcon from "@material-ui/icons/FlashOnRounded";
import CreditCardRoundedIcon from "@material-ui/icons/CreditCardRounded";
import ReceiptRoundedIcon from "@material-ui/icons/ReceiptRounded";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";
import GetAppRoundedIcon from "@material-ui/icons/GetAppRounded";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import BoxLoader from "../ui/BoxLoader";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import { copyToClipboard } from "../../helpers/copyToClipboard";
import { i18n } from "../../translate/i18n";

/**
 * Pagamento da fatura pelo cliente.
 *
 * Três formas, cada uma ligada ou desligada pelo dono da plataforma:
 *   Pix     — cobrança na hora pela Efí (QR Code e copia e cola)
 *   Cartão  — pelo Asaas, com a opção de guardar o cartão e não precisar
 *             pagar de novo todo mês
 *   Boleto  — pelo Asaas, com linha digitável e PDF
 */
const onlyDigits = value => String(value || "").replace(/\D/g, "");

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: { borderRadius: t.radius.xl },
    head: { display: "flex", flexDirection: "column", gap: 2 },
    value: {
      fontSize: "1.75rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    detail: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    methods: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: 10,
      marginBottom: theme.spacing(2)
    },
    method: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "14px 8px",
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      fontSize: "0.875rem",
      fontWeight: 700,
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 24 }
    },
    methodOn: {
      borderColor: t.brand.main,
      color: t.brand.text,
      backgroundColor: t.brand.textSoft,
      boxShadow: `0 0 0 1px ${t.brand.main}`
    },
    form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    full: { gridColumn: "1 / -1" },
    saveRow: {
      gridColumn: "1 / -1",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "8px 12px",
      borderRadius: t.radius.md,
      backgroundColor: t.surfaceSunken
    },
    saveText: { display: "flex", flexDirection: "column" },
    hint: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    center: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(2, 0)
    },
    code: {
      width: "100%",
      padding: 10,
      borderRadius: 10,
      backgroundColor: t.surfaceSunken,
      fontFamily: "monospace",
      fontSize: "0.75rem",
      wordBreak: "break-all",
      maxHeight: 90,
      overflow: "auto"
    },
    saved: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      borderRadius: t.radius.md,
      backgroundColor: t.semantic.successSoft,
      color: t.semantic.success,
      fontWeight: 700,
      marginBottom: theme.spacing(2)
    },
    success: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      padding: theme.spacing(3, 1),
      textAlign: "center",
      "& svg": { fontSize: 56, color: t.semantic.success }
    }
  };
});

const PaymentDialog = ({ open, invoice, onClose, onPaid }) => {
  const classes = useStyles();
  const p = (key, opts) => i18n.t(`payment.${key}`, opts);

  const [methods, setMethods] = useState(null);
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    holderName: "",
    number: "",
    expiry: "",
    ccv: "",
    cpfCnpj: "",
    email: "",
    phone: "",
    postalCode: "",
    addressNumber: ""
  });
  const [saveCard, setSaveCard] = useState(true);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    api
      .get("/subscription/methods")
      .then(({ data }) => {
        setMethods(data);
        setMethod(
          data.pix
            ? "PIX"
            : data.card
              ? "CREDIT_CARD"
              : data.boleto
                ? "BOLETO"
                : ""
        );
      })
      .catch(() => setMethods({ pix: true, card: false, boleto: false }));
  }, [open]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const cardValid = useMemo(() => {
    const [month, year] = form.expiry.split("/");
    return (
      form.holderName.trim().length > 2 &&
      onlyDigits(form.number).length >= 13 &&
      onlyDigits(month || "").length === 2 &&
      (year || "").trim().length >= 2 &&
      onlyDigits(form.ccv).length >= 3 &&
      onlyDigits(form.cpfCnpj).length >= 11 &&
      /\S+@\S+\.\S+/.test(form.email) &&
      onlyDigits(form.postalCode).length === 8 &&
      form.addressNumber.trim().length > 0
    );
  }, [form]);

  const pay = async () => {
    setLoading(true);
    try {
      if (method === "PIX") {
        const { data } = await api.post("/subscription", {
          invoiceId: invoice.id,
          price: String(invoice.value),
          users: "0",
          connections: "0"
        });
        setResult({ method: "PIX", pix: data?.qrcode?.qrcode });
      } else if (method === "BOLETO") {
        const { data } = await api.post("/subscription", {
          method: "BOLETO",
          invoiceId: invoice.id,
          cpfCnpj: onlyDigits(form.cpfCnpj)
        });
        setResult({ method: "BOLETO", ...data });
      } else {
        const [month, year] = form.expiry.split("/");
        const { data } = await api.post("/subscription", {
          method: "CREDIT_CARD",
          invoiceId: invoice.id,
          saveCard,
          cpfCnpj: onlyDigits(form.cpfCnpj),
          creditCard: {
            holderName: form.holderName,
            number: onlyDigits(form.number),
            expiryMonth: onlyDigits(month),
            expiryYear:
              (year || "").trim().length === 2
                ? `20${year.trim()}`
                : (year || "").trim(),
            ccv: onlyDigits(form.ccv)
          },
          creditCardHolderInfo: {
            name: form.holderName,
            email: form.email,
            cpfCnpj: onlyDigits(form.cpfCnpj),
            postalCode: onlyDigits(form.postalCode),
            addressNumber: form.addressNumber,
            phone: onlyDigits(form.phone)
          }
        });
        setResult({ method: "CREDIT_CARD", ...data });
        if (["RECEIVED", "CONFIRMED"].includes(data.status)) {
          toast.success(p("paid"));
          onPaid?.();
        }
      }
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const chargeSavedCard = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/subscription", {
        method: "CREDIT_CARD",
        invoiceId: invoice.id
      });
      setResult({ method: "CREDIT_CARD", ...data });
      if (["RECEIVED", "CONFIRMED"].includes(data.status)) {
        toast.success(p("paid"));
        onPaid?.();
      }
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const removeCard = async () => {
    try {
      await api.delete("/subscription/card");
      setMethods(m => ({ ...m, savedCard: { hasCard: false, label: "" } }));
      toast.success(p("cardRemoved"));
    } catch (err) {
      toastError(err);
    }
  };

  const available = [
    methods?.pix && ["PIX", p("pix"), <PixIcon key="i" />],
    methods?.card && [
      "CREDIT_CARD",
      p("card"),
      <CreditCardRoundedIcon key="i" />
    ],
    methods?.boleto && ["BOLETO", p("boleto"), <ReceiptRoundedIcon key="i" />]
  ].filter(Boolean);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      classes={{ paper: classes.paper }}
    >
      <DialogTitle disableTypography>
        <div className={classes.head}>
          <Typography className={classes.detail}>
            {invoice?.detail || p("title")}
          </Typography>
          <span className={classes.value}>
            {safeValueFormat(invoice?.value, invoice?.currency || "BRL")}
          </span>
        </div>
      </DialogTitle>

      <DialogContent dividers>
        {!methods ? (
          <div className={classes.center}>
            <BoxLoader />
          </div>
        ) : result ? (
          <div className={classes.center}>
            {result.method === "PIX" && result.pix && (
              <>
                <QRCode value={result.pix} size={220} />
                <Typography className={classes.hint}>{p("pixHint")}</Typography>
                <div className={classes.code}>{result.pix}</div>
                <Button
                  startIcon={<FileCopyOutlinedIcon />}
                  onClick={() => {
                    copyToClipboard(result.pix);
                    toast.success(p("copied"));
                  }}
                >
                  {p("copyCode")}
                </Button>
              </>
            )}

            {result.method === "BOLETO" && (
              <>
                <Typography className={classes.hint}>
                  {p("boletoHint")}
                </Typography>
                {result.identificationField && (
                  <>
                    <div className={classes.code}>
                      {result.identificationField}
                    </div>
                    <Button
                      startIcon={<FileCopyOutlinedIcon />}
                      onClick={() => {
                        copyToClipboard(result.identificationField);
                        toast.success(p("copied"));
                      }}
                    >
                      {p("copyLine")}
                    </Button>
                  </>
                )}
                {(result.bankSlipUrl || result.invoiceUrl) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<GetAppRoundedIcon />}
                    href={result.bankSlipUrl || result.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {p("openBoleto")}
                  </Button>
                )}
              </>
            )}

            {result.method === "CREDIT_CARD" && (
              <div className={classes.success}>
                <CheckCircleRoundedIcon />
                <Typography>
                  {["RECEIVED", "CONFIRMED"].includes(result.status)
                    ? p("cardApproved")
                    : p("cardPending")}
                </Typography>
                {result.cardSaved && (
                  <Typography className={classes.hint}>
                    {p("cardSaved", { card: result.cardLabel })}
                  </Typography>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {methods.savedCard?.hasCard && (
              <div className={classes.saved}>
                <CreditCardRoundedIcon />
                <span style={{ flex: 1 }}>
                  {p("autoCharge", { card: methods.savedCard.label })}
                </span>
                <IconButton
                  size="small"
                  onClick={removeCard}
                  aria-label={p("removeCard")}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </div>
            )}

            {available.length === 0 ? (
              <Typography className={classes.hint}>{p("noMethods")}</Typography>
            ) : (
              <div className={classes.methods}>
                {available.map(([key, label, icon]) => (
                  <ButtonBase
                    key={key}
                    className={`${classes.method}${method === key ? ` ${classes.methodOn}` : ""}`}
                    onClick={() => setMethod(key)}
                  >
                    {icon}
                    {label}
                  </ButtonBase>
                ))}
              </div>
            )}

            {method === "PIX" && (
              <Typography className={classes.hint}>{p("pixIntro")}</Typography>
            )}

            {method === "BOLETO" && (
              <div className={classes.form}>
                <Typography className={`${classes.hint} ${classes.full}`}>
                  {p("boletoIntro")}
                </Typography>
                <TextField
                  className={classes.full}
                  label={p("form.cpfCnpj")}
                  variant="outlined"
                  size="small"
                  value={form.cpfCnpj}
                  onChange={e => set("cpfCnpj", e.target.value)}
                />
              </div>
            )}

            {method === "CREDIT_CARD" && !methods.savedCard?.hasCard && (
              <div className={classes.form}>
                <Typography className={`${classes.hint} ${classes.full}`}>
                  {p("cardIntro")}
                </Typography>
                <TextField
                  className={classes.full}
                  label={p("form.holder")}
                  variant="outlined"
                  size="small"
                  value={form.holderName}
                  onChange={e => set("holderName", e.target.value)}
                />
                <TextField
                  className={classes.full}
                  label={p("form.number")}
                  variant="outlined"
                  size="small"
                  value={form.number}
                  onChange={e => set("number", e.target.value)}
                  inputProps={{ inputMode: "numeric" }}
                />
                <TextField
                  label={p("form.expiry")}
                  placeholder="12/2030"
                  variant="outlined"
                  size="small"
                  value={form.expiry}
                  onChange={e => set("expiry", e.target.value)}
                />
                <TextField
                  label={p("form.ccv")}
                  variant="outlined"
                  size="small"
                  value={form.ccv}
                  onChange={e => set("ccv", e.target.value)}
                  inputProps={{ inputMode: "numeric" }}
                />
                <TextField
                  label={p("form.cpfCnpj")}
                  variant="outlined"
                  size="small"
                  value={form.cpfCnpj}
                  onChange={e => set("cpfCnpj", e.target.value)}
                />
                <TextField
                  label={p("form.phone")}
                  variant="outlined"
                  size="small"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                />
                <TextField
                  className={classes.full}
                  label={p("form.email")}
                  variant="outlined"
                  size="small"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                />
                <TextField
                  label={p("form.postalCode")}
                  variant="outlined"
                  size="small"
                  value={form.postalCode}
                  onChange={e => set("postalCode", e.target.value)}
                />
                <TextField
                  label={p("form.addressNumber")}
                  variant="outlined"
                  size="small"
                  value={form.addressNumber}
                  onChange={e => set("addressNumber", e.target.value)}
                />
                <div className={classes.saveRow}>
                  <span className={classes.saveText}>
                    <span>{p("saveCard")}</span>
                    <span className={classes.hint}>{p("saveCardHint")}</span>
                  </span>
                  <Switch
                    color="primary"
                    checked={saveCard}
                    onChange={e => setSaveCard(e.target.checked)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{i18n.t("common.close")}</Button>
        {!result && available.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            disabled={
              loading ||
              (method === "CREDIT_CARD" &&
                !methods?.savedCard?.hasCard &&
                !cardValid) ||
              (method === "BOLETO" && onlyDigits(form.cpfCnpj).length < 11)
            }
            onClick={
              method === "CREDIT_CARD" && methods?.savedCard?.hasCard
                ? chargeSavedCard
                : pay
            }
          >
            {loading ? p("processing") : p("payNow")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;
