import React, { useEffect, useState } from "react";
import Avatar from "@material-ui/core/Avatar";

import api from "../../services/api";

// Foto de quem aparece na busca. Sem foto (nunca conversou) ou com o link
// do WhatsApp vencido, pede na hora em vez de esperar abrir uma conversa.
// Um pedido por contato enquanto a página estiver aberta.
const requests = new Map();
const fetchPicture = id => {
  if (!requests.has(id)) {
    requests.set(
      id,
      api
        .get(`/contacts/${id}/profile-picture`)
        .then(({ data }) => data?.url || null)
        .catch(() => null)
    );
  }
  return requests.get(id);
};

const ContactPicture = ({ contact, className }) => {
  const [src, setSrc] = useState(contact.profilePicUrl || null);

  useEffect(() => {
    let alive = true;
    setSrc(contact.profilePicUrl || null);
    const ask = () =>
      fetchPicture(contact.id).then(url => alive && url && setSrc(url));
    if (!contact.profilePicUrl) {
      ask();
    } else {
      const probe = new Image();
      probe.onerror = ask;
      probe.src = contact.profilePicUrl;
    }
    return () => {
      alive = false;
    };
  }, [contact.id, contact.profilePicUrl]);

  return (
    <Avatar src={src || undefined} className={className}>
      {(contact.name || "?").trim().charAt(0).toUpperCase()}
    </Avatar>
  );
};

export default ContactPicture;
