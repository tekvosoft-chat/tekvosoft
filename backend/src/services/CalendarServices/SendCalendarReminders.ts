import moment from "moment";
import { Op } from "sequelize";
import CalendarEvent from "../../models/CalendarEvent";
import Chat from "../../models/Chat";
import { getIO } from "../../libs/socket";
import { sendPushToUsers } from "../PushServices/WebPushService";
import { logger } from "../../utils/logger";

const LABEL: Record<string, string> = {
  call: "Ligação",
  reminder: "Lembrete",
  event: "Evento"
};

/**
 * Lembretes da agenda: na hora escolhida (X minutos antes), o dono e os
 * convidados recebem o aviso na tela e no celular. Numa ligação do chat
 * interno o aviso já leva para a sala. Roda a cada minuto.
 */
const SendCalendarReminders = async (): Promise<void> => {
  const now = Date.now();
  const events = await CalendarEvent.findAll({
    where: {
      remindMinutes: { [Op.ne]: null },
      remindedAt: null,
      startAt: {
        [Op.gte]: new Date(now - 10 * 60000),
        [Op.lte]: new Date(now + 25 * 60 * 60000)
      }
    },
    include: [{ model: Chat, as: "chat", attributes: ["id", "uuid", "title"] }]
  });

  const due = events.filter(
    event =>
      new Date(event.startAt).getTime() - event.remindMinutes * 60000 <= now
  );

  await Promise.all(
    due.map(async event => {
      try {
        await event.update({ remindedAt: new Date() });
        const people = [
          ...new Set([event.userId, ...(event.participantIds || [])])
        ].filter(Boolean) as number[];
        const minutes = Math.round(
          (new Date(event.startAt).getTime() - now) / 60000
        );
        const when =
          minutes > 1
            ? `em ${minutes} min (${moment(event.startAt).format("HH:mm")})`
            : "agora";
        const url =
          event.type === "call" && event.chat?.uuid
            ? `/chats/${event.chat.uuid}?call=1`
            : "/schedules";

        const io = getIO();
        people.forEach(id =>
          io
            .to(`user-${id}`)
            .emit(`company-${event.companyId}-calendar-reminder`, {
              event,
              minutes,
              url
            })
        );
        await sendPushToUsers(event.companyId, people, {
          title: `${LABEL[event.type] || "Evento"} ${when}`,
          body: event.title,
          tag: `calendar-${event.id}`,
          url
        });
      } catch (error) {
        logger.warn(
          { eventId: event.id, message: error?.message },
          "lembrete da agenda"
        );
      }
    })
  );
};

export default SendCalendarReminders;
