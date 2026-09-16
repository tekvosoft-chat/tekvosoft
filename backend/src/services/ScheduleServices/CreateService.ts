import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Schedule from "../../models/Schedule";
import Contact from "../../models/Contact";

interface Request {
  body: string;
  sendAt: Date;
  contactId: number;
  companyId: number;
  userId?: number;
  saveMessage?: boolean;
  mediaPath?: string;
  mediaName?: string;
}

const CreateService = async ({
  body,
  sendAt,
  contactId,
  companyId,
  userId,
  saveMessage,
  mediaPath,
  mediaName
}: Request): Promise<Schedule> => {
  // com imagem, o texto vira legenda e pode ser curto
  const schema = Yup.object().shape({
    body: mediaPath ? Yup.string() : Yup.string().required().min(1),
    sendAt: Yup.string().required()
  });

  try {
    await schema.validate({ body, sendAt });
  } catch (err) {
    throw new AppError(err.message);
  }

  const schedule = await Schedule.create({
    body,
    sendAt,
    contactId,
    companyId,
    userId,
    saveMessage,
    mediaPath: mediaPath || null,
    mediaName: mediaName || null,
    status: "PENDENTE"
  });

  await schedule.reload({
    include: [{ model: Contact, as: "contact" }]
  });

  return schedule;
};

export default CreateService;
