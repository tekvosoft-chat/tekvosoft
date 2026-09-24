import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  configOf,
  historyFor,
  inboxByToken,
  receiveFromVisitor,
  receiveFileFromVisitor,
  closeVisitorTicket,
  visitorTicket
} from "../services/WebchatServices/WebchatService";

/**
 * O que o widget do site conversa com o servidor.
 *
 * Tudo aqui é público: quem abre o site não tem login. O que identifica a
 * caixa de entrada é o token no endereço, e o visitante é identificado pelo
 * número de sessão que o próprio navegador guarda.
 */
export const config = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const inbox = await inboxByToken(req.params.token);
  return res.json(configOf(inbox));
};

/** Abre (ou retoma) a conversa daquele navegador. */
export const session = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const inbox = await inboxByToken(req.params.token);
  const sessionId = String(req.body?.sessionId || "").trim() || uuidv4();
  const { ticket } = await visitorTicket(inbox, sessionId, {
    name: req.body?.name,
    email: req.body?.email
  });
  const messages = await historyFor(inbox, sessionId);

  return res.json({
    sessionId,
    ticketId: ticket.id,
    config: configOf(inbox),
    messages
  });
};

/** Mensagem escrita por quem está no site. */
export const store = async (req: Request, res: Response): Promise<Response> => {
  const inbox = await inboxByToken(req.params.token);
  const sessionId = String(req.body?.sessionId || "").trim();
  if (!sessionId) return res.status(400).json({ error: "ERR_NO_SESSION" });

  const message = await receiveFromVisitor(inbox, sessionId, req.body?.body, {
    name: req.body?.name,
    email: req.body?.email
  });
  return res.json({ id: message.id, createdAt: message.createdAt });
};

/** Arquivo enviado por quem está no site. */
export const upload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const inbox = await inboxByToken(req.params.token);
  const sessionId = String(req.body?.sessionId || "").trim();
  const [media] = (req.files as Express.Multer.File[]) || [];
  if (!sessionId || !media) {
    return res.status(400).json({ error: "ERR_NO_FILE" });
  }
  const message = await receiveFileFromVisitor(inbox, sessionId, media);
  return res.json({ id: message.id, mediaUrl: message.mediaUrl });
};

/** Encerrar a conversa pelo próprio widget. */
export const close = async (req: Request, res: Response): Promise<Response> => {
  const inbox = await inboxByToken(req.params.token);
  const sessionId = String(req.body?.sessionId || "").trim();
  if (!sessionId) return res.status(400).json({ error: "ERR_NO_SESSION" });
  await closeVisitorTicket(inbox, sessionId);
  return res.json({ ok: true });
};

/** Histórico, para quando o navegador reabre a página. */
export const index = async (req: Request, res: Response): Promise<Response> => {
  const inbox = await inboxByToken(req.params.token);
  const sessionId = String(req.query?.sessionId || "").trim();
  if (!sessionId) return res.status(400).json({ error: "ERR_NO_SESSION" });
  const messages = await historyFor(inbox, sessionId);
  return res.json(messages);
};
