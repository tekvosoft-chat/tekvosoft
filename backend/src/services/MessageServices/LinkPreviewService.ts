import dns from "dns";
import net from "net";
import { getLinkPreview } from "link-preview-js";
import AppError from "../../errors/AppError";
import { cacheLayer } from "../../libs/cache";

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string | null;
  site: string;
}

/**
 * SEGURANÇA: quem abre a página é o servidor. Endereço interno (localhost,
 * rede privada, metadados da nuvem em 169.254.x) não pode ser consultado
 * por aqui — senão a prévia viraria uma porta para dentro da rede.
 */
const isPrivateAddress = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80")
  );
};

// vale para o endereço pedido e para cada redirecionamento
const resolvePublicHost = async (url: string): Promise<string> => {
  const host = new URL(url).hostname.replace(/^\[|\]$/g, "");
  const addresses = net.isIP(host)
    ? [host]
    : (await dns.promises.lookup(host, { all: true })).map(a => a.address);
  if (!addresses.length || addresses.some(isPrivateAddress)) {
    throw new Error("ERR_PRIVATE_ADDRESS");
  }
  return addresses[0];
};

const bareHost = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/**
 * Prévia (título, descrição, imagem) de um link digitado na caixa de
 * mensagem, antes de enviar. Guarda no cache: um dia quando acha, meia hora
 * quando a página não tem prévia.
 */
const LinkPreviewService = async (
  rawUrl: string
): Promise<LinkPreview | null> => {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new AppError("ERR_INVALID_URL", 400);
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new AppError("ERR_INVALID_URL", 400);
  }

  const cacheKey = `linkpreview:${url.href}`;
  const cached = await cacheLayer.get(cacheKey);
  if (cached) return cached === "none" ? null : JSON.parse(cached);

  let preview: LinkPreview | null = null;
  try {
    const data = await getLinkPreview(url.href, {
      timeout: 5000,
      followRedirects: "manual",
      // só segue redirecionamento dentro do mesmo site (http → https, www)
      handleRedirects: (base, forwarded) =>
        bareHost(base) === bareHost(forwarded),
      resolveDNSHost: resolvePublicHost,
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });
    if ("title" in data && (data.title || data.description)) {
      preview = {
        url: data.url || url.href,
        title: data.title || "",
        description: data.description || "",
        image: data.images?.find(src => /^https?:\/\//i.test(src)) || null,
        site: data.siteName || bareHost(data.url || url.href)
      };
    }
  } catch {
    preview = null;
  }

  await cacheLayer.set(
    cacheKey,
    preview ? JSON.stringify(preview) : "none",
    "EX",
    preview ? 60 * 60 * 24 : 60 * 30
  );

  return preview;
};

export default LinkPreviewService;
