import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis
} from "recharts";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import InputBase from "@material-ui/core/InputBase";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import CreditCardRoundedIcon from "@material-ui/icons/CreditCardRounded";
import EventRepeatIcon from "@material-ui/icons/EventRounded";
import TrendingUpRoundedIcon from "@material-ui/icons/TrendingUpRounded";
import ErrorOutlineRoundedIcon from "@material-ui/icons/ErrorOutlineRounded";
import AutorenewRoundedIcon from "@material-ui/icons/AutorenewRounded";

import api from "../../services/api";
import PageLoader from "../../components/ui/PageLoader";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import { i18n } from "../../translate/i18n";

/**
 * Recebimentos: quando cada cliente paga de novo.
 *
 * Mostra o previsto do mês, o que vence nos próximos 30 dias, o que está
 * atrasado e, empresa por empresa, a data do próximo vencimento, o valor do
 * plano e se a cobrança sai sozinha no cartão salvo.
 */
const money = value => safeValueFormat(value || 0, "BRL");

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const sem = t.semantic;
  return {
    root: { display: "flex", flexDirection: "column", gap: theme.spacing(2.5) },
    tiles: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "repeat(2, 1fr)" }
    },
    card: {
      padding: theme.spacing(2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      animation: "$rise .35s ease both"
    },
    head: { display: "flex", alignItems: "center", gap: 10 },
    icon: {
      flex: "none",
      width: 36,
      height: 36,
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#FFFFFF",
      backgroundColor: "var(--tone)",
      "& svg": { fontSize: 20 }
    },
    label: {
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    value: {
      marginTop: 10,
      fontSize: "1.5rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    sub: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    sectionTitle: {
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    chartCard: {
      padding: theme.spacing(2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface
    },
    search: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 40,
      minWidth: 240,
      padding: "0 14px",
      borderRadius: 999,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      color: theme.palette.text.secondary
    },
    listHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12
    },
    rows: { display: "flex", flexDirection: "column", gap: 8 },
    row: {
      display: "grid",
      gridTemplateColumns: "minmax(180px, 1.5fr) repeat(4, minmax(110px, 1fr))",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.5, 2),
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      animation: "$rise .3s ease both",
      [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr 1fr",
        rowGap: 8
      }
    },
    name: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    plan: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    cell: { display: "flex", flexDirection: "column", gap: 2 },
    cellLabel: { fontSize: "0.6875rem", color: theme.palette.text.secondary },
    cellValue: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      fontVariantNumeric: "tabular-nums"
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 9px",
      borderRadius: 999,
      fontSize: "0.6875rem",
      fontWeight: 700,
      "& svg": { fontSize: 14 }
    },
    ok: { backgroundColor: sem.successSoft, color: sem.success },
    soon: { backgroundColor: sem.warningSoft, color: sem.warning },
    late: { backgroundColor: sem.dangerSoft, color: sem.danger },
    manual: {
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary
    },
    empty: {
      padding: theme.spacing(4),
      textAlign: "center",
      color: theme.palette.text.secondary
    },
    center: { display: "flex", justifyContent: "center", padding: 40 },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(8px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const Revenue = () => {
  const classes = useStyles();
  const theme = useTheme();
  const accents = theme.palette.tkv.accents || [];
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const r = (key, opts) => i18n.t(`revenue.${key}`, opts);

  const load = useCallback(() => {
    api
      .get("/super/revenue")
      .then(({ data: result }) => setData(result))
      .catch(() => setData({ companies: [], forecast: [], totals: {} }));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const companies = useMemo(() => {
    const list = data?.companies || [];
    const q = query.trim().toLowerCase();
    return q ? list.filter(c => c.name.toLowerCase().includes(q)) : list;
  }, [data, query]);

  const forecast = (data?.forecast || []).map(item => ({
    ...item,
    label: moment(`${item.month}-01`).format("MMM/YY")
  }));

  if (!data) {
    return <PageLoader />;
  }

  const totals = data.totals || {};
  const tiles = [
    {
      icon: <AutorenewRoundedIcon />,
      label: r("monthly"),
      value: money(totals.monthly),
      sub: r("monthlySub", { count: totals.companies || 0 })
    },
    {
      icon: <EventRepeatIcon />,
      label: r("next30"),
      value: money(totals.next30),
      sub: r("next30Sub")
    },
    {
      icon: <ErrorOutlineRoundedIcon />,
      label: r("overdue"),
      value: money(totals.overdue),
      sub: r("overdueSub", { count: totals.overdueCompanies || 0 })
    },
    {
      icon: <CreditCardRoundedIcon />,
      label: r("autoCharge"),
      value: totals.autoCharge || 0,
      sub: r("autoChargeSub")
    }
  ];

  return (
    <div className={classes.root}>
      <div className={classes.tiles}>
        {tiles.map((tile, index) => (
          <div
            key={tile.label}
            className={classes.card}
            style={{
              "--tone": accents[index % accents.length],
              animationDelay: `${index * 40}ms`
            }}
          >
            <div className={classes.head}>
              <span className={classes.icon}>{tile.icon}</span>
              <span className={classes.label}>{tile.label}</span>
            </div>
            <div className={classes.value}>{tile.value}</div>
            <div className={classes.sub}>{tile.sub}</div>
          </div>
        ))}
      </div>

      <div className={classes.chartCard}>
        <Typography className={classes.sectionTitle}>
          {r("forecast")}
        </Typography>
        <div style={{ height: 230, marginTop: 8 }}>
          <ResponsiveContainer>
            <BarChart
              data={forecast}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.tkv.border}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => money(v)}
                width={90}
              />
              <ChartTooltip
                formatter={v => money(v)}
                contentStyle={{
                  borderRadius: 10,
                  border: `1px solid ${theme.palette.tkv.border}`,
                  background: theme.palette.tkv.surface
                }}
              />
              <Bar
                dataKey="value"
                name={r("expected")}
                fill={theme.palette.tkv.brand.main}
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={classes.listHead}>
        <Typography className={classes.sectionTitle}>{r("clients")}</Typography>
        <div className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <InputBase
            fullWidth
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={r("search")}
          />
        </div>
      </div>

      {companies.length === 0 ? (
        <div className={classes.empty}>{r("empty")}</div>
      ) : (
        <div className={classes.rows}>
          {companies.map((company, index) => {
            const days = company.daysToDue;
            const tone =
              days === null
                ? classes.manual
                : days < 0
                  ? classes.late
                  : days <= 7
                    ? classes.soon
                    : classes.ok;
            return (
              <div
                key={company.id}
                className={classes.row}
                style={{ animationDelay: `${Math.min(index, 10) * 25}ms` }}
              >
                <div>
                  <div className={classes.name}>{company.name}</div>
                  <div className={classes.plan}>
                    {company.plan || r("noPlan")} ·{" "}
                    {r(`recurrence.${company.recurrence}`, {
                      defaultValue: company.recurrence
                    })}
                  </div>
                </div>
                <div className={classes.cell}>
                  <span className={classes.cellLabel}>{r("value")}</span>
                  <span className={classes.cellValue}>
                    {money(company.value)}
                  </span>
                </div>
                <div className={classes.cell}>
                  <span className={classes.cellLabel}>{r("nextDue")}</span>
                  <span className={classes.cellValue}>
                    {company.dueDate
                      ? moment(company.dueDate).format("DD/MM/YYYY")
                      : "—"}
                  </span>
                </div>
                <div className={classes.cell}>
                  <span className={classes.cellLabel}>{r("status")}</span>
                  <span className={`${classes.chip} ${tone}`}>
                    {days === null
                      ? r("noDate")
                      : days < 0
                        ? r("lateBy", { count: Math.abs(days) })
                        : days === 0
                          ? r("today")
                          : r("inDays", { count: days })}
                  </span>
                </div>
                <div className={classes.cell}>
                  <span className={classes.cellLabel}>{r("charge")}</span>
                  <span
                    className={`${classes.chip} ${company.autoCharge ? classes.ok : classes.manual}`}
                  >
                    {company.autoCharge ? (
                      <>
                        <CreditCardRoundedIcon />
                        {company.cardLabel || r("auto")}
                      </>
                    ) : (
                      <>
                        <TrendingUpRoundedIcon />
                        {r("manualCharge")}
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Revenue;
