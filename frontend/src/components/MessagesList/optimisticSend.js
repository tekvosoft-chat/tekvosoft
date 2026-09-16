/**
 * Envio com o balão "saindo" da barra.
 *
 * Assim que a pessoa aperta enviar, a mensagem entra na conversa na hora
 * (com o reloginho) e o PRÓPRIO balão desliza da barra de envio até o lugar
 * dele — nada de cópia voando por cima. Quando o servidor confirma, a
 * mensagem de verdade assume o lugar do balão provisório sem piscar.
 */
export const SENDING_EVENT = "tkv:message-sending";
export const FAILED_EVENT = "tkv:message-failed";
export const PROGRESS_EVENT = "tkv:message-progress";

let seq = 0;

export const announceSending = ({
  ticketId,
  body,
  quotedMsg,
  inputEl,
  media
}) => {
  const id = `pending-${Date.now().toString(36)}-${(seq += 1)}`;
  const rect = inputEl?.getBoundingClientRect?.();
  window.dispatchEvent(
    new CustomEvent(SENDING_EVENT, {
      detail: {
        id,
        ticketId,
        body,
        quotedMsg: quotedMsg || null,
        // foto/vídeo: { url (objectURL local), type: "image" | "video" }
        media: media || null,
        from: rect
          ? {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height
            }
          : null
      }
    })
  );
  return id;
};

/** Andamento do upload de uma mídia (0–100). */
export const announceProgress = (id, progress) =>
  window.dispatchEvent(
    new CustomEvent(PROGRESS_EVENT, { detail: { id, progress } })
  );

export const announceFailed = id =>
  window.dispatchEvent(new CustomEvent(FAILED_EVENT, { detail: { id } }));

export const pendingMessage = ({ id, ticketId, body, quotedMsg, media }) => {
  const now = new Date().toISOString();
  if (media?.url) {
    // a foto/vídeo aparece na conversa na hora, com o anel de envio por cima
    return {
      id,
      clientKey: id,
      pending: true,
      uploadProgress: 0,
      ticketId,
      fromMe: true,
      body: "",
      mediaType: media.type,
      mediaUrl: media.url,
      ack: 0,
      read: true,
      isDeleted: false,
      quotedMsg,
      dataJson: null,
      createdAt: now,
      updatedAt: now,
      replies: []
    };
  }
  return {
    id,
    clientKey: id,
    pending: true,
    ticketId,
    fromMe: true,
    body,
    mediaType: "chat",
    ack: 1,
    read: true,
    isDeleted: false,
    quotedMsg,
    dataJson: null,
    createdAt: now,
    updatedAt: now,
    replies: []
  };
};

const normalize = text =>
  String(text || "")
    .replace(/\s+/g, " ")
    .trim();

/** A mensagem confirmada corresponde a este balão provisório? */
export const matchesPending = (pending, message) => {
  if (pending?.pending && pending.mediaUrl) {
    // mídia: a confirmação é a próxima mídia minha do mesmo tipo, criada
    // depois do envio (as fotos antigas da conversa não contam)
    return (
      !!message?.fromMe &&
      !!message.mediaUrl &&
      message.mediaType === pending.mediaType &&
      new Date(message.createdAt) >= new Date(pending.createdAt) - 10000
    );
  }
  return matchesText(pending, message);
};

const matchesText = (pending, message) =>
  pending?.pending &&
  message?.fromMe &&
  message.mediaType !== "reactionMessage" &&
  normalize(pending.body) === normalize(message.body);

/**
 * Anima o balão (já na posição final) a partir do campo de texto: começa
 * sobre a barra, um pouco menor e transparente, e assenta com um leve
 * "quique" no fim.
 */
export const flyFromComposer = (element, from) => {
  if (!element || !from || !element.animate) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const to = element.getBoundingClientRect();
  if (!to.width) return;
  const dx = from.left + 12 - to.left;
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const scale = Math.max(0.6, Math.min(1, (from.width * 0.9) / to.width));
  element.animate(
    [
      {
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity: 0.35,
        borderRadius: "22px"
      },
      {
        transform: `translate(${dx * 0.08}px, -6px) scale(1.02)`,
        opacity: 1,
        offset: 0.75
      },
      { transform: "none", opacity: 1 }
    ],
    { duration: 460, easing: "cubic-bezier(.22, .9, .3, 1)" }
  );
};
