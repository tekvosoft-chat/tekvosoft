/**
 * Recursos do plano da empresa (Configurações > Planos).
 *
 * O plano chega junto com o usuário (user.company.plan). Sem plano, ou para
 * o super admin, tudo fica liberado — o bloqueio de verdade é no servidor;
 * aqui só escondemos o que a empresa não contratou.
 */
export const PLAN_FEATURES = [
  "useKanban",
  "useInternalChat",
  "useSchedules",
  "useExternalApi"
];

// tela → recurso que ela precisa
export const ROUTE_FEATURES = {
  "/kanban": "useKanban",
  "/chats": "useInternalChat",
  "/schedules": "useSchedules",
  "/messages-api": "useExternalApi"
};

export const planAllows = (user, feature) => {
  if (!feature || !user || user.super) return true;
  const plan = user.company?.plan;
  if (!plan) return true;
  return plan[feature] !== false;
};

export const routeAllowed = (user, path) => {
  const key = Object.keys(ROUTE_FEATURES).find(
    prefix => path === prefix || path.startsWith(`${prefix}/`)
  );
  return planAllows(user, key && ROUTE_FEATURES[key]);
};
