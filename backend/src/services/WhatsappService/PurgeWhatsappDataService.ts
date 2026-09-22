import { join } from "path";
import fs from "fs";
import { Op } from "sequelize";
import sequelize from "../../database";
import Ticket from "../../models/Ticket";
import TicketNote from "../../models/TicketNote";
import TicketTraking from "../../models/TicketTraking";
import UserRating from "../../models/UserRating";
import Schedule from "../../models/Schedule";
import OldMessage from "../../models/OldMessage";
import OutOfTicketMessages from "../../models/OutOfTicketMessages";
import BaileysContact from "../../models/BaileysContact";
import Contact from "../../models/Contact";
import { getIO } from "../../libs/socket";
import { getPublicPath } from "../../helpers/GetPublicPath";
import { logger } from "../../utils/logger";

const removeFolder = (folder: string) => {
  try {
    fs.rmSync(join(getPublicPath(), "media", folder), {
      recursive: true,
      force: true
    });
  } catch {
    // pasta de mídia ausente: segue
  }
};

/**
 * Desconectou com "apagar tudo": some do sistema tudo o que veio por essa
 * conexão — atendimentos, mensagens (e as antigas, de edição), anotações,
 * avaliações, agendamentos desses atendimentos, mídias, a agenda sincronizada
 * do celular e os contatos que só existiam por causa dela. Contato que também
 * conversa por outra conexão continua. Nada é apagado no próprio WhatsApp.
 */
const PurgeWhatsappDataService = async (
  whatsappId: number,
  companyId: number
): Promise<{ tickets: number; contacts: number }> => {
  const tickets = await Ticket.findAll({
    where: { whatsappId, companyId },
    attributes: ["id", "contactId", "status", "queueId"]
  });
  const ticketIds = tickets.map(t => t.id);
  const contactIds = [...new Set(tickets.map(t => t.contactId))];
  let removedContacts: number[] = [];

  await sequelize.transaction(async transaction => {
    if (ticketIds.length) {
      const byTicket = { ticketId: { [Op.in]: ticketIds } };
      // registros que só "soltariam" o atendimento (SET NULL) também saem
      await TicketNote.destroy({ where: byTicket, transaction });
      await TicketTraking.destroy({ where: byTicket, transaction });
      await UserRating.destroy({ where: byTicket, transaction });
      await Schedule.destroy({ where: byTicket, transaction });
      await OldMessage.destroy({ where: byTicket, transaction });
      // mensagens e etiquetas saem em cascata com o atendimento
      await Ticket.destroy({
        where: { id: { [Op.in]: ticketIds } },
        transaction
      });
    }
    await TicketTraking.destroy({ where: { whatsappId }, transaction });
    await OutOfTicketMessages.destroy({ where: { whatsappId }, transaction });
    await BaileysContact.destroy({ where: { whatsappId }, transaction });

    if (contactIds.length) {
      const stillUsed = (await Ticket.findAll({
        where: { contactId: { [Op.in]: contactIds } },
        attributes: ["contactId"],
        group: ["contactId"],
        raw: true,
        transaction
      })) as unknown as { contactId: number }[];
      const keep = new Set(stillUsed.map(row => row.contactId));
      removedContacts = contactIds.filter(id => !keep.has(id));
      if (removedContacts.length) {
        // etiquetas, campos extras, agendamentos e mapeamentos vão em cascata
        await Contact.destroy({
          where: { id: { [Op.in]: removedContacts }, companyId },
          transaction
        });
      }
    }
  });

  tickets.forEach(ticket =>
    removeFolder(`${companyId}/${ticket.contactId}/${ticket.id}`)
  );
  removedContacts.forEach(contactId =>
    removeFolder(`${companyId}/${contactId}`)
  );

  const io = getIO();
  tickets.forEach(ticket => {
    io.to(`company-${companyId}-${ticket.status}`)
      .to(`company-${companyId}-notification`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(String(ticket.id))
      .emit(`company-${companyId}-ticket`, {
        action: "delete",
        ticketId: ticket.id
      });
  });
  removedContacts.forEach(contactId =>
    io
      .to(`company-${companyId}-mainchannel`)
      .emit(`company-${companyId}-contact`, { action: "delete", contactId })
  );

  logger.info(
    {
      whatsappId,
      companyId,
      tickets: ticketIds.length,
      contacts: removedContacts.length
    },
    "WhatsApp data purged on disconnect"
  );
  return { tickets: ticketIds.length, contacts: removedContacts.length };
};

export default PurgeWhatsappDataService;
