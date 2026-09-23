import * as Yup from "yup";
import { Request, Response } from "express";
import { parse as csvParser, stringify } from "csv";
import fs from "fs";
import { getIO } from "../libs/socket";

import ListContactsService from "../services/ContactServices/ListContactsService";
import CreateContactService from "../services/ContactServices/CreateContactService";
import ShowContactService from "../services/ContactServices/ShowContactService";
import ListContactMediaService, {
  ContactMediaKind
} from "../services/ContactServices/ListContactMediaService";
import UpdateContactService from "../services/ContactServices/UpdateContactService";
import DeleteContactService from "../services/ContactServices/DeleteContactService";
import FindOrCreateContactService from "../services/ContactServices/FindOrCreateContactService";

import CheckContactNumber, {
  CheckNumberAndCreateContact,
  IOnWhatsapp
} from "../services/WbotServices/CheckNumber";
import AppError from "../errors/AppError";
import SimpleListService, {
  SearchContactParams
} from "../services/ContactServices/SimpleListService";
import ContactCustomField from "../models/ContactCustomField";

import { logger } from "../utils/logger";
import Contact from "../models/Contact";
import { GetCompanySetting } from "../helpers/CheckSettings";
import WhatsappLidMap from "../models/WhatsappLidMap";
import { verifyContact } from "../services/WbotServices/verifyContact";
import { getWbot } from "../libs/wbot";
import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import { csvDetectDelimiter } from "../helpers/csvDetectDelimiter";
import { cacheLayer } from "../libs/cache";
import SyncContactToPhone, {
  trySyncContactToPhone
} from "../services/ContactServices/SyncContactToPhone";
import { getJidOf } from "../services/WbotServices/getJidOf";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type IndexGetContactQuery = {
  name: string;
  number: string;
};

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}
interface ContactData {
  name: string;
  number: string;
  email?: string;
  isGroup?: boolean;
  extraInfo?: ExtraInfo[];
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { contacts, count, hasMore } = await ListContactsService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ contacts, count, hasMore });
};

export const findOrInsertContact = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, number } = req.body as IndexGetContactQuery;
  const { companyId } = req.user;

  const contact = await FindOrCreateContactService({
    name,
    number,
    companyId
  });

  return res.status(200).json(contact);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const newContact: ContactData = req.body;
  newContact.number = newContact.number.replace("-", "").replace(" ", "");

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    number: Yup.string()
      .required()
      .matches(/^\d+$/, "Invalid number format. Only numbers is allowed.")
  });

  try {
    await schema.validate(newContact);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  let contact: Contact;
  if (!newContact.isGroup) {
    contact = await CheckNumberAndCreateContact(
      newContact.number,
      newContact.name,
      companyId
    );
  } else {
    contact = await CreateContactService({
      ...newContact,
      companyId
    });
  }

  const io = getIO();
  // marcou "sincronizar com a agenda do celular" no cadastro
  if (req.body?.syncToPhone && !contact.isGroup) {
    await contact.update({ syncToPhone: true });
    await trySyncContactToPhone(contact);
  }

  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-contact`,
    {
      action: "create",
      contact
    }
  );

  return res.status(200).json(contact);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const contact = await ShowContactService(contactId, companyId);

  return res.status(200).json(contact);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const contactData: ContactData = req.body;
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    name: Yup.string(),
    number: Yup.string().matches(/^\d+(@lid)?$/, "ERR_CHECK_NUMBER")
  });

  try {
    await schema.validate(contactData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  let checked: IOnWhatsapp;
  if (!contactData.isGroup && contactData.number.match(/^\d+$/)) {
    checked = await CheckContactNumber(contactData.number, companyId);
    const number = checked.jid.replace(/\D/g, "");
    contactData.number = number;
  }

  const { contactId } = req.params;

  const contact = await UpdateContactService({
    contactData,
    contactId,
    companyId
  });

  if (checked) {
    await WhatsappLidMap.destroy({
      where: { contactId: contact.id }
    });
    const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
    const wbot = getWbot(defaultWhatsapp.id);
    await verifyContact(
      { id: checked.jid, lid: checked.lid, name: contact.name },
      wbot,
      companyId
    );
  }

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-contact`,
    {
      action: "update",
      contact
    }
  );

  return res.status(200).json(contact);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  await ShowContactService(contactId, companyId);

  await DeleteContactService(contactId);

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-contact`,
    {
      action: "delete",
      contactId
    }
  );

  return res.status(200).json({ message: "Contact deleted" });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { name } = req.query as unknown as SearchContactParams;
  const { companyId } = req.user;

  const contacts = await SimpleListService({ name, companyId });

  return res.json(contacts);
};

export const storeTag = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { tagId } = req.body;
  const { companyId } = req.user;

  const tagsMode = await GetCompanySetting(companyId, "tagsMode", "ticket");

  if (!["contact", "both"].includes(tagsMode)) {
    throw new AppError("ERR_INVALID_TAGMODE", 400);
  }

  const contact = await ShowContactService(contactId, companyId);

  await contact.$add("tags", tagId);

  return res.status(200).json({ message: "Tag added to contact" });
};

export const removeTag = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId, tagId } = req.params;
  const { companyId } = req.user;

  const tagsMode = await GetCompanySetting(companyId, "tagsMode", "ticket");

  if (!["contact", "both"].includes(tagsMode)) {
    throw new AppError("ERR_INVALID_TAGMODE", 400);
  }

  const contact = await ShowContactService(contactId, companyId);

  await contact.$remove("tags", tagId);

  return res.status(200).json({ message: "Tag removed from contact" });
};

export const importCsv = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { file } = req;

  if (!file) {
    throw new AppError("ERR_NO_FILE", 400);
  }

  let delimiter = ",";
  try {
    const firstLine = fs.readFileSync(file.path, "utf8").split("\n")[0];
    delimiter = firstLine.includes(";") ? ";" : ",";
  } catch (error) {
    throw new AppError("ERR_INVALID_CSV", 400);
  }

  const parser = csvParser({ delimiter, columns: true }, async (err, data) => {
    if (err) {
      throw new AppError("ERR_INVALID_CSV", 400);
    }

    data.forEach(async (record: any) => {
      let extraInfo: any[];
      try {
        extraInfo = JSON.parse(record.ExtraInfo);
      } catch (error) {
        extraInfo = [];
      }

      const contact = {
        companyId,
        name: record.name || record.Name,
        number: record.number || record.Number,
        email: record.email || record.Email,
        extraInfo
      };

      Object.keys(record).forEach((key: string) => {
        if (
          key !== "name" &&
          key !== "number" &&
          key !== "email" &&
          key !== "Name" &&
          key !== "Number" &&
          key !== "Email" &&
          key !== "ExtraInfo" &&
          record[key]
        ) {
          contact.extraInfo.push({
            name: key,
            value: record[key]
          });
        }
      });

      try {
        const newContact = await CreateContactService(contact);
        const io = getIO();
        io.to(`company-${companyId}-mainchannel`).emit(
          `company-${companyId}-contact`,
          {
            action: "update",
            contact: newContact
          }
        );
      } catch (error) {
        logger.error({ contact }, `Error creating contact: ${error.message}`);
      }
    });
  });

  const readable = fs.createReadStream(file.path);

  parser.on("end", () => {
    readable.destroy();
    fs.unlinkSync(file.path);
  });

  readable.pipe(parser);

  return res.status(200).json({ message: "Contacts being imported" });
};

export const exportCsv = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;

  const contacts = await Contact.findAll({
    where: {
      companyId,
      channel: "whatsapp",
      isGroup: false
    },
    include: [
      {
        model: ContactCustomField,
        as: "extraInfo"
      }
    ]
  });

  const records = contacts.map((contact: any) => {
    const extraInfo = contact.extraInfo.map((info: any) => ({
      name: info.name,
      value: info.value
    }));

    return {
      Name: contact.name,
      Number: contact.number,
      Email: contact.email || "",
      ExtraInfo: JSON.stringify(extraInfo)
    };
  });

  stringify(
    records,
    { header: true, delimiter: csvDetectDelimiter(req) },
    (err, output) => {
      if (err) {
        throw new AppError("ERR_GENERATING_CSV", 500);
      }

      res.setHeader("Content-disposition", "attachment; filename=contacts.csv");
      res.set("Content-Type", "text/csv");
      res.status(200).send(output);
    }
  );

  return res;
};

/** Mídias, documentos e links trocados com o contato (dados do contato). */
/**
 * Foto do contato na hora (busca de contatos). Quem nunca conversou ficava
 * sem foto até abrir um atendimento. Pede ao WhatsApp pela conexão da
 * empresa, grava no contato e guarda no cache (sem foto, por menos tempo).
 */
export const profilePicture = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const contact = await ShowContactService(contactId, companyId);

  const cacheKey = `picurl_contact:${contact.id}`;
  const cached = await cacheLayer.get(cacheKey);
  if (cached) {
    return res.status(200).json({ url: cached === "none" ? null : cached });
  }

  let wbot = null;
  let url: string | null = null;
  try {
    wbot = getWbot((await GetDefaultWhatsApp(companyId)).id);
    url =
      (await wbot.profilePictureUrl(getJidOf(contact), "preview", 5000)) ||
      null;
  } catch {
    url = null;
  }

  // sem conexão não guarda "sem foto": ao conectar, tenta de novo
  if (wbot) {
    await cacheLayer.set(
      cacheKey,
      url || "none",
      "EX",
      url ? 60 * 60 * 6 : 60 * 60
    );
  }
  if (url && url !== contact.profilePicUrl) {
    await contact.update({ profilePicUrl: url });
  }

  return res.status(200).json({ url });
};

export const media = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;
  const kind = ["media", "docs", "links"].includes(String(req.query.kind))
    ? (req.query.kind as ContactMediaKind)
    : "media";
  const pageNumber = Number(req.query.pageNumber) || 1;

  const contact = await ShowContactService(contactId, companyId);

  const result = await ListContactMediaService({
    contactId: contact.id,
    companyId,
    kind,
    pageNumber
  });

  return res.status(200).json(result);
};

/**
 * Salva o contato na agenda do celular conectado (WhatsApp da empresa),
 * como se tivesse sido adicionado no próprio aparelho.
 */
export const syncToPhone = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const contact = await ShowContactService(contactId, companyId);
  const jid = await SyncContactToPhone(contact);
  if (!contact.syncToPhone) await contact.update({ syncToPhone: true });

  return res.status(200).json({ synced: true, jid });
};

/**
 * Apaga os contatos importados que nunca conversaram: sem nenhum atendimento
 * e sem agendamento. Contatos com conversa ficam (apagar o contato apagaria
 * as conversas junto).
 */
export const removeImported = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, profile } = req.user;
  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const [, meta] = (await Contact.sequelize.query(
    `DELETE FROM "Contacts" c
      WHERE c."companyId" = :companyId
        AND c."isGroup" = false
        AND NOT EXISTS (SELECT 1 FROM "Tickets" t WHERE t."contactId" = c."id")
        AND NOT EXISTS (SELECT 1 FROM "Schedules" s WHERE s."contactId" = c."id")`,
    { replacements: { companyId } }
  )) as [unknown, { rowCount?: number }];

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(
    `company-${companyId}-contact`,
    { action: "reload" }
  );

  return res.status(200).json({ deleted: meta?.rowCount ?? 0 });
};
