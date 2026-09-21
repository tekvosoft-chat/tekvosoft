import AppError from "../../errors/AppError";
import Setting from "../../models/Setting";

interface Request {
  key: string;
  user: {
    profile: string;
    companyId: number;
  };
}

// keys that can be accessed by non-admin users
// with respective default values
export const safeSettingsKeys = {
  groupsTab: "disabled",
  CheckMsgIsGroup: "disabled",
  soundGroupNotifications: "disabled",
  tagsMode: "ticket",
  // atendentes precisam saber se mostram o botão "transcrever" nos áudios
  audioTranscriptions: "disabled",
  // Tema de cores da conta (Configurações > Aparência). Só o admin grava,
  // mas todo usuário da empresa precisa ler para ver o sistema na cor
  // escolhida — e, estando nesta lista, a troca chega pelo socket e muda a
  // tela de todo mundo na hora. Vazio = cor padrão da instalação.
  appTheme: ""
};

export const GetSettingService = async ({
  key,
  user
}: Request): Promise<string> => {
  if (user.profile !== "admin" && !(key in safeSettingsKeys)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const setting = await Setting.findOne({
    where: {
      companyId: user.companyId,
      key
    }
  });

  if (!setting && key in safeSettingsKeys) {
    return safeSettingsKeys[key];
  }

  return setting?.value || "";
};
