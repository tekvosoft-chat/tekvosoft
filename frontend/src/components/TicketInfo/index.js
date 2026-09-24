import React, { useState, useEffect } from "react";

import {
  Avatar,
  CardHeader,
  makeStyles,
  useMediaQuery,
  useTheme
} from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import { formatWhatsappContactName } from "../../helpers/formatWhatsappDisplay";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";

/**
 * Identificação do contato no topo da conversa.
 *
 * Antes o nome era cortado em código para 10 caracteres sempre que a tela
 * tivesse menos de 600px ("Maria Apare...") — um corte fixo, que ignorava
 * quanto espaço de fato sobrava ao lado dos botões. Agora quem decide é o
 * CSS: o nome ocupa tudo que houver e só termina em reticências se realmente
 * não couber. O número do ticket sai do meio do nome e vira detalhe discreto.
 */
const useStyles = makeStyles(theme => ({
  header: {
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
    padding: theme.spacing(1, 1.5),
    [theme.breakpoints.down("xs")]: { padding: theme.spacing(0.75, 0.5) }
  },
  avatar: {
    marginRight: theme.spacing(1.5),
    [theme.breakpoints.down("xs")]: { marginRight: theme.spacing(1) }
  },
  avatarImg: {
    width: 40,
    height: 40,
    color: "#FFFFFF",
    fontWeight: 700
  },
  content: { minWidth: 0 },
  title: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    minWidth: 0,
    fontSize: "0.9375rem",
    fontWeight: 600,
    lineHeight: 1.3,
    color: theme.palette.text.primary
  },
  name: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  ticketId: {
    flex: "none",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: theme.palette.text.secondary
  },
  // celular: nome maior, sem o número do ticket (fica nos dados do contato)
  phoneName: { fontSize: "1.0625rem" },
  phoneAvatar: { width: 38, height: 38 },
  subheader: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  }
}));

const TicketInfo = ({ contact, ticket, onClick }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const { user } = ticket;
  const [userName, setUserName] = useState("");

  const contactName = contact ? formatWhatsappContactName(contact, ticket) : "";

  useEffect(() => {
    if (user && contact) {
      setUserName(
        document.body.offsetWidth < 600
          ? `${user.name}`
          : `${i18n.t("messagesList.header.assignedTo")} ${user.name}`
      );
    }
  }, [contact, user]);

  return (
    <>
      <CardHeader
        onClick={onClick}
        classes={{
          root: classes.header,
          avatar: classes.avatar,
          content: classes.content
        }}
        disableTypography
        avatar={
          <Avatar
            className={`${classes.avatarImg}${isPhone ? ` ${classes.phoneAvatar}` : ""}`}
            style={{ backgroundColor: generateColor(contact?.number) }}
            src={contact.profilePicUrl}
            alt=""
          >
            {getInitials(contactName)}
          </Avatar>
        }
        title={
          <div
            className={`${classes.title}${isPhone ? ` ${classes.phoneName}` : ""}`}
          >
            <span className={classes.name}>{contactName}</span>
          </div>
        }
        subheader={
          isPhone && (
            <div className={classes.subheader}>
              {i18n.t("messagesList.header.tapForInfo")}
            </div>
          )
        }
      />
    </>
  );
};

export default TicketInfo;
