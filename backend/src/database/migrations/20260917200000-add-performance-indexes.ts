import { QueryInterface } from "sequelize";

/**
 * Índices para muita conversa e muita conexão ao mesmo tempo.
 *
 * CONCURRENTLY: cria sem travar a tabela (o sistema continua recebendo
 * mensagens enquanto o índice é montado). IF NOT EXISTS: pode rodar de novo.
 */
const INDEXES: [string, string, string][] = [
  // painel (mensagens do período) e relatórios
  ["idx_messages_companyid_createdat", "Messages", `("companyId", "createdAt")`],
  // conversas por conexão (desconectar apaga as conversas dela)
  ["idx_tickets_whatsappid", "Tickets", `("whatsappId")`],
  // lista de atendimentos filtrada por fila e situação
  ["idx_tickets_company_queue_status", "Tickets", `("companyId", "queueId", "status")`],
  // lista de conversas por contato (busca, histórico)
  ["idx_tickets_contactid_updatedat", "Tickets", `("contactId", "updatedAt")`],
  // agendamentos que vão sair e checagem de contato
  ["idx_schedules_contactid", "Schedules", `("contactId")`],
  ["idx_schedules_sendat_sentat", "Schedules", `("sendAt", "sentAt")`],
  // chat interno
  ["idx_chatusers_userid", "ChatUsers", `("userId")`],
  ["idx_chatusers_chatid", "ChatUsers", `("chatId")`],
  ["idx_chatmessages_chatid_createdat", "ChatMessages", `("chatId", "createdAt")`],
  // anotações e avaliações por atendimento
  ["idx_ticketnotes_ticketid", "TicketNotes", `("ticketId")`],
  ["idx_userratings_company_createdat", "UserRatings", `("companyId", "createdAt")`],
  ["idx_userratings_ticketid", "UserRatings", `("ticketId")`],
  // filas de cada usuário (checagem de acesso em toda requisição)
  ["idx_userqueues_queueid", "UserQueues", `("queueId")`]
];

export default {
  up: async (queryInterface: QueryInterface) => {
    for (const [name, table, columns] of INDEXES) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.sequelize.query(
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${name}" ON "${table}" ${columns}`
      );
    }
  },

  down: async (queryInterface: QueryInterface) => {
    for (const [name] of INDEXES) {
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.sequelize.query(
        `DROP INDEX CONCURRENTLY IF EXISTS "${name}"`
      );
    }
  }
};
