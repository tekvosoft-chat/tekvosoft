import AppError from "../errors/AppError";

/**
 * SEGURANÇA: o registro pedido pelo id precisa ser da empresa de quem pede.
 * Sem isso, trocando o número na URL dava para ver ou mexer em dados de
 * outra empresa. Responde 404 (não revela que o registro existe).
 */
const EnsureSameCompany = (
  record: { companyId?: number | null } | null | undefined,
  companyId: number | string
): void => {
  if (!record || Number(record.companyId) !== Number(companyId)) {
    throw new AppError("ERR_NOT_FOUND", 404);
  }
};

export default EnsureSameCompany;
