import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { sendWhatsappUpdate } from "../WhatsappService/SocketSendWhatsappUpdate";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number,
  isRefresh = false
): Promise<void> => {
  await whatsapp.update({ status: "OPENING" });

  sendWhatsappUpdate(whatsapp);

  try {
    await initWASocket(whatsapp, null, isRefresh);
  } catch (err) {
    logger.error(err);
  }
};
