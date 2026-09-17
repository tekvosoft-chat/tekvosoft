import { Request, Response, NextFunction } from "express";
import { cacheLayer } from "../libs/cache";
import { logger } from "../utils/logger";

/**
 * Limite de tentativas guardado no Redis (vale para várias instâncias).
 *
 * `onlyFailures`: só conta respostas com erro (ex.: senha errada). Assim
 * uma empresa com muitos atendentes atrás do mesmo IP não é bloqueada por
 * logins corretos — só quem erra várias vezes seguidas.
 */
const rateLimit =
  ({
    name,
    max,
    windowSeconds,
    bodyField,
    onlyFailures = false
  }: {
    name: string;
    max: number;
    windowSeconds: number;
    bodyField?: string;
    onlyFailures?: boolean;
  }) =>
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    let keys: string[] = [];
    try {
      const ip =
        String(req.headers["x-forwarded-for"] || "")
          .split(",")[0]
          .trim() || req.ip;
      // por e-mail o limite é mais apertado; por IP, mais folgado
      const field = bodyField && String(req.body?.[bodyField] || "").trim();
      keys = [`rl:${name}:ip:${ip}`];
      if (field) keys.push(`rl:${name}:${bodyField}:${field.toLowerCase()}`);

      const counts = await Promise.all(
        keys.map(async key => Number((await cacheLayer.get(key)) || 0))
      );
      const limits = keys.map((key, i) => (i === 0 && field ? max * 5 : max));
      if (counts.some((count, i) => count >= limits[i])) {
        res.setHeader("Retry-After", String(windowSeconds));
        return res.status(429).json({ error: "ERR_TOO_MANY_ATTEMPTS" });
      }

      const bump = () =>
        Promise.all(
          keys.map(async key => {
            const current = Number((await cacheLayer.get(key)) || 0) + 1;
            await cacheLayer.set(key, String(current), "EX", windowSeconds);
          })
        ).catch(() => {});

      if (onlyFailures) {
        res.on("finish", () => {
          if (res.statusCode >= 400 && res.statusCode !== 429) bump();
        });
      } else {
        await bump();
      }
    } catch (error) {
      // Redis fora do ar: não bloqueia o acesso por causa do limitador
      logger.warn({ error: error?.message }, "rateLimit: indisponível");
    }
    return next();
  };

export default rateLimit;
