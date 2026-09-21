import { Request, Response } from "express";
import { Op, QueryTypes } from "sequelize";

import sequelize from "../database";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";
import { activeCallsFor } from "../libs/chatCalls";
import Chat from "../models/Chat";
import ChatUser from "../models/ChatUser";
import User from "../models/User";

/**
 * Partes do chat interno no estilo Discord que não são mensagem: conversa
 * avulsa com alguém, busca de pessoas e grupos da empresa, entrar e sair
 * de grupo, membros com quem está online e quem está em chamada.
 */

const USER_ATTRS = [
  "id",
  "name",
  "email",
  "profile",
  "profileImage",
  "createdAt"
];

const onlineIds = async (userIds: number[]): Promise<Set<number>> => {
  if (!userIds.length) return new Set();
  const rows = await sequelize.query<{ userId: number }>(
    `SELECT DISTINCT "userId" FROM "UserSocketSessions"
      WHERE active = true AND "userId" IN (:ids)`,
    { type: QueryTypes.SELECT, replacements: { ids: userIds } }
  );
  return new Set(rows.map(r => Number(r.userId)));
};

const chatWithUsers = (id: number) =>
  Chat.findByPk(id, {
    include: [
      { model: User, as: "owner", attributes: ["id", "name"] },
      {
        model: ChatUser,
        as: "users",
        include: [{ model: User, as: "user", attributes: USER_ATTRS }]
      }
    ]
  });

const notifyMembers = (chat: Chat, action: string) => {
  const io = getIO();
  (chat.users || []).forEach(member =>
    io
      .to(`user-${member.userId}`)
      .emit(`company-${chat.companyId}-chat-user-${member.userId}`, {
        action,
        record: chat
      })
  );
};

/** Abre (ou reaproveita) a conversa avulsa com outra pessoa da empresa. */
export const direct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const me = Number(req.user.id);
  const { companyId } = req.user;
  const otherId = Number(req.body?.userId);

  const other = await User.findOne({ where: { id: otherId, companyId } });
  if (!other || otherId === me) throw new AppError("ERR_NOT_FOUND", 404);

  // já existe conversa avulsa entre os dois?
  const [found] = await sequelize.query<{ id: number }>(
    `SELECT c.id FROM "Chats" c
       JOIN "ChatUsers" a ON a."chatId" = c.id AND a."userId" = :me
       JOIN "ChatUsers" b ON b."chatId" = c.id AND b."userId" = :other
      WHERE c."companyId" = :companyId AND c.kind = 'direct'
      LIMIT 1`,
    {
      type: QueryTypes.SELECT,
      replacements: { me, other: otherId, companyId }
    }
  );
  if (found) return res.json(await chatWithUsers(found.id));

  const chat = await Chat.create({
    companyId,
    ownerId: me,
    title: "",
    kind: "direct",
    isPublic: false
  });
  await ChatUser.bulkCreate([
    { chatId: chat.id, userId: me },
    { chatId: chat.id, userId: otherId }
  ]);
  const record = await chatWithUsers(chat.id);
  notifyMembers(record, "create");
  return res.json(record);
};

/**
 * Busca da empresa: pessoas (com foto e se estão online) e grupos
 * públicos — marcando os que a pessoa já participa.
 */
export const directory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const me = Number(req.user.id);
  const { companyId } = req.user;
  const search = String(req.query.search || "")
    .trim()
    .slice(0, 80);
  const like = search ? { [Op.iLike]: `%${search}%` } : undefined;

  const users = await User.findAll({
    where: {
      companyId,
      ...(like ? { [Op.or]: [{ name: like }, { email: like }] } : {})
    },
    attributes: USER_ATTRS,
    order: [["name", "ASC"]],
    limit: 60
  });

  const mine = await ChatUser.findAll({
    where: { userId: me },
    attributes: ["chatId"]
  });
  const myChatIds = new Set(mine.map(m => m.chatId));

  const groups = await Chat.findAll({
    where: {
      companyId,
      kind: "group",
      [Op.or]: [{ isPublic: true }, { id: { [Op.in]: [...myChatIds] } }],
      ...(like ? { title: like } : {})
    },
    attributes: ["id", "uuid", "title", "description", "isPublic", "area"],
    include: [{ model: ChatUser, as: "users", attributes: ["userId"] }],
    order: [["title", "ASC"]],
    limit: 60
  });

  const online = await onlineIds(users.map(u => u.id));
  return res.json({
    users: users
      .filter(u => u.id !== me)
      .map(u => ({ ...u.toJSON(), online: online.has(u.id) })),
    groups: groups.map(g => ({
      id: g.id,
      uuid: g.uuid,
      title: g.title,
      description: g.description,
      isPublic: g.isPublic,
      area: g.area,
      members: g.users.length,
      joined: myChatIds.has(g.id)
    }))
  });
};

/** Entra num grupo público da empresa. */
export const join = async (req: Request, res: Response): Promise<Response> => {
  const me = Number(req.user.id);
  const chat = await Chat.findByPk(req.params.id);
  if (
    !chat ||
    chat.companyId !== req.user.companyId ||
    chat.kind !== "group" ||
    !chat.isPublic
  ) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }
  await ChatUser.findOrCreate({ where: { chatId: chat.id, userId: me } });
  const record = await chatWithUsers(chat.id);
  notifyMembers(record, "update");
  return res.json(record);
};

/** Sai de um grupo. O dono não sai: ele exclui ou passa adiante. */
export const leave = async (req: Request, res: Response): Promise<Response> => {
  const me = Number(req.user.id);
  const chat = await Chat.findByPk(req.params.id);
  if (!chat || chat.companyId !== req.user.companyId || chat.kind !== "group") {
    throw new AppError("ERR_NOT_FOUND", 404);
  }
  if (chat.ownerId === me) throw new AppError("ERR_CHAT_OWNER_LEAVE", 400);
  await ChatUser.destroy({ where: { chatId: chat.id, userId: me } });
  const record = await chatWithUsers(chat.id);
  notifyMembers(record, "update");
  getIO()
    .to(`user-${me}`)
    .emit(`company-${chat.companyId}-chat-user-${me}`, {
      action: "delete",
      record: { id: chat.id }
    });
  return res.json({ ok: true });
};

/** Membros da conversa com perfil e se estão online (painel da direita). */
export const members = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const me = Number(req.user.id);
  const chatId = Number(req.params.id);
  const chat = await Chat.findByPk(chatId, { attributes: ["id", "companyId"] });
  if (!chat || chat.companyId !== req.user.companyId) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }
  if (!(await ChatUser.count({ where: { chatId, userId: me } }))) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const rows = await ChatUser.findAll({
    where: { chatId },
    include: [{ model: User, as: "user", attributes: USER_ATTRS }]
  });
  const list = rows.map(r => r.user).filter(Boolean);
  const online = await onlineIds(list.map(u => u.id));

  // grupos em comum (para o perfil de quem é conversa avulsa)
  const others = list.filter(u => u.id !== me).map(u => u.id);
  const common = others.length
    ? await sequelize.query<{ userId: number; title: string }>(
        `SELECT b."userId", c.title FROM "Chats" c
           JOIN "ChatUsers" a ON a."chatId" = c.id AND a."userId" = :me
           JOIN "ChatUsers" b ON b."chatId" = c.id AND b."userId" IN (:others)
          WHERE c.kind = 'group' AND c."companyId" = :companyId`,
        {
          type: QueryTypes.SELECT,
          replacements: { me, others, companyId: req.user.companyId }
        }
      )
    : [];

  return res.json(
    list.map(u => ({
      ...u.toJSON(),
      online: online.has(u.id),
      commonGroups: common
        .filter(c => Number(c.userId) === u.id)
        .map(c => c.title)
    }))
  );
};

/** Quem está em chamada nas conversas da pessoa (salas de voz na lateral). */
export const calls = async (req: Request, res: Response): Promise<Response> => {
  const mine = await ChatUser.findAll({
    where: { userId: Number(req.user.id) },
    attributes: ["chatId"]
  });
  return res.json(activeCallsFor(mine.map(m => m.chatId)));
};
