import AppError from "../../errors/AppError";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import { getPublicPath } from "../../helpers/GetPublicPath";
import { transcriber } from "../../helpers/transcriber";
import Message from "../../models/Message";
import Queue from "../../models/Queue";

interface Request {
  messageId: string;
  companyId: number;
}

/**
 * Transcreve um áudio sob demanda (botão "transcrever" no balão).
 * O texto fica no body da mensagem, como já era com a transcrição
 * automática — assim o assistente de IA das filas continua enxergando.
 */
const TranscribeMessageService = async ({
  messageId,
  companyId
}: Request): Promise<Message> => {
  const message = await Message.findOne({
    where: { id: messageId, companyId }
  });

  if (!message) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }

  if (message.mediaType !== "audio") {
    throw new AppError("ERR_NOT_AUDIO", 400);
  }

  const enabled = await GetCompanySetting(
    companyId,
    "audioTranscriptions",
    "disabled"
  );
  const apiKey = await GetCompanySetting(companyId, "openAiKey", null);
  if (enabled !== "enabled" || !apiKey) {
    throw new AppError("ERR_TRANSCRIPTION_DISABLED", 400);
  }
  const provider = await GetCompanySetting(companyId, "aiProvider", "openai");

  const mediaPath: string = message.getDataValue("mediaUrl");
  if (!mediaPath) {
    throw new AppError("ERR_TRANSCRIPTION_FAILED", 500);
  }

  const text = await transcriber(
    mediaPath.startsWith("http")
      ? mediaPath
      : `${getPublicPath()}/${mediaPath}`,
    { apiKey, provider },
    mediaPath.split("/").pop()
  );

  if (!text) {
    throw new AppError("ERR_TRANSCRIPTION_FAILED", 500);
  }

  await message.update({ body: text });

  // mesmo formato da listagem: o frontend troca a mensagem inteira
  return message.reload({
    include: [
      "contact",
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"],
        where: { companyId },
        required: false
      },
      {
        model: Message,
        as: "replies",
        where: { ticketId: message.ticketId },
        include: ["contact"],
        required: false
      },
      { model: Queue, as: "queue" }
    ]
  });
};

export default TranscribeMessageService;
