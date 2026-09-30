import React from "react";
import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import FlagRoundedIcon from "@material-ui/icons/FlagRounded";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import RateReviewRoundedIcon from "@material-ui/icons/RateReviewRounded";
import PhotoCameraRoundedIcon from "@material-ui/icons/PhotoCameraRounded";
import SchoolRoundedIcon from "@material-ui/icons/SchoolRounded";
import SettingsRoundedIcon from "@material-ui/icons/SettingsRounded";
import PersonRoundedIcon from "@material-ui/icons/PersonRounded";

import { t, toneStyle } from "./shared";

// fotos em public/agents: arquivo estático, fora do webpack (o SVG traz a
// licença em metadados que o carregador de SVG do React não aceita)
const photo = name => `${process.env.PUBLIC_URL || ""}/agents/${name}.svg`;

/**
 * A equipe do pipeline. Cada agente tem nome (devPipeline.agents.<chave>),
 * papel (agentRoles), jeito de ser (agentBios) e foto: Xereta fuça o código
 * na triagem, Sirene decide o que é urgente, Zé Commit escreve, Dona Lupa
 * revisa, Clique testa na tela com foto e vídeo e o Sabichão transforma
 * correção em skill.
 *
 * As fotos são do estilo Notionists (Zoish, via DiceBear), licença CC0,
 * em public/agents.
 *
 * "slots": as vagas de modelo do agente no OpenRouter (models.ts no
 * backend). A Sirene não tem: a prioridade sai da mesma chamada da triagem.
 */
export const TEAM = [
  {
    key: "triage",
    avatar: photo("xereta"),
    icon: SearchRoundedIcon,
    tone: "info",
    slots: ["triage"]
  },
  {
    key: "priority",
    avatar: photo("sirene"),
    icon: FlagRoundedIcon,
    tone: "warning",
    slots: []
  },
  {
    key: "developer",
    avatar: photo("ze-commit"),
    icon: CodeRoundedIcon,
    tone: "brand",
    slots: ["developer", "developerHard"]
  },
  {
    key: "reviewer",
    avatar: photo("dona-lupa"),
    icon: RateReviewRoundedIcon,
    tone: "success",
    slots: ["reviewer", "reviewerHard"]
  },
  {
    key: "tester",
    avatar: photo("clique"),
    icon: PhotoCameraRoundedIcon,
    tone: "info",
    slots: ["tester"]
  },
  {
    key: "learner",
    avatar: photo("sabichao"),
    icon: SchoolRoundedIcon,
    tone: "danger",
    slots: ["learner"]
  }
];

const OTHERS = {
  system: { key: "system", icon: SettingsRoundedIcon, tone: "neutral" },
  human: { key: "human", icon: PersonRoundedIcon, tone: "neutral" }
};

export const agentOf = key =>
  TEAM.find(agent => agent.key === key) || OTHERS[key] || OTHERS.system;

export const agentName = key => t(`agents.${key}`);
export const agentRole = key => t(`agentRoles.${key}`);
export const agentBio = key => t(`agentBios.${key}`);

// quem está trabalhando em cada etapa (o cartão mostra a foto dele)
const WORKER = {
  intake: "triage",
  prioritization: "priority",
  development: "developer",
  review: "reviewer",
  tests: "tester"
};
export const workerOf = stage => WORKER[stage] || null;

const useStyles = makeStyles(theme => ({
  photo: {
    position: "relative",
    flex: "none",
    display: "inline-block",
    borderRadius: "50%",
    "& img": {
      display: "block",
      width: "100%",
      height: "100%",
      borderRadius: "50%"
    }
  },
  badge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    display: "grid",
    placeItems: "center",
    width: "42%",
    height: "42%",
    minWidth: 14,
    minHeight: 14,
    borderRadius: "50%",
    border: `2px solid ${theme.palette.tkv.surface}`,
    "& svg": { fontSize: "0.72em" }
  },
  icon: {
    flex: "none",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    border: `1px solid ${theme.palette.tkv.border}`,
    backgroundColor: theme.palette.tkv.surface,
    color: theme.palette.text.secondary
  }
}));

/**
 * Foto do agente. Com badge, o ícone do papel aparece no canto (ajuda a
 * reconhecer no tamanho pequeno). Sistema e pessoa não têm foto: ícone.
 */
export const AgentAvatar = ({
  agent: key,
  size = 32,
  badge = false,
  className
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const agent = agentOf(key);
  const Icon = agent.icon;
  if (!agent.avatar) {
    return (
      <span
        className={clsx(classes.icon, className)}
        style={{ width: size, height: size, fontSize: size * 0.56 }}
        aria-hidden
      >
        <Icon fontSize="inherit" />
      </span>
    );
  }
  return (
    <span
      className={clsx(classes.photo, className)}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      <img src={agent.avatar} alt={agentName(key)} loading="lazy" />
      {badge && (
        <span className={classes.badge} style={toneStyle(theme, agent.tone)}>
          <Icon fontSize="inherit" />
        </span>
      )}
    </span>
  );
};
