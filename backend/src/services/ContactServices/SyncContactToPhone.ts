import Contact from "../../models/Contact";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";

/**
 * Salva o contato na agenda do celular conectado, com o nome escolhido aqui.
 *
 * Grava sempre pelo número (`5519...@s.whatsapp.net`). A busca no WhatsApp
 * pode devolver o identificador interno novo (LID) e gravar a agenda por ele
 * desmontava o contato que já existia no aparelho — era o contato "sumindo"
 * depois de sincronizar. Nome vazio (ou igual ao número) não é enviado, para
 * não apagar o nome que está no celular.
 */
const SyncContactToPhone = async (contact: Contact): Promise<string> => {
  if (contact.isGroup) throw new AppError("ERR_CONTACT_IS_GROUP", 400);

  const number = String(contact.number || "").replace(/\D/g, "");
  if (number.length < 8) throw new AppError("ERR_INVALID_NUMBER", 400);

  const fullName = String(contact.name || "").trim();
  if (!fullName || fullName.replace(/\D/g, "") === number) {
    throw new AppError("ERR_CONTACT_NO_NAME", 400);
  }

  const whatsapp = await GetDefaultWhatsApp(contact.companyId);
  const wbot = getWbot(whatsapp.id);

  const [onWhatsApp] = (await wbot.onWhatsApp(number)) || [];
  if (!onWhatsApp?.exists) throw new AppError("ERR_WAPP_INVALID_CONTACT", 400);

  const jid = `${number}@s.whatsapp.net`;
  const lidJid = String(onWhatsApp.jid || "").endsWith("@lid")
    ? String(onWhatsApp.jid)
    : undefined;

  await wbot.addOrEditContact(jid, {
    fullName,
    firstName: fullName.split(" ")[0],
    saveOnPrimaryAddressbook: true,
    ...(lidJid ? { lidJid } : {})
  });

  logger.info(
    { contactId: contact.id, companyId: contact.companyId },
    "Contato salvo na agenda do celular"
  );
  return jid;
};

/** Mesma coisa, mas sem derrubar quem chamou se der errado. */
export const trySyncContactToPhone = async (
  contact: Contact
): Promise<void> => {
  if (!contact?.syncToPhone) return;
  try {
    await SyncContactToPhone(contact);
  } catch (error) {
    logger.warn(
      { contactId: contact.id, message: error?.message },
      "não consegui salvar o contato na agenda do celular"
    );
  }
};

export default SyncContactToPhone;
