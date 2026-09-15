import { Op, WhereOptions } from "sequelize";

import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

export type ContactMediaKind = "media" | "docs" | "links";

interface Request {
  contactId: number;
  companyId: number;
  kind: ContactMediaKind;
  pageNumber?: number;
}

const PAGE_SIZE = 40;

/**
 * Mídias, documentos e links trocados com um contato, em todos os
 * atendimentos dele — a aba "Mídia, links e docs" dos dados do contato.
 */
const ListContactMediaService = async ({
  contactId,
  companyId,
  kind,
  pageNumber = 1
}: Request): Promise<{ messages: Message[]; hasMore: boolean }> => {
  const where: WhereOptions = { companyId, isDeleted: false };

  if (kind === "media") {
    Object.assign(where, {
      mediaUrl: { [Op.ne]: null },
      mediaType: { [Op.in]: ["image", "video"] }
    });
  } else if (kind === "docs") {
    Object.assign(where, {
      mediaUrl: { [Op.ne]: null },
      mediaType: { [Op.notIn]: ["image", "video", "audio", "sticker"] }
    });
  } else {
    Object.assign(where, {
      body: { [Op.iRegexp]: "https?://" }
    });
  }

  const offset = PAGE_SIZE * (Math.max(1, pageNumber) - 1);

  const rows = await Message.findAll({
    where,
    attributes: [
      "id",
      "ticketId",
      "body",
      "mediaUrl",
      "mediaType",
      "fromMe",
      "createdAt"
    ],
    include: [
      {
        model: Ticket,
        as: "ticket",
        attributes: [],
        where: { contactId, companyId },
        required: true
      }
    ],
    order: [["createdAt", "DESC"]],
    limit: PAGE_SIZE + 1,
    offset
  });

  return {
    messages: rows.slice(0, PAGE_SIZE),
    hasMore: rows.length > PAGE_SIZE
  };
};

export default ListContactMediaService;
