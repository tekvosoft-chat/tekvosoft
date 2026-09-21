import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import EditRoundedIcon from "@material-ui/icons/EditRounded";
import moment from "moment";

import api from "../../services/api";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import CardBrand, { lastDigitsOf } from "../Financeiro/CardBrand";

/**
 * Pagamentos de uma empresa, dentro da própria empresa em "Clientes" (o
 * que antes ficava na aba Recebimentos): plano e valor, vencimento, como
 * ela paga, endereço de cobrança e as últimas faturas.
 */
const RECURRENCE = {
  MENSAL: "mensal",
  BIMESTRAL: "bimestral",
  TRIMESTRAL: "trimestral",
  SEMESTRAL: "semestral",
  ANUAL: "anual"
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const sem = t.semantic;
  return {
    root: {
      padding: theme.spacing(2, 2, 0.5),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1.5, 1.5, 0) }
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: theme.spacing(1.25),
      [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
      },
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "minmax(0, 1fr)"
      }
    },
    box: {
      minWidth: 0,
      padding: theme.spacing(1.5, 1.75),
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surfaceSunken
    },
    label: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    value: {
      marginTop: 4,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: "1rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    sub: {
      marginTop: 2,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    brand: {
      flex: "none",
      width: 40,
      height: 28,
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#141414",
      transform: "scale(.85)",
      transformOrigin: "left center"
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      height: 22,
      padding: "0 8px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap"
    },
    ok: { color: sem.success, backgroundColor: sem.successSoft },
    soon: { color: sem.warning, backgroundColor: sem.warningSoft },
    late: { color: sem.danger, backgroundColor: sem.dangerSoft },
    neutral: { color: t.brand.text, backgroundColor: t.brand.textSoft },
    head: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing(1),
      margin: theme.spacing(2, 0, 0.5),
      flexWrap: "wrap"
    },
    title: {
      fontSize: "0.875rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    editBtn: {
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700
    },
    rows: { display: "flex", flexDirection: "column" },
    row: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto auto",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(1, 0.25),
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      "& + &": { borderTop: `1px solid ${t.border}` },
      [theme.breakpoints.down("xs")]: { gap: theme.spacing(1) }
    },
    rowMain: { minWidth: 0 },
    rowTitle: {
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    rowSub: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    money: { fontWeight: 700, whiteSpace: "nowrap" },
    more: {
      width: "100%",
      minHeight: 36,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: t.brand.text
    },
    empty: {
      padding: theme.spacing(1, 0.25),
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    }
  };
});

const dueChip = (classes, dueDate) => {
  if (!dueDate) return null;
  const days = moment(dueDate)
    .startOf("day")
    .diff(moment().startOf("day"), "days");
  if (days < 0)
    return [classes.late, `vencida há ${-days} dia${days === -1 ? "" : "s"}`];
  if (days === 0) return [classes.soon, "vence hoje"];
  if (days <= 7)
    return [classes.soon, `em ${days} dia${days === 1 ? "" : "s"}`];
  return [classes.ok, `em ${days} dias`];
};

const invoiceChip = (classes, invoice) => {
  if (invoice.status === "paid") return [classes.ok, "Paga"];
  const days = moment(invoice.dueDate)
    .startOf("day")
    .diff(moment().startOf("day"), "days");
  if (days < 0) return [classes.late, "Vencida"];
  if (days <= 3) return [classes.soon, "Vence logo"];
  return [classes.neutral, "Em aberto"];
};

const CompanyBilling = ({ companyId, refreshKey, onEdit }) => {
  const classes = useStyles();
  const [data, setData] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get(`/super/companies/${companyId}/billing`)
      .then(({ data: result }) => alive && setData(result))
      .catch(() => alive && setData({ invoices: [] }));
    return () => {
      alive = false;
    };
  }, [companyId, refreshKey]);

  if (!data) return null;

  const plan = data.plan;
  const currency = plan?.currency || "BRL";
  const due = dueChip(classes, data.dueDate);
  const card = data.card;
  const address = data.address;
  const invoices = data.invoices || [];
  const visible = showAll ? invoices : invoices.slice(0, 4);

  return (
    <div className={classes.root}>
      <div className={classes.grid}>
        <div className={classes.box}>
          <div className={classes.label}>Plano</div>
          <div className={classes.value}>{plan?.name || "Sem plano"}</div>
          <div className={classes.sub}>
            {plan
              ? `${safeValueFormat(plan.value, currency)} · ${
                  RECURRENCE[data.recurrence] || "mensal"
                }`
              : "—"}
          </div>
        </div>

        <div className={classes.box}>
          <div className={classes.label}>Próximo vencimento</div>
          <div className={classes.value}>
            {data.dueDate ? moment(data.dueDate).format("DD/MM/YYYY") : "—"}
            {due && (
              <span className={`${classes.chip} ${due[0]}`}>{due[1]}</span>
            )}
          </div>
          <div className={classes.sub}>
            {data.status === false ? "Empresa bloqueada" : "Empresa ativa"}
          </div>
        </div>

        <div className={classes.box}>
          <div className={classes.label}>Cobrança</div>
          {card?.hasCard ? (
            <>
              <div className={classes.value}>
                <span className={classes.brand}>
                  <CardBrand label={card.label} />
                </span>
                •••• {lastDigitsOf(card.label)}
              </div>
              <div className={classes.sub}>
                {card.autoRenew
                  ? "Renova sozinho no cartão"
                  : "Renovação automática pausada"}
                {card.expiry ? ` · validade ${card.expiry}` : ""}
              </div>
            </>
          ) : (
            <>
              <div className={classes.value}>Manual</div>
              <div className={classes.sub}>Pix ou boleto a cada fatura</div>
            </>
          )}
        </div>

        <div className={classes.box}>
          <div className={classes.label}>Endereço de cobrança</div>
          {address?.postalCode ? (
            <>
              <div className={classes.value}>
                {[address.street, address.number].filter(Boolean).join(", ") ||
                  `CEP ${address.postalCode}`}
              </div>
              <div className={classes.sub}>
                {[address.city, address.state].filter(Boolean).join("/") ||
                  address.postalCode}
              </div>
            </>
          ) : (
            <>
              <div className={classes.value}>—</div>
              <div className={classes.sub}>Não informado</div>
            </>
          )}
        </div>
      </div>

      <div className={classes.head}>
        <span className={classes.title}>Faturas</span>
        {onEdit && (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            className={classes.editBtn}
            startIcon={<EditRoundedIcon />}
            onClick={() => onEdit(companyId)}
          >
            Editar empresa e plano
          </Button>
        )}
      </div>
      {invoices.length === 0 ? (
        <div className={classes.empty}>Nenhuma fatura ainda.</div>
      ) : (
        <div className={classes.rows}>
          {visible.map(invoice => {
            const [tone, label] = invoiceChip(classes, invoice);
            return (
              <div key={invoice.id} className={classes.row}>
                <div className={classes.rowMain}>
                  <div className={classes.rowTitle}>
                    {String(invoice.detail || "Mensalidade").split(" - ")[0]}
                  </div>
                  <div className={classes.rowSub}>
                    #{invoice.id} · vence{" "}
                    {moment(invoice.dueDate).format("DD/MM/YYYY")}
                  </div>
                </div>
                <span className={classes.money}>
                  {safeValueFormat(invoice.value, invoice.currency || currency)}
                </span>
                <span className={`${classes.chip} ${tone}`}>{label}</span>
              </div>
            );
          })}
          {invoices.length > 4 && (
            <ButtonBase
              className={classes.more}
              onClick={() => setShowAll(v => !v)}
            >
              {showAll ? "Ver menos" : `Ver todas (${invoices.length})`}
            </ButtonBase>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyBilling;
