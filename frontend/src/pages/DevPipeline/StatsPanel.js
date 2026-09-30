import React from "react";
import moment from "moment";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Bar,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { brl, compact, getUsdRate, t } from "./shared";
import { AgentAvatar, TEAM, agentName, agentRole } from "./team";

/**
 * Resumo do pipeline no topo do quadro: quantas concluíram, quantas
 * faltam, quanto já custou (em reais) e quem abriu. Os gráficos usam as
 * cores de apoio do tema (accents): combinam com qualquer cor de empresa
 * e com o tema escuro.
 */
const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    wrap: { marginBottom: theme.spacing(1.5) },
    kpis: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: theme.spacing(1),
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
      }
    },
    kpi: {
      padding: theme.spacing(1.25, 1.5),
      borderRadius: tkv.radius.lg,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface
    },
    kpiLabel: {
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    kpiValue: {
      marginTop: 2,
      fontSize: "1.375rem",
      fontWeight: 800,
      letterSpacing: "-0.01em",
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      [theme.breakpoints.down("xs")]: { fontSize: "1.125rem" }
    },
    kpiHint: {
      fontSize: "0.72rem",
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    charts: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
      gap: theme.spacing(1),
      marginTop: theme.spacing(1),
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" }
    },
    chart: {
      padding: theme.spacing(1.25, 1.5),
      borderRadius: tkv.radius.lg,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      minWidth: 0
    },
    chartTitle: {
      fontSize: "0.8125rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    chartHint: {
      fontSize: "0.72rem",
      color: theme.palette.text.secondary,
      marginBottom: 6
    },
    pieRow: { display: "flex", alignItems: "center", gap: 12 },
    pieBox: { width: 168, height: 168, flex: "none" },
    legend: {
      flex: 1,
      minWidth: 0,
      margin: 0,
      padding: 0,
      listStyle: "none",
      fontSize: "0.8125rem",
      "& li": {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 0"
      }
    },
    swatch: { width: 10, height: 10, borderRadius: 3, flex: "none" },
    legendName: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: theme.palette.text.primary
    },
    legendCount: { fontWeight: 700, color: theme.palette.text.secondary },
    tip: {
      padding: "6px 10px",
      borderRadius: tkv.radius.md,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      fontSize: "0.75rem",
      boxShadow: "0 8px 20px -12px rgba(0,0,0,.45)"
    },
    team: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: theme.spacing(1)
    },
    member: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      height: 36,
      padding: "0 12px 0 4px",
      borderRadius: tkv.radius.pill,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      fontSize: "0.78rem",
      "& b": { color: theme.palette.text.primary },
      "& span": { color: theme.palette.text.secondary }
    }
  };
});

const WeekTip = ({ active, payload, label }) => {
  const classes = useStyles();
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className={classes.tip}>
      <b>{t("stats.weekOf", { date: moment(label).format("DD/MM") })}</b>
      <div>{t("stats.createdCount", { count: row.created })}</div>
      <div>{t("stats.doneCount", { count: row.done })}</div>
      <div>{brl(row.costUsd)}</div>
    </div>
  );
};

const StatsPanel = ({ stats }) => {
  const classes = useStyles();
  const theme = useTheme();
  const tkv = theme.palette.tkv;
  const accents = tkv.accents?.length ? tkv.accents : [tkv.brand.main];
  if (!stats) return null;

  const average = stats.done ? stats.doneCostUsd / stats.done : 0;
  const weekly = (stats.weekly || []).map(row => ({
    ...row,
    // a linha de gasto mostra em reais, como o resto da tela
    brl: Number(((row.costUsd || 0) * getUsdRate()).toFixed(2))
  }));
  const openers = (stats.byOpener || []).map((item, index) => ({
    ...item,
    label: item.key === "team" ? t("stats.team") : item.name,
    color: accents[index % accents.length]
  }));

  const kpis = [
    {
      key: "done",
      value: stats.done,
      hint: t("stats.doneHint", { total: stats.total })
    },
    {
      key: "open",
      value: stats.open,
      hint: t("stats.openHint", { count: stats.waitingApproval })
    },
    {
      key: "spent",
      value: brl(stats.costUsd),
      hint: t("stats.spentHint", { tokens: compact(stats.tokens) })
    },
    {
      key: "average",
      value: stats.done ? brl(average) : "—",
      hint: t("stats.averageHint")
    }
  ];

  return (
    <div className={classes.wrap}>
      <div className={classes.kpis}>
        {kpis.map(kpi => (
          <div key={kpi.key} className={classes.kpi}>
            <div className={classes.kpiLabel}>{t(`stats.${kpi.key}`)}</div>
            <div className={classes.kpiValue}>{kpi.value}</div>
            <div className={classes.kpiHint}>{kpi.hint}</div>
          </div>
        ))}
      </div>

      <div className={classes.charts}>
        <div className={classes.chart}>
          <div className={classes.chartTitle}>{t("stats.weeksTitle")}</div>
          <div className={classes.chartHint}>{t("stats.weeksHint")}</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <ComposedChart
                data={weekly}
                margin={{ top: 4, right: 4, bottom: 0, left: -18 }}
              >
                <XAxis
                  dataKey="week"
                  tickFormatter={week => moment(week).format("DD/MM")}
                  tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="count"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis yAxisId="money" orientation="right" hide />
                <Tooltip
                  content={<WeekTip />}
                  cursor={{ fill: tkv.surfaceHover }}
                />
                <Bar
                  yAxisId="count"
                  dataKey="created"
                  fill={accents[0]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Bar
                  yAxisId="count"
                  dataKey="done"
                  fill={tkv.semantic.success}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Line
                  yAxisId="money"
                  dataKey="brl"
                  type="monotone"
                  stroke={tkv.semantic.warning}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ul className={classes.legend} style={{ display: "flex", gap: 14 }}>
            <li>
              <span
                className={classes.swatch}
                style={{ backgroundColor: accents[0] }}
              />
              {t("stats.created")}
            </li>
            <li>
              <span
                className={classes.swatch}
                style={{ backgroundColor: tkv.semantic.success }}
              />
              {t("stats.doneLegend")}
            </li>
            <li>
              <span
                className={classes.swatch}
                style={{ backgroundColor: tkv.semantic.warning, height: 3 }}
              />
              {t("stats.spentLegend")}
            </li>
          </ul>
        </div>

        <div className={classes.chart}>
          <div className={classes.chartTitle}>{t("stats.openersTitle")}</div>
          <div className={classes.chartHint}>
            {t("stats.openersHint", {
              team: stats.bySource?.team || 0,
              help: stats.bySource?.help || 0
            })}
          </div>
          {openers.length ? (
            <div className={classes.pieRow}>
              <div className={classes.pieBox}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={openers}
                      dataKey="count"
                      nameKey="label"
                      innerRadius="62%"
                      outerRadius="95%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {openers.map(item => (
                        <Cell key={item.key} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className={classes.legend}>
                {openers.map(item => (
                  <li key={item.key}>
                    <span
                      className={classes.swatch}
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={classes.legendName}>{item.label}</span>
                    <span className={classes.legendCount}>{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className={classes.chartHint}>{t("empty")}</div>
          )}
        </div>
      </div>

      <div className={classes.team} aria-label={t("stats.teamTitle")}>
        {TEAM.map(agent => (
          <span key={agent.key} className={classes.member}>
            <AgentAvatar agent={agent.key} size={28} />
            <b>{agentName(agent.key)}</b>
            <span>{agentRole(agent.key)}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;
