import React from "react";
import { useParams } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";

import TicketsManager from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";

import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  chatContainer: {
    flex: 1,
    height: `calc(100% - 48px)`,
    overflowY: "hidden"
  },

  chatPapper: {
    // backgroundColor: "red",
    display: "flex",
    height: "100%"
  },

  contactsWrapper: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflowY: "hidden",
    // coluna das conversas mais estreita: sobra mais espaço para a conversa
    [theme.breakpoints.up("md")]: {
      flex: "0 0 430px",
      maxWidth: 430
    },
    [theme.breakpoints.up("xl")]: {
      flex: "0 0 480px",
      maxWidth: 480
    }
  },
  messagesWrapper: {
    overflow: "hidden",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    flexGrow: 1,
    maxWidth: "unset",
    [theme.breakpoints.up("md")]: { flex: "1 1 0", minWidth: 0 }
  },
  welcomeMsg: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    height: "100%",
    textAlign: "center"
  }
}));

const TicketsCustom = () => {
  const classes = useStyles();
  const { ticketId } = useParams();

  return (
    <div className={classes.chatContainer}>
      <div className={classes.chatPapper}>
        <Grid container spacing={0}>
          <Grid item md={5} className={classes.contactsWrapper}>
            <TicketsManager />
          </Grid>
          <Grid item md={7} className={classes.messagesWrapper}>
            {ticketId ? (
              <>
                <Ticket key={ticketId} />
              </>
            ) : (
              <Paper square variant="outlined" className={classes.welcomeMsg}>
                <span>{i18n.t("chat.noTicketMessage")}</span>
              </Paper>
            )}
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default TicketsCustom;
