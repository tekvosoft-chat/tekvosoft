import { Request, Response } from "express";
import AppError from "../errors/AppError";
import GroupInfoService, {
  forgetGroupMetadata,
  groupMetadataOf,
  groupTicket
} from "../services/GroupServices/GroupInfoService";
import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";

/** Dados do grupo do atendimento (painel "Dados do grupo"). */
export const show = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;
  return res.json(await GroupInfoService(ticketId, companyId));
};

/**
 * Foto de um membro, pedida só quando a linha dele aparece na tela.
 * SEGURANÇA: só de quem é membro deste grupo — a rota não serve para
 * consultar a foto de qualquer número pela conexão da empresa.
 */
export const participantPicture = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;
  const id = String(req.query.id || "");

  const { ticket, wbot, jid } = await groupTicket(ticketId, companyId);
  const metadata = await groupMetadataOf(ticket, wbot, jid);
  if (!metadata?.participants.some(p => p.id === id)) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }

  let url: string | null = null;
  try {
    url = (await GetProfilePicUrl(id, "preview", wbot)) || null;
  } catch {
    url = null;
  }
  return res.json({ url });
};

/** Sai do grupo com a conexão do atendimento. */
export const leave = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId, profile } = req.user;
  if (profile !== "admin") throw new AppError("ERR_NO_PERMISSION", 403);

  const { ticket, wbot, jid } = await groupTicket(ticketId, companyId);
  try {
    await wbot.groupLeave(jid);
  } catch {
    throw new AppError("ERR_GROUP_LEAVE", 400);
  }
  await forgetGroupMetadata(ticket, jid);
  return res.json({ ok: true });
};

/** Volta para o grupo pelo link de convite (chat.whatsapp.com/…). */
export const join = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId, profile } = req.user;
  if (profile !== "admin") throw new AppError("ERR_NO_PERMISSION", 403);

  const link = String(req.body?.link || "").trim();
  const code = link.match(
    /(?:chat\.whatsapp\.com\/(?:invite\/)?)?([\w-]{10,})\/?$/
  )?.[1];
  if (!code) throw new AppError("ERR_INVALID_INVITE", 400);

  const { ticket, wbot, jid } = await groupTicket(ticketId, companyId);
  let joined: string | undefined;
  try {
    joined = await wbot.groupAcceptInvite(code);
  } catch {
    throw new AppError("ERR_INVALID_INVITE", 400);
  }
  // o link precisa ser deste grupo
  if (joined && joined !== jid) {
    await wbot.groupLeave(joined).catch(() => {});
    throw new AppError("ERR_INVITE_OTHER_GROUP", 400);
  }
  await forgetGroupMetadata(ticket, jid);
  return res.json({ ok: true });
};
