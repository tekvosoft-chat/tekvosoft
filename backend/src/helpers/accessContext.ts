import { Request } from "express";

/** IP de quem chamou (o nginx manda o real em X-Real-IP). */
export const clientIp = (req: Request): string =>
  String(req.headers["x-real-ip"] || "").trim() || req.ip || "";

/** "Chrome no Windows", para o e-mail dizer de onde veio o acesso. */
export const describeDevice = (userAgent = ""): string => {
  const ua = String(userAgent);
  let browser = "Navegador";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/.test(ua)) browser = "Samsung Internet";
  else if (/Chrome\/|CriOS/.test(ua)) browser = "Chrome";
  else if (/Firefox\/|FxiOS/.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let system = "";
  if (/Windows/.test(ua)) system = "Windows";
  else if (/Android/.test(ua)) system = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) system = "iPhone/iPad";
  else if (/Mac OS X|Macintosh/.test(ua)) system = "macOS";
  else if (/CrOS/.test(ua)) system = "Chromebook";
  else if (/Linux/.test(ua)) system = "Linux";

  return system ? `${browser} no ${system}` : browser;
};

export const accessContext = (
  req: Request
): { ip: string; device: string } => ({
  ip: clientIp(req),
  device: describeDevice(req.headers["user-agent"])
});
