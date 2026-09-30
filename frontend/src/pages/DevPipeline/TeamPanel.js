import React from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";
import { t, toneStyle } from "./shared";
import { AgentAvatar, TEAM, agentBio, agentName, agentRole } from "./team";

/**
 * A equipe e os modelos. Cada agente tem foto e jeito próprio, e mostra o
 * modelo de cada situação (no OpenRouter, a dificuldade que a triagem deu
 * escolhe o do código e o da revisão), com o preço do dia por milhão de
 * tokens. É por aqui que se entende por que uma demanda custou o que custou.
 */
const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    intro: {
      margin: theme.spacing(0, 0, 2),
      maxWidth: 760,
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: theme.spacing(2),
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "1fr",
        gap: theme.spacing(1.5)
      }
    },
    card: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.25),
      padding: theme.spacing(2),
      borderRadius: tkv.radius.lg,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface
    },
    who: { display: "flex", alignItems: "center", gap: theme.spacing(1.5) },
    name: {
      margin: 0,
      fontSize: "1.0625rem",
      fontWeight: 800,
      color: theme.palette.text.primary
    },
    role: {
      display: "inline-flex",
      alignItems: "center",
      height: 22,
      marginTop: 4,
      padding: "0 8px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.72rem",
      fontWeight: 700
    },
    bio: {
      margin: 0,
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary
    },
    models: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      marginTop: "auto",
      paddingTop: theme.spacing(1.25),
      borderTop: `1px solid ${tkv.border}`
    },
    model: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      padding: theme.spacing(0.75, 1),
      borderRadius: tkv.radius.md,
      backgroundColor: tkv.surfaceSunken
    },
    when: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    modelName: {
      fontSize: "0.9063rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflowWrap: "anywhere"
    },
    price: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    same: {
      marginTop: "auto",
      paddingTop: theme.spacing(1.25),
      borderTop: `1px solid ${tkv.border}`,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    table: {
      width: "100%",
      marginTop: theme.spacing(2.5),
      borderCollapse: "separate",
      borderSpacing: 0,
      borderRadius: tkv.radius.lg,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      overflow: "hidden",
      fontSize: "0.875rem",
      "& th, & td": {
        padding: theme.spacing(1.25, 1.5),
        textAlign: "left",
        verticalAlign: "top",
        borderBottom: `1px solid ${tkv.border}`
      },
      "& tr:last-child td": { borderBottom: 0 },
      "& th": {
        fontSize: "0.75rem",
        fontWeight: 700,
        color: theme.palette.text.secondary,
        backgroundColor: tkv.surfaceSunken
      },
      [theme.breakpoints.down("xs")]: {
        fontSize: "0.8125rem",
        "& th, & td": { padding: theme.spacing(1, 1) }
      }
    },
    tableTitle: {
      margin: theme.spacing(3, 0, 0),
      fontSize: "1rem",
      fontWeight: 800,
      color: theme.palette.text.primary
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      height: 22,
      padding: "0 8px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 700,
      whiteSpace: "nowrap"
    }
  };
});

// "OpenAI: GPT-6 Luna" -> "GPT-6 Luna": a marca já está no nome do modelo
const shortName = model =>
  String(model?.name || model?.model || "").replace(/^[^:]+:\s*/, "");

const usd = value =>
  new Intl.NumberFormat(i18n.language?.replace("_", "-") || "pt", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 3 : 2
  }).format(value || 0);

const ModelLine = ({ model }) => {
  const classes = useStyles();
  if (!model) return null;
  const [input, output] = model.price || [];
  return (
    <div className={classes.model} title={model.model}>
      <span className={classes.when}>{t(`slots.${model.slot}`)}</span>
      <span className={classes.modelName}>{shortName(model)}</span>
      {input > 0 && (
        <span className={classes.price}>
          {t("team.price", { input: usd(input), output: usd(output) })}
        </span>
      )}
    </div>
  );
};

const TeamPanel = ({ setup }) => {
  const classes = useStyles();
  const theme = useTheme();
  const models = setup?.models || [];
  const bySlot = slot => models.find(model => model.slot === slot);
  const perAgent = models.length > 0;

  return (
    <div>
      <p className={classes.intro}>{t("team.intro")}</p>

      <div className={classes.grid}>
        {TEAM.map(agent => (
          <section key={agent.key} className={classes.card}>
            <div className={classes.who}>
              <AgentAvatar agent={agent.key} size={60} badge />
              <div>
                <h3 className={classes.name}>{agentName(agent.key)}</h3>
                <span
                  className={classes.role}
                  style={toneStyle(theme, agent.tone)}
                >
                  {agentRole(agent.key)}
                </span>
              </div>
            </div>
            <p className={classes.bio}>{agentBio(agent.key)}</p>
            {perAgent && agent.slots.length > 0 && (
              <div className={classes.models}>
                {agent.slots.map(slot => (
                  <ModelLine key={slot} model={bySlot(slot)} />
                ))}
              </div>
            )}
            {perAgent && !agent.slots.length && (
              <div className={classes.same}>{t("team.sameCall")}</div>
            )}
          </section>
        ))}
      </div>

      {perAgent && (
        <>
          <h3 className={classes.tableTitle}>{t("team.routingTitle")}</h3>
          <table className={classes.table}>
            <thead>
              <tr>
                <th>{t("team.difficulty")}</th>
                <th>{agentName("developer")}</th>
                <th>{agentName("reviewer")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["easy", "success", "developer", "reviewer"],
                ["medium", "warning", "developerHard", "reviewer"],
                ["hard", "danger", "developerHard", "reviewerHard"]
              ].map(([key, tone, developer, reviewer]) => (
                <tr key={key}>
                  <td>
                    <span
                      className={classes.chip}
                      style={toneStyle(theme, tone)}
                    >
                      {t(`difficulty.${key}`)}
                    </span>
                  </td>
                  <td>{shortName(bySlot(developer))}</td>
                  <td>{shortName(bySlot(reviewer))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={classes.intro} style={{ marginTop: 8 }}>
            {t("team.routingHint")}
          </p>
        </>
      )}
    </div>
  );
};

export default TeamPanel;
