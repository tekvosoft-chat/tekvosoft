import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import FlagRoundedIcon from "@material-ui/icons/FlagRounded";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import RateReviewRoundedIcon from "@material-ui/icons/RateReviewRounded";
import SchoolRoundedIcon from "@material-ui/icons/SchoolRounded";
import SettingsRoundedIcon from "@material-ui/icons/SettingsRounded";
import PersonRoundedIcon from "@material-ui/icons/PersonRounded";

import { t } from "./shared";

/**
 * A equipe do pipeline. Cada agente tem nome (devPipeline.agents.<chave>)
 * e papel (devPipeline.agentRoles.<chave>): Xereta fuça o código na
 * triagem, Sirene decide o que é urgente, Zé Commit escreve, Dona Lupa
 * revisa e o Sabichão transforma correção em skill.
 */
export const TEAM = [
  { key: "triage", icon: SearchRoundedIcon, tone: "info" },
  { key: "priority", icon: FlagRoundedIcon, tone: "warning" },
  { key: "developer", icon: CodeRoundedIcon, tone: "brand" },
  { key: "reviewer", icon: RateReviewRoundedIcon, tone: "success" },
  { key: "learner", icon: SchoolRoundedIcon, tone: "danger" }
];

const OTHERS = {
  system: { key: "system", icon: SettingsRoundedIcon, tone: "neutral" },
  human: { key: "human", icon: PersonRoundedIcon, tone: "neutral" }
};

export const agentOf = key =>
  TEAM.find(agent => agent.key === key) || OTHERS[key] || OTHERS.system;

export const agentName = key => t(`agents.${key}`);
export const agentRole = key => t(`agentRoles.${key}`);
