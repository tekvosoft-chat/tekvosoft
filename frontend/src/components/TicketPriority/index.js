import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";

// Ticket.priority: 0 nenhuma, 1 baixa, 2 média, 3 alta, 4 urgente
export const PRIORITY_KEYS = ["none", "low", "medium", "high", "urgent"];

const useStyles = makeStyles(theme => ({
  icon: {
    flex: "none",
    display: "block",
    color: theme.palette.text.secondary
  },
  high: { color: theme.palette.tkv.semantic.warning },
  urgent: { color: theme.palette.tkv.semantic.danger }
}));

/**
 * Barrinhas como nos apps de tarefas: quantas acesas é o nível. Urgente vira
 * um quadradinho vermelho com exclamação, para saltar aos olhos na lista.
 */
const PriorityIcon = ({ level = 0, size = 16, className }) => {
  const classes = useStyles();
  const cls = clsx(
    classes.icon,
    { [classes.high]: level === 3, [classes.urgent]: level >= 4 },
    className
  );

  if (level >= 4) {
    return (
      <svg
        className={cls}
        width={size}
        height={size}
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <rect
          x="1.5"
          y="1.5"
          width="13"
          height="13"
          rx="3.5"
          fill="currentColor"
        />
        <path
          d="M8 4.6v4.1"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11.3" r="1.1" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg
      className={cls}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      {[4, 7.5, 11].map((height, i) => (
        <rect
          key={height}
          x={2 + i * 4.5}
          y={14 - height}
          width="3"
          height={height}
          rx="1"
          fill="currentColor"
          opacity={level > i ? 1 : 0.25}
        />
      ))}
    </svg>
  );
};

export default PriorityIcon;
