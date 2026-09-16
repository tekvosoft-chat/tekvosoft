import AppError from "../../errors/AppError";
import Plan from "../../models/Plan";
import {
  PLAN_FEATURES,
  clearPlanFeaturesCache
} from "../../helpers/PlanFeatures";

interface PlanData {
  name: string;
  id?: number | string;
  users?: number;
  connections?: number;
  queues?: number;
  value?: number;
  currency?: string;
  isPublic?: boolean;
  useKanban?: boolean;
  useInternalChat?: boolean;
  useSchedules?: boolean;
  useCampaigns?: boolean;
  useExternalApi?: boolean;
}

const UpdatePlanService = async (planData: PlanData): Promise<Plan> => {
  const { id, name, users, connections, queues, value, currency, isPublic } =
    planData;
  const features = {};
  PLAN_FEATURES.forEach(feature => {
    if (typeof planData[feature] === "boolean") {
      features[feature] = planData[feature];
    }
  });

  const plan = await Plan.findByPk(id);

  if (!plan) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  await plan.update({
    name,
    users,
    connections,
    queues,
    value,
    currency,
    isPublic,
    ...features
  });
  clearPlanFeaturesCache();

  return plan;
};

export default UpdatePlanService;
