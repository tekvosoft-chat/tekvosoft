import React from "react";
import { useHistory } from "react-router-dom";

import { Card, IconButton, useMediaQuery } from "@material-ui/core";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import ArrowBackIosRoundedIcon from "@material-ui/icons/ArrowBackIosRounded";

import TicketHeaderSkeleton from "../TicketHeaderSkeleton";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  ticketHeader: {
    display: "flex",
    alignItems: "center",
    flex: "none",
    backgroundColor: theme.palette.tkv.surface,
    borderBottom: `1px solid ${theme.palette.tkv.border}`,
    boxShadow: "none"
  },
  back: {
    flex: "none",
    marginLeft: theme.spacing(0.5),
    color: theme.palette.text.secondary
  }
}));

/**
 * Cabeçalho da conversa.
 *
 * Ganhou um "voltar" que só existe no celular. Antes, para sair de um ticket
 * e escolher outro, a pessoa tinha que achar uma aba chamada "Atendimentos"
 * no topo da tela — um alternador que não parece navegação. Uma seta de
 * voltar é o gesto que todo aplicativo de mensagem usa e que todo mundo já
 * espera encontrar aqui.
 *
 * A seta é opt-in (`showBack`): este cabeçalho também aparece dentro do
 * diálogo de histórico de mensagens, e lá "voltar" tem de fechar o diálogo,
 * não trocar de rota por baixo dele.
 */
const TicketHeader = ({ loading, children, showBack = false }) => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));

  return (
    <>
      {loading ? (
        <TicketHeaderSkeleton />
      ) : (
        <Card square className={classes.ticketHeader}>
          {showBack && isPhone && (
            <IconButton
              className={classes.back}
              onClick={() => history.push("/tickets")}
              aria-label={i18n.t("common.back")}
              size="small"
            >
              <ArrowBackIosRoundedIcon fontSize="small" />
            </IconButton>
          )}
          {children}
        </Card>
      )}
    </>
  );
};

export default TicketHeader;
