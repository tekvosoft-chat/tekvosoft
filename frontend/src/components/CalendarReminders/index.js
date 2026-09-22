import React, { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import moment from "moment";

import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { haptic } from "../../helpers/haptics";

/**
 * Lembretes da Agenda com o sistema aberto: na hora escolhida aparece um
 * aviso; numa ligação do chat interno, com o botão para entrar direto.
 * (Com o app fechado, quem avisa é a notificação do celular.)
 */
const LABEL = { call: "Ligação", reminder: "Lembrete", event: "Evento" };

const CalendarReminders = () => {
  const history = useHistory();
  const socketManager = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user?.companyId) return undefined;
    const socket = socketManager.GetSocket(user.companyId);
    const onReminder = ({ event, minutes, url }) => {
      if (!event) return;
      haptic("notify");
      const when =
        minutes > 1
          ? `em ${minutes} min · ${moment(event.startAt).format("HH:mm")}`
          : "agora";
      toast.info(
        <div>
          <strong>
            {LABEL[event.type] || "Evento"} {when}
          </strong>
          <div>{event.title}</div>
          {url && (
            <button
              type="button"
              onClick={() => history.push(url)}
              style={{
                marginTop: 8,
                padding: "6px 14px",
                border: 0,
                borderRadius: 999,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {event.type === "call" ? "Entrar na ligação" : "Abrir agenda"}
            </button>
          )}
        </div>,
        { toastId: `calendar-${event.id}`, autoClose: 15000 }
      );
    };
    socket.on(`company-${user.companyId}-calendar-reminder`, onReminder);
    return () => socket.disconnect();
  }, [socketManager, user?.companyId, history]);

  return null;
};

export default CalendarReminders;
