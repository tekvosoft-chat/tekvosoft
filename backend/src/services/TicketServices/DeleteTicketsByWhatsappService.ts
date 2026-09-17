import { join } from "path";
import fs from "fs";
import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import TicketNote from "../../models/TicketNote";
import TicketTraking from "../../models/TicketTraking";
import { getIO } from "../../libs/socket";
import { getPublicPath } from "../../helpers/GetPublicPath";
import { logger } from "../../utils/logger";

/**
 * Desconectou o WhatsApp: todos os atendimentos (e as mensagens salvas)
 * dessa conexão somem do sistema. Nada é apagado no próprio WhatsApp.
 */
const DeleteTicketsByWhatsappService = async (
  whatsappId: number,
  companyId: number
): Promise<number> => {
  const tickets = await Ticket.findAll({
    where: { whatsappId, companyId },
    attributes: ["id", "contactId", "status", "queueId"]
  });
  if (!tickets.length) return 0;

  const ids = tickets.map(t => t.id);

  // registros que só "soltariam" o ticket (SET NULL) também saem
  await TicketNote.destroy({ where: { ticketId: { [Op.in]: ids } } });
  await TicketTraking.destroy({ where: { ticketId: { [Op.in]: ids } } });
  // mensagens e tags saem em cascata com o ticket
  await Ticket.destroy({ where: { id: { [Op.in]: ids } } });

  const io = getIO();
  tickets.forEach(ticket => {
    try {
      fs.rmSync(
        join(
          getPublicPath(),
          "media",
          `${companyId}/${ticket.contactId}/${ticket.id}`
        ),
        { recursive: true, force: true }
      );
    } catch (error) {
      // pasta de mídia ausente: segue
    }
    io.to(`company-${companyId}-${ticket.status}`)
      .to(`company-${companyId}-notification`)
      .to(`queue-${ticket.queueId}-${ticket.status}`)
      .to(String(ticket.id))
      .emit(`company-${companyId}-ticket`, {
        action: "delete",
        ticketId: ticket.id
      });
  });

  logger.info(
    { whatsappId, companyId, count: ids.length },
    "Tickets removed after WhatsApp disconnect"
  );
  return ids.length;
};

export default DeleteTicketsByWhatsappService;
