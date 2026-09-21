import Chat from "../../models/Chat";
import ChatUser from "../../models/ChatUser";
import User from "../../models/User";

interface Data {
  ownerId: number;
  companyId: number;
  users: any[];
  title: string;
  area?: string;
  description?: string;
  isPublic?: boolean;
}

const CreateService = async (data: Data): Promise<Chat> => {
  const { ownerId, companyId, users, title } = data;
  const area = (data.area || "").trim().slice(0, 60) || null;

  const record = await Chat.create({
    ownerId,
    companyId,
    title: String(title || "")
      .trim()
      .slice(0, 80),
    area,
    kind: "group",
    isPublic: !!data.isPublic,
    description:
      String(data.description || "")
        .trim()
        .slice(0, 500) || null
  });

  await ChatUser.create({ chatId: record.id, userId: ownerId });
  // SEGURANÇA: só entram usuários da mesma empresa
  const ids = (Array.isArray(users) ? users : [])
    .map(user => Number(user?.id))
    .filter(id => id && id !== ownerId);
  const allowed = ids.length
    ? await User.findAll({ where: { id: ids, companyId }, attributes: ["id"] })
    : [];
  await ChatUser.bulkCreate(
    allowed.map(user => ({ chatId: record.id, userId: user.id }))
  );

  await record.reload({
    include: [
      {
        model: ChatUser,
        as: "users",
        include: [{ model: User, as: "user", attributes: ["id", "name"] }]
      },
      { model: User, as: "owner", attributes: ["id", "name"] }
    ]
  });

  return record;
};

export default CreateService;
