import { useContext, useEffect, useState } from "react";

import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

/**
 * Chamados de suporte com novidade para quem está logado: para o cliente,
 * respostas do suporte ainda não lidas; para o super admin, chamados novos
 * ou respondidos pelo cliente. Vira o selo do menu "Ajuda".
 */
const useSupportUnread = () => {
  const socketManager = useContext(SocketContext);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get("/support/unread")
        .then(({ data }) => alive && setCount(Number(data?.count) || 0))
        .catch(() => {});
    load();
    const timer = setInterval(load, 2 * 60 * 1000);
    const socket = socketManager.GetSocket(localStorage.getItem("companyId"));
    socket.on("support-ticket", load);
    return () => {
      alive = false;
      clearInterval(timer);
      socket.off?.("support-ticket", load);
      socket.disconnect();
    };
  }, [socketManager]);

  return count;
};

export default useSupportUnread;
