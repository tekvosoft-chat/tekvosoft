import Queue from "../models/Queue";
import Company from "../models/Company";
import User from "../models/User";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  profileImage: string | null;
  companyId: number;
  company: Company | null;
  super: boolean;
  appTheme: string | null;
  queues: Queue[];
}

export const SerializeUser = async (user: User): Promise<SerializedUser> => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    profileImage: user.profileImage,
    companyId: user.companyId,
    company: user.company,
    super: user.super,
    appTheme: user.appTheme || null,
    queues: user.queues
  };
};
