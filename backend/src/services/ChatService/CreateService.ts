import Chat from "../../models/Chat";
import ChatUser from "../../models/ChatUser";
import User from "../../models/User";

interface Data {
  ownerId: number;
  companyId: number;
  users: any[];
  title: string;
  area?: string;
}

const CreateService = async (data: Data): Promise<Chat> => {
  const { ownerId, companyId, users, title } = data;
  const area = (data.area || "").trim().slice(0, 60) || null;

  const record = await Chat.create({
    ownerId,
    companyId,
    title,
    area
  });

  await ChatUser.create({ chatId: record.id, userId: ownerId });
  if (Array.isArray(users) && users.length > 0) {
    for (const user of users) {
      if (user.id === ownerId) continue;
      await ChatUser.create({ chatId: record.id, userId: user.id });
    }
  }

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
