import React from "react";
import Avatar from "@material-ui/core/Avatar";
import { makeStyles } from "@material-ui/core/styles";

import { getInitials } from "../../helpers/getInitials";

/**
 * Foto do usuário do sistema (atendente). Sem foto, mostra as iniciais na
 * cor da marca — o mesmo desenho em todo lugar: topo, menu, chat interno e
 * listas de atendimento.
 */
const useStyles = makeStyles(theme => ({
  avatar: {
    fontWeight: 700,
    backgroundColor: theme.palette.tkv.brand.textSoft,
    color: theme.palette.tkv.brand.text
  }
}));

const UserAvatar = ({ user, size = 36, className, style, onClick }) => {
  const classes = useStyles();
  return (
    <Avatar
      src={user?.profileImage || undefined}
      alt={user?.name || ""}
      onClick={onClick}
      className={`${classes.avatar}${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.4, ...style }}
    >
      {getInitials(user?.name || "")}
    </Avatar>
  );
};

export default UserAvatar;
