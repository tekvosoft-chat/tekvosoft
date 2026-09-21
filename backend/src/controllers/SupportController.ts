import { Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";

import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";
import Company from "../models/Company";
import SupportMessage, { SupportAttachment } from "../models/SupportMessage";
import SupportTicket from "../models/SupportTicket";
import User from "../models/User";
import supportFiles from "../config/supportFiles";

/**
 * Chamados de suporte.
 *
 * Quem é cliente vê e abre chamados da própria empresa; o super admin vê
 * todos (é o kanban dele) e responde como "suporte". Anexos ficam na pasta
 * privada e só saem por /support/attachments, para quem pode ver o chamado.
 */

const STATUSES = ["open", "in_progress", "waiting", "resolved"];
const CATEGORIES = ["question", "problem", "billing", "suggestion"];
const PRIORITIES = ["low", "normal", "high"];

type Files = Express.Multer.File[] | undefined;

const attachmentsOf = (files: Files): SupportAttachment[] =>
  (files || []).map(file => ({
    id: crypto.randomBytes(8).toString("hex"),
    name: file.originalname.slice(0, 180),
    mimetype: file.mimetype,
    size: file.size,
    path: path.relative(supportFiles.directory, file.path)
  }));

const publicMessage = (message: SupportMessage) => {
  const data = message.toJSON() as SupportMessage;
  return {
    ...data,
    attachments: (data.attachments || []).map(({ path: _p, ...rest }) => rest)
  };
};

const emit = (ticket: SupportTicket, action: string) => {
  getIO()
    .to("super")
    .to(`company-${ticket.companyId}-mainchannel`)
    .emit("support-ticket", {
      action,
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
};

const loadTicket = async (id: string | number, req: Request) => {
  const ticket = await SupportTicket.findByPk(id, {
    include: [
      { model: Company, as: "company", attributes: ["id", "name", "email"] },
      { model: User, as: "user", attributes: ["id", "name", "email"] }
    ]
  });
  // de outra empresa responde como "não encontrado": não revela que existe
  if (
    !ticket ||
    (!req.user.isSuper && ticket.companyId !== req.user.companyId)
  ) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }
  return ticket;
};

const text = (value: unknown, max: number) =>
  String(value || "")
    .trim()
    .slice(0, max);

/** Lista: o super vê todos; o cliente, os da empresa dele. */
export const index = async (req: Request, res: Response): Promise<Response> => {
  const { isSuper, companyId } = req.user;
  const search = text(req.query.search, 100);

  const where: Record<string, unknown> = isSuper ? {} : { companyId };
  if (search) where.subject = { [Op.iLike]: `%${search}%` };

  const tickets = await SupportTicket.findAll({
    where,
    include: [
      { model: Company, as: "company", attributes: ["id", "name"] },
      { model: User, as: "user", attributes: ["id", "name"] }
    ],
    order: [["lastMessageAt", "DESC"]],
    limit: 400
  });

  // prévia da última mensagem de cada chamado
  const ids = tickets.map(t => t.id);
  const last = ids.length
    ? await SupportMessage.findAll({
        where: { ticketId: { [Op.in]: ids }, kind: "message" },
        attributes: [
          "ticketId",
          "body",
          "fromSupport",
          "attachments",
          "createdAt"
        ],
        order: [["createdAt", "DESC"]]
      })
    : [];
  const preview = new Map<number, SupportMessage>();
  last.forEach(m => {
    if (!preview.has(m.ticketId)) preview.set(m.ticketId, m);
  });

  return res.json(
    tickets.map(ticket => {
      const m = preview.get(ticket.id);
      return {
        ...ticket.toJSON(),
        preview: m
          ? {
              body: m.body.slice(0, 160),
              fromSupport: m.fromSupport,
              attachments: (m.attachments || []).length,
              createdAt: m.createdAt
            }
          : null
      };
    })
  );
};

/** Quantos chamados têm novidade para quem está olhando (selo no menu). */
export const unread = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { isSuper, companyId } = req.user;
  const count = await SupportTicket.count({
    where: isSuper
      ? { unreadBySupport: true }
      : { companyId, unreadByClient: true }
  });
  return res.json({ count });
};

/** Um chamado com a conversa. Abrir marca como lido do lado de quem abriu. */
export const show = async (req: Request, res: Response): Promise<Response> => {
  const ticket = await loadTicket(req.params.id, req);
  const messages = await SupportMessage.findAll({
    where: { ticketId: ticket.id },
    include: [{ model: User, as: "user", attributes: ["id", "name"] }],
    order: [["createdAt", "ASC"]]
  });

  const flag = req.user.isSuper ? "unreadBySupport" : "unreadByClient";
  if (ticket[flag]) {
    await ticket.update({ [flag]: false });
    emit(ticket, "read");
  }

  return res.json({
    ...ticket.toJSON(),
    messages: messages.map(publicMessage)
  });
};

/** Abre um chamado (assunto, categoria, prioridade, descrição e anexos). */
export const store = async (req: Request, res: Response): Promise<Response> => {
  const { id: userId, companyId } = req.user;
  const subject = text(req.body.subject, 160);
  const body = text(req.body.body, 5000);
  const category = CATEGORIES.includes(req.body.category)
    ? req.body.category
    : "question";
  const priority = PRIORITIES.includes(req.body.priority)
    ? req.body.priority
    : "normal";
  const files = req.files as Files;

  if (!subject || (!body && !files?.length)) {
    throw new AppError("ERR_SUPPORT_REQUIRED", 400);
  }

  const now = new Date();
  const ticket = await SupportTicket.create({
    companyId,
    userId: Number(userId),
    subject,
    category,
    priority,
    status: "open",
    unreadBySupport: true,
    unreadByClient: false,
    lastMessageAt: now
  });
  await SupportMessage.create({
    ticketId: ticket.id,
    userId: Number(userId),
    fromSupport: false,
    body,
    attachments: attachmentsOf(files)
  });

  emit(ticket, "create");
  return res.status(201).json(ticket);
};

/** Responde no chamado. O super responde como suporte. */
export const reply = async (req: Request, res: Response): Promise<Response> => {
  const ticket = await loadTicket(req.params.id, req);
  const body = text(req.body.body, 5000);
  const files = req.files as Files;
  if (!body && !files?.length) throw new AppError("ERR_SUPPORT_REQUIRED", 400);

  const fromSupport = !!req.user.isSuper;
  const message = await SupportMessage.create({
    ticketId: ticket.id,
    userId: Number(req.user.id),
    fromSupport,
    body,
    attachments: attachmentsOf(files)
  });

  // resposta do suporte: o cliente tem novidade e o chamado anda.
  // resposta do cliente: volta para o suporte (e reabre se estava resolvido)
  const changes: Partial<SupportTicket> = { lastMessageAt: new Date() };
  if (fromSupport) {
    changes.unreadByClient = true;
    if (ticket.status === "open") changes.status = "in_progress";
  } else {
    changes.unreadBySupport = true;
    if (ticket.status === "waiting") changes.status = "in_progress";
    if (ticket.status === "resolved") changes.status = "open";
  }
  await ticket.update(changes);

  emit(ticket, "message");
  await message.reload({
    include: [{ model: User, as: "user", attributes: ["id", "name"] }]
  });
  return res.status(201).json(publicMessage(message));
};

/**
 * Muda a etapa (e a prioridade). O super move no kanban; o cliente só pode
 * dar o próprio chamado por resolvido ou reabrir. Cada mudança de etapa
 * aparece na conversa, para o cliente acompanhar.
 */
export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const ticket = await loadTicket(req.params.id, req);
  const { isSuper } = req.user;
  const status = req.body.status as string | undefined;
  const priority = req.body.priority as string | undefined;
  const changes: Partial<SupportTicket> = {};

  if (status !== undefined) {
    if (!STATUSES.includes(status))
      throw new AppError("ERR_SUPPORT_STATUS", 400);
    if (!isSuper && !["resolved", "open"].includes(status)) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    if (status !== ticket.status) changes.status = status;
  }
  if (priority !== undefined && isSuper && PRIORITIES.includes(priority)) {
    changes.priority = priority;
  }
  if (!Object.keys(changes).length) return res.json(ticket);

  if (changes.status) {
    await SupportMessage.create({
      ticketId: ticket.id,
      userId: Number(req.user.id),
      fromSupport: !!isSuper,
      kind: "status",
      body: changes.status
    });
    changes.lastMessageAt = new Date();
    if (isSuper) changes.unreadByClient = true;
    else changes.unreadBySupport = true;
  }
  await ticket.update(changes);

  emit(ticket, "update");
  return res.json(ticket);
};

/** Anexo de uma mensagem, só para quem pode ver o chamado. */
export const attachment = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  const message = await SupportMessage.findByPk(req.params.messageId);
  if (!message) throw new AppError("ERR_NOT_FOUND", 404);
  await loadTicket(message.ticketId, req);

  const file = (message.attachments || []).find(
    a => a.id === req.params.attachmentId
  );
  const fullPath = file?.path
    ? path.resolve(supportFiles.directory, file.path)
    : null;
  // o caminho gravado precisa continuar dentro da pasta de suporte
  if (
    !fullPath ||
    !fullPath.startsWith(supportFiles.directory + path.sep) ||
    !fs.existsSync(fullPath)
  ) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }

  res.setHeader("Content-Type", file.mimetype || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`
  );
  res.setHeader("Cache-Control", "private, max-age=86400");
  return res.sendFile(fullPath);
};

/**
 * Exclui o chamado de vez (só o super admin): conversa e anexos, inclusive
 * os arquivos na pasta privada. O cliente deixa de ver na hora.
 */
export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.user.isSuper) throw new AppError("ERR_NO_PERMISSION", 403);
  const ticket = await loadTicket(req.params.id, req);

  const messages = await SupportMessage.findAll({
    where: { ticketId: ticket.id },
    attributes: ["attachments"]
  });
  messages.forEach(message =>
    (message.attachments || []).forEach(file => {
      if (!file.path) return;
      const fullPath = path.resolve(supportFiles.directory, file.path);
      if (fullPath.startsWith(supportFiles.directory + path.sep)) {
        fs.promises.unlink(fullPath).catch(() => {});
      }
    })
  );

  await ticket.destroy();
  emit(ticket, "delete");
  return res.json({ ok: true });
};
