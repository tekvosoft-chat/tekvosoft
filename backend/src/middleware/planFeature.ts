import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import { companyHasFeature, PlanFeature } from "../helpers/PlanFeatures";

/**
 * Bloqueia a rota quando o plano da empresa não inclui o recurso.
 * O super admin passa sempre. Deve vir depois do isAuth (ou tokenAuth).
 */
const planFeature =
  (feature: PlanFeature) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.user?.isSuper) return next();
    const companyId = Number(req.user?.companyId || req.companyId);
    if (!(await companyHasFeature(companyId, feature))) {
      throw new AppError("ERR_PLAN_FEATURE_DISABLED", 403);
    }
    return next();
  };

export default planFeature;
