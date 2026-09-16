import Company from "../models/Company";
import Plan from "../models/Plan";

/** Recursos que o plano liga ou desliga. */
export const PLAN_FEATURES = [
  "useKanban",
  "useInternalChat",
  "useSchedules",
  "useCampaigns",
  "useExternalApi"
] as const;

export type PlanFeature = (typeof PLAN_FEATURES)[number];

const cache = new Map<number, { at: number; plan: Plan | null }>();
const TTL = 60 * 1000;

export const clearPlanFeaturesCache = (): void => cache.clear();

/** O plano da empresa inclui o recurso? Sem plano, não bloqueia. */
export const companyHasFeature = async (
  companyId: number,
  feature: PlanFeature
): Promise<boolean> => {
  if (!companyId) return true;
  const hit = cache.get(companyId);
  let plan = hit && Date.now() - hit.at < TTL ? hit.plan : undefined;
  if (plan === undefined) {
    const company = await Company.findByPk(companyId, {
      attributes: ["id", "planId"],
      include: [{ model: Plan, attributes: ["id", ...PLAN_FEATURES] }]
    });
    plan = company?.plan || null;
    cache.set(companyId, { at: Date.now(), plan });
  }
  if (!plan) return true;
  return plan[feature] !== false;
};
