import React, { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";

import TicketsManagerTabs from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";

import { TicketsContext } from "../../context/Tickets/TicketsContext";

/**
 * Atendimentos no celular.
 *
 * Antes esta tela empilhava um alternador "Ticket | Atendimentos" no ALTO da
 * página — um BottomNavigation usado como aba de topo. Somado à barra do
 * aplicativo, às abas de status e à linha de filtros, eram quatro faixas de
 * navegação antes da primeira conversa aparecer: quase um terço da tela de
 * um celular gasto antes de qualquer conteúdo.
 *
 * O alternador nem precisava existir: a própria URL já diz o que mostrar.
 * Sem ticket na rota, a tela é a lista; com ticket, é a conversa, e a volta
 * se faz pela seta no cabeçalho dela. É o modelo de qualquer aplicativo de
 * mensagens, e devolve uma faixa inteira de altura para o conteúdo.
 */
const useStyles = makeStyles(theme => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    backgroundColor: theme.palette.tkv.surface,
    // a navegação inferior não pode cobrir o campo de escrever a mensagem
    paddingBottom: `calc(${theme.palette.tkv.layout.bottomNavHeight}px + env(safe-area-inset-bottom, 0px))`
  },
  pane: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  }
}));

const TicketAdvanced = () => {
  const classes = useStyles();
  const { ticketId } = useParams();
  const { currentTicket, setCurrentTicket } = useContext(TicketsContext);

  useEffect(() => {
    if (currentTicket.id !== null) {
      setCurrentTicket({ id: currentTicket.id, code: "#open" });
    }
    return () => {
      setCurrentTicket({ id: null, code: null });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.pane}>
        {ticketId ? <Ticket /> : <TicketsManagerTabs />}
      </div>
    </div>
  );
};

export default TicketAdvanced;
