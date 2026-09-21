import React from "react";
import { makeStyles } from "@material-ui/core/styles";

import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";

/** A outra pessoa de uma conversa avulsa. */
export const otherUserOf = (chat, meId) =>
  (chat?.users || []).find(u => u.userId !== meId)?.user || null;

export const isDirect = chat => chat?.kind === "direct";

export const titleOf = (chat, meId) =>
  isDirect(chat)
    ? otherUserOf(chat, meId)?.name || "Conversa"
    : chat?.title || "Grupo";

export const unreadOf = (chat, meId) =>
  (chat?.users || []).find(u => u.userId === meId)?.unreads || 0;

const useStyles = makeStyles(theme => ({
  group: {
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.02em",
    userSelect: "none"
  },
  dot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: `3px solid ${theme.palette.tkv.surface}`,
    backgroundColor: "#80848E"
  },
  on: { backgroundColor: "#23A55A" }
}));

/** Ícone do grupo: iniciais numa cor sempre igual para o mesmo nome. */
export const GroupIcon = ({ title, size = 48, radius, className, style }) => {
  const classes = useStyles();
  return (
    <span
      className={`${classes.group}${className ? ` ${className}` : ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size / 2,
        fontSize: size * 0.36,
        backgroundColor: generateColor(title || "grupo"),
        ...style
      }}
    >
      {getInitials(title || "G").slice(0, 2)}
    </span>
  );
};

/** Bolinha de online/offline no canto da foto. */
export const OnlineDot = ({ online, className }) => {
  const classes = useStyles();
  return (
    <span
      className={`${classes.dot}${online ? ` ${classes.on}` : ""}${
        className ? ` ${className}` : ""
      }`}
      aria-label={online ? "Online" : "Offline"}
    />
  );
};
