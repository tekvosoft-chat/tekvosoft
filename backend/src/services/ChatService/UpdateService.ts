import Chat from "../../models/Chat";
import ChatUser from "../../models/ChatUser";
import User from "../../models/User";

interface ChatData {
  id: number;
  companyId: number;
  title?: string;
  users?: any[];
  area?: string;
  description?: string;
  isPublic?: boolean;
}

export default async function UpdateService(data: ChatData) {
  const { users } = data;
  const record = await Chat.findByPk(data.id, {
    include: [{ model: ChatUser, as: "users" }]
  });
  const { ownerId } = record;

  await record.update({
    ...(data.title !== undefined
      ? {
          title: String(data.title || "")
            .trim()
            .slice(0, 80)
        }
      : {}),
    ...(data.area !== undefined
      ? { area: (data.area || "").trim().slice(0, 60) || null }
      : {}),
    ...(data.description !== undefined
      ? {
          description:
            String(data.description || "")
              .trim()
              .slice(0, 500) || null
        }
      : {}),
    ...(data.isPublic !== undefined ? { isPublic: !!data.isPublic } : {})
  });

  // conversa avulsa não troca de gente
  if (Array.isArray(users) && record.kind !== "direct") {
    // SEGURANÇA: só usuários da mesma empresa
    const ids = users
      .map(user => Number(user?.id))
      .filter(id => id && id !== ownerId);
    const allowed = ids.length
      ? await User.findAll({
          where: { id: ids, companyId: data.companyId },
          attributes: ["id"]
        })
      : [];
    await ChatUser.destroy({ where: { chatId: record.id } });
    await ChatUser.create({ chatId: record.id, userId: ownerId });
    await ChatUser.bulkCreate(
      allowed.map(user => ({ chatId: record.id, userId: user.id }))
    );
  }

  await record.reload({
    include: [
      { model: ChatUser, as: "users", include: [{ model: User, as: "user" }] },
      { model: User, as: "owner" }
    ]
  });

  return record;
}
