import fs from "fs";
import path from "path";

import Company from "../../models/Company";
import { getPublicPath } from "../../helpers/GetPublicPath";
import { cacheLayer } from "../../libs/cache";
import { logger } from "../../utils/logger";

const CACHE_KEY = "companies:storage";
const CACHE_SECONDS = 5 * 60;

const folderSize = (dir: string): number => {
  let total = 0;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    return 0;
  }
  entries.forEach(entry => {
    const full = path.join(dir, entry.name);
    try {
      if (entry.isDirectory()) {
        total += folderSize(full);
      } else if (entry.isFile()) {
        total += fs.statSync(full).size;
      }
    } catch (error) {
      // arquivo removido no meio da contagem
    }
  });
  return total;
};

/**
 * Quanto de disco cada empresa ocupa com as mídias das conversas.
 *
 * Soma as pastas public/media/<empresa> e public/media-persistant/<empresa>.
 * A conta percorre arquivos, então o resultado fica 5 minutos em cache.
 */
const CompaniesStorageService = async (): Promise<Record<number, number>> => {
  const cached = await cacheLayer.get(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      logger.warn("CompaniesStorage: cache inválido");
    }
  }

  const companies = await Company.findAll({ attributes: ["id"] });
  const publicPath = getPublicPath();
  const usage: Record<number, number> = {};

  companies.forEach(company => {
    usage[company.id] =
      folderSize(path.join(publicPath, "media", String(company.id))) +
      folderSize(path.join(publicPath, "media-persistant", String(company.id)));
  });

  await cacheLayer.set(CACHE_KEY, JSON.stringify(usage), "EX", CACHE_SECONDS);

  return usage;
};

export default CompaniesStorageService;
