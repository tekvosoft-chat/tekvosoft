import { cacheLayer } from "../../libs/cache";
import { Session } from "../../libs/wbot";

const GetProfilePicUrl = async (
  number: string,
  type: "preview" | "image",
  wbot: Session
): Promise<string | void> => {
  const redisKey = `picurl_${type}:${number}`;

  const profilePicUrl = await cacheLayer.get(redisKey);
  if (profilePicUrl) {
    return profilePicUrl;
  }

  // devolve a foto já na primeira busca (antes só gravava no cache e a
  // foto só aparecia na mensagem seguinte)
  return wbot.profilePictureUrl(`${number}`, type, 1000).then(pic => {
    if (pic) cacheLayer.set(redisKey, pic, "EX", 60 * 60 * 24 * 5);
    return pic;
  });
};

export default GetProfilePicUrl;
