import React from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

/**
 * Indicadores extras do painel: números do período em tiras compactas,
 * horários de pico (mensagens recebidas por hora) e atendimentos por fila.
 * Minimalista: poucos traços, cor só onde carrega significado.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const card = {
    padding: theme.spacing(2),
    borderRadius: t.radius.lg,
    border: `1px solid ${t.border}`,
    backgroundColor: t.surface
  };
  return {
    kpis: {
      display: "grid",
      gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("md")]: {
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
      },
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
      }
    },
    kpi: {
      ...card,
      padding: theme.spacing(1.5, 2),
      animation: "$in .35s ease both"
    },
    kpiLabel: {
      fontSize: 12,
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    kpiValue: {
      marginTop: 4,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary,
      fontVariantNumeric: "tabular-nums"
    },
    kpiSub: { fontSize: 12, color: theme.palette.text.secondary },
    grid: {
      marginTop: theme.spacing(1.5),
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "minmax(0, 1fr)" }
    },
    card: { ...card, minHeight: 280, display: "flex", flexDirection: "column" },
    cardTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    cardHint: {
      fontSize: 12,
      color: theme.palette.text.secondary,
      marginBottom: theme.spacing(1.5)
    },
    queueRow: { marginBottom: theme.spacing(1.25) },
    queueHead: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      color: theme.palette.text.primary,
      marginBottom: 4
    },
    queueDot: { width: 8, height: 8, borderRadius: "50%", flex: "none" },
    queueName: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    queueValue: {
      fontWeight: 600,
      fontVariantNumeric: "tabular-nums",
      color: theme.palette.text.secondary
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: t.surfaceSunken,
      overflow: "hidden"
    },
    fill: {
      height: "100%",
      borderRadius: 3,
      transition: "width .6s cubic-bezier(.2, .8, .2, 1)"
    },
    empty: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      color: theme.palette.text.secondary
    },
    tooltip: {
      padding: "6px 10px",
      borderRadius: 8,
      fontSize: 12,
      color: theme.palette.text.primary,
      backgroundColor: t.surface,
      border: `1px solid ${t.border}`,
      boxShadow: "0 6px 20px -8px rgba(12, 10, 20, 0.3)"
    },
    "@keyframes in": {
      from: { opacity: 0, transform: "translateY(6px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const fmt = value => Number(value || 0).toLocaleString("pt-BR");

const HourTooltip = ({ active, payload }) => {
  const classes = useStyles();
  if (!active || !payload?.length) return null;
  const { hour, count } = payload[0].payload;
  return (
    <div className={classes.tooltip}>
      <b>{String(hour).padStart(2, "0")}h</b> · {fmt(count)} mensagens
    </div>
  );
};

const Insights = ({ data }) => {
  const classes = useStyles();
  const theme = useTheme();
  if (!data) return null;

  const busiest = [...(data.peakHours || [])].sort(
    (a, b) => b.count - a.count
  )[0];
  const queueMax = Math.max(
    1,
    ...(data.ticketsByQueue || []).map(q => q.count)
  );

  const kpis = [
    ["Mensagens recebidas", fmt(data.messagesReceived)],
    ["Mensagens enviadas", fmt(data.messagesSent)],
    [
      "Avaliação média",
      data.ratingAverage != null ? `${data.ratingAverage} ★` : "—",
      data.ratingCount
        ? `${fmt(data.ratingCount)} avaliações`
        : "sem avaliações"
    ],
    ["Contatos na base", fmt(data.contactsTotal)],
    [
      "Conexões online",
      `${data.connectionsOnline}/${data.connectionsTotal}`,
      data.connectionsOnline < data.connectionsTotal
        ? "verifique as conexões"
        : "tudo conectado"
    ],
    ["Agendamentos a enviar", fmt(data.schedulesPending)]
  ];

  return (
    <>
      <div className={classes.kpis}>
        {kpis.map(([label, value, sub], index) => (
          <div
            key={label}
            className={classes.kpi}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={classes.kpiLabel}>{label}</div>
            <div className={classes.kpiValue}>{value}</div>
            {sub && <div className={classes.kpiSub}>{sub}</div>}
          </div>
        ))}
      </div>

      <div className={classes.grid}>
        <div className={classes.card}>
          <div className={classes.cardTitle}>Horários de pico</div>
          <div className={classes.cardHint}>
            Mensagens recebidas por hora do dia
            {busiest?.count
              ? ` · mais movimentado às ${String(busiest.hour).padStart(2, "0")}h`
              : ""}
          </div>
          <div style={{ flex: 1, minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.peakHours}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                barCategoryGap={2}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={theme.palette.tkv.border}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="hour"
                  tickFormatter={h => `${h}h`}
                  interval={2}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                />
                <Tooltip
                  cursor={{ fill: theme.palette.tkv.surfaceSunken }}
                  content={<HourTooltip />}
                />
                <Bar
                  dataKey="count"
                  fill={theme.palette.tkv.brand.main}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={classes.card}>
          <div className={classes.cardTitle}>Atendimentos por fila</div>
          <div className={classes.cardHint}>Criados no período</div>
          {data.ticketsByQueue?.length ? (
            data.ticketsByQueue.map(queue => (
              <div key={queue.name || "none"} className={classes.queueRow}>
                <div className={classes.queueHead}>
                  <span
                    className={classes.queueDot}
                    style={{
                      backgroundColor:
                        queue.color || theme.palette.tkv.borderStrong
                    }}
                  />
                  <span className={classes.queueName}>
                    {queue.name || "Sem fila"}
                  </span>
                  <span className={classes.queueValue}>{fmt(queue.count)}</span>
                </div>
                <div className={classes.track}>
                  <div
                    className={classes.fill}
                    style={{
                      width: `${(queue.count / queueMax) * 100}%`,
                      backgroundColor:
                        queue.color || theme.palette.tkv.borderStrong
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className={classes.empty}>Nenhum atendimento no período</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Insights;
