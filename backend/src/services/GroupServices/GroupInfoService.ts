import { Op } from "sequelize";
import { GroupMetadata } from "libzapitu-rf";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { cacheLayer } from "../../libs/cache";
import { Session } from "../../libs/wbot";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import { logger } from "../../utils/logger";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { getJidOf } from "../WbotServices/getJidOf";

export interface GroupParticipantInfo {
  id: string;
  number: string | null;
  name: string | null;
  profilePicUrl: string | null;
  contactId: number | null;
  admin: "admin" | "superadmin" | null;
  isMe: boolean;
}

export interface GroupInfo {
  subject: string;
  description: string;
  creation: number | null;
  size: number;
  announce: boolean;
  isMember: boolean;
  isAdmin: boolean;
  participants: GroupParticipantInfo[];
}

const digitsOf = (jid?: string | null) =>
  jid ? jid.split("@")[0].split(":")[0] : null;

/** Atendimento de grupo da empresa, com a conexão dele. */
export const groupTicket = async (
  ticketId: string | number,
  companyId: number
): Promise<{ ticket: Ticket; wbot: Session; jid: string }> => {
  const ticket = await ShowTicketService(ticketId, companyId);
  if (!ticket.isGroup) throw new AppError("ERR_NOT_A_GROUP", 400);
  const wbot = await GetTicketWbot(ticket);
  return { ticket, wbot, jid: getJidOf(ticket) };
};

const cacheKey = (ticket: Ticket, jid: string) =>
  `groupinfo:${ticket.whatsappId}:${jid}`;

/**
 * Metadados do grupo direto do WhatsApp, guardados por 5 minutos: um grupo
 * de centenas de membros não é consultado a cada vez que o painel abre.
 * null quando a conexão não está mais no grupo.
 */
export const groupMetadataOf = async (
  ticket: Ticket,
  wbot: Session,
  jid: string,
  fresh = false
): Promise<GroupMetadata | null> => {
  const key = cacheKey(ticket, jid);
  if (!fresh) {
    const cached = await cacheLayer.get(key);
    if (cached) return cached === "none" ? null : JSON.parse(cached);
  }
  let metadata: GroupMetadata | null = null;
  try {
    metadata = await wbot.groupMetadata(jid);
  } catch (error) {
    logger.debug({ jid, error: error?.message }, "groupMetadata indisponível");
    metadata = null;
  }
  await cacheLayer.set(
    key,
    metadata ? JSON.stringify(metadata) : "none",
    "EX",
    metadata ? 300 : 60
  );
  return metadata;
};

export const forgetGroupMetadata = async (ticket: Ticket, jid: string) =>
  cacheLayer.del(cacheKey(ticket, jid));

const adminRank = (admin?: string | null) =>
  admin === "superadmin" ? 0 : admin === "admin" ? 1 : 2;

/**
 * Dados do grupo para o painel "Dados do grupo": descrição, membros (com
 * admins e "você") e se a conexão ainda participa. Nome e foto de cada
 * membro vêm dos contatos já salvos na empresa, pelo número ou pelo LID.
 */
const GroupInfoService = async (
  ticketId: string | number,
  companyId: number
): Promise<GroupInfo> => {
  const { ticket, wbot, jid } = await groupTicket(ticketId, companyId);
  const metadata = await groupMetadataOf(ticket, wbot, jid);

  if (!metadata) {
    return {
      subject: ticket.contact?.name || "",
      description: "",
      creation: null,
      size: 0,
      announce: false,
      isMember: false,
      isAdmin: false,
      participants: []
    };
  }

  const raw = metadata.participants.map(p => {
    const pn = p.jid || (p.id.endsWith("@s.whatsapp.net") ? p.id : undefined);
    const lid = p.lid || (p.id.endsWith("@lid") ? p.id : undefined);
    return { p, pn, lid, number: digitsOf(pn) };
  });

  const numbers = raw.map(r => r.number).filter(Boolean);
  const lids = raw.map(r => r.lid).filter(Boolean);
  const [byNumber, byLid] = await Promise.all([
    numbers.length
      ? Contact.findAll({
          where: { companyId, number: { [Op.in]: numbers } },
          attributes: ["id", "name", "number", "profilePicUrl"]
        })
      : [],
    lids.length
      ? WhatsappLidMap.findAll({
          where: { companyId, lid: { [Op.in]: lids } },
          include: [
            {
              model: Contact,
              as: "contact",
              attributes: ["id", "name", "number", "profilePicUrl"]
            }
          ]
        })
      : []
  ]);
  const contactByNumber = new Map<string, Contact>(
    (byNumber as Contact[]).map(c => [c.number, c])
  );
  const contactByLid = new Map<string, Contact>(
    (byLid as WhatsappLidMap[]).map(m => [m.lid, m.contact])
  );

  const myIds = [wbot.myJid, wbot.myLid].filter(Boolean);
  const participants: GroupParticipantInfo[] = raw.map(
    ({ p, pn, lid, number }) => {
      const contact =
        (number && contactByNumber.get(number)) ||
        (lid && contactByLid.get(lid)) ||
        null;
      const contactNumber = contact?.number || number;
      const savedName =
        contact?.name && contact.name !== contactNumber ? contact.name : null;
      return {
        id: p.id,
        number: contactNumber || null,
        name: savedName || p.notify || p.name || null,
        profilePicUrl: contact?.profilePicUrl || null,
        contactId: contact?.id || null,
        admin: p.admin || null,
        isMe: [p.id, pn, lid].some(id => id && myIds.includes(id))
      };
    }
  );

  // você primeiro, depois os admins, depois quem tem nome, por ordem
  participants.sort((a, b) => {
    if (a.isMe !== b.isMe) return a.isMe ? -1 : 1;
    const rank = adminRank(a.admin) - adminRank(b.admin);
    if (rank) return rank;
    if (!!a.name !== !!b.name) return a.name ? -1 : 1;
    return String(a.name || a.number || "").localeCompare(
      String(b.name || b.number || ""),
      "pt-BR"
    );
  });

  const me = participants.find(p => p.isMe);
  return {
    subject: metadata.subject || ticket.contact?.name || "",
    description: metadata.desc || "",
    creation: metadata.creation || null,
    size: metadata.size || participants.length,
    announce: !!metadata.announce,
    isMember: !!me,
    isAdmin: !!me?.admin,
    participants
  };
};

export default GroupInfoService;
