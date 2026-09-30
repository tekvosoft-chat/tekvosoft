import { branchName } from "../../services/DevPipeline/repo";
import {
  OPENROUTER_MODELS,
  SLOTS,
  difficultyOf,
  slotSetting,
  slotsFor
} from "../../services/DevPipeline/models";
import { cleanPlan } from "../../services/DevPipeline/testRunner";
import { TesterPlanReply } from "../../services/DevPipeline/prompts";

describe("nome da branch", () => {
  it("usa o tipo da demanda e o nome curto da triagem", () => {
    expect(branchName(12, "bug", "botao-salvar-contatos-celular")).toBe(
      "fix/12-botao-salvar-contatos-celular"
    );
    expect(branchName(3, "feature", "prioridade-card-kanban")).toBe(
      "feat/3-prioridade-card-kanban"
    );
    expect(branchName(4, "improvement", "x")).toBe("improve/4-x");
    expect(branchName(5, "chore", "atualizar-deps")).toBe(
      "chore/5-atualizar-deps"
    );
  });

  it("tira acento e símbolo e nunca corta palavra no meio", () => {
    expect(
      branchName(
        5,
        "improvement",
        "Reações: usar barra igual ao WhatsApp e tirar o modal"
      )
    ).toBe("improve/5-reacoes-usar-barra-igual-ao");
    const long = branchName(
      7,
      "bug",
      "configuracoes-notificacoes-desnecessariamente-extraordinarias"
    );
    expect(long).toBe("fix/7-configuracoes-notificacoes");
    expect(long.length).toBeLessThanOrEqual(50);
  });

  it("tem nome mesmo sem texto e sem tipo conhecido", () => {
    expect(branchName(9, "", "")).toBe("task/9-tarefa");
    expect(branchName(9, "outro", "!!!")).toBe("task/9-tarefa");
  });
});

describe("modelo de cada agente", () => {
  it("toda vaga tem modelo, reserva e chave de configuração", () => {
    SLOTS.forEach(slot => {
      expect(OPENROUTER_MODELS[slot].model).toMatch(/^[a-z0-9-]+\/[\w.-]+$/);
      expect(OPENROUTER_MODELS[slot].fallbacks.length).toBeGreaterThan(0);
      expect(slotSetting(slot)).toMatch(/^_devModel[A-Z]/);
    });
    expect(slotSetting("developerHard")).toBe("_devModelDeveloperHard");
  });

  it("a dificuldade escolhe quem escreve e quem revisa", () => {
    expect(slotsFor({ difficulty: "easy", risk: "low" })).toEqual({
      developer: "developer",
      reviewer: "reviewer"
    });
    expect(slotsFor({ difficulty: "medium", risk: "low" })).toEqual({
      developer: "developerHard",
      reviewer: "reviewer"
    });
    expect(slotsFor({ difficulty: "hard", risk: "low" })).toEqual({
      developer: "developerHard",
      reviewer: "reviewerHard"
    });
  });

  it("risco alto conta como difícil, mesmo quando é fácil", () => {
    expect(slotsFor({ difficulty: "easy", risk: "high" })).toEqual({
      developer: "developerHard",
      reviewer: "reviewerHard"
    });
  });

  it("demanda antiga, sem dificuldade, usa o tamanho estimado", () => {
    expect(difficultyOf({ effort: "S" })).toBe("easy");
    expect(difficultyOf({ effort: "L" })).toBe("hard");
    expect(difficultyOf({})).toBe("medium");
  });
});

describe("roteiro do testador", () => {
  const reply = (overrides: Partial<TesterPlanReply>): TesterPlanReply => ({
    needed: true,
    reason: "mostra o botão",
    devices: ["desktop", "mobile"],
    steps: [
      { action: "goto", target: "/contacts", value: "", note: "" },
      { action: "screenshot", target: "", value: "", note: "lista" }
    ],
    checks: ["o botão aparece"],
    ...overrides
  });

  it("guarda o roteiro válido como veio", () => {
    const plan = cleanPlan(reply({}));
    expect(plan.needed).toBe(true);
    expect(plan.devices).toEqual(["desktop", "mobile"]);
    expect(plan.steps.map(step => step.action)).toEqual(["goto", "screenshot"]);
  });

  it("abre uma tela antes da primeira foto", () => {
    const plan = cleanPlan(
      reply({
        steps: [{ action: "screenshot", target: "", value: "", note: "" }]
      })
    );
    expect(plan.steps[0]).toMatchObject({ action: "goto", target: "/" });
  });

  it("descarta ação desconhecida e limita o tamanho", () => {
    const many = Array.from({ length: 20 }, () => ({
      action: "wait" as const,
      target: "",
      value: "500",
      note: ""
    }));
    const plan = cleanPlan(
      reply({
        steps: [
          { action: "goto", target: "/", value: "", note: "" },
          // ação que o navegador não conhece (a IA pode inventar)
          { action: "delete" as never, target: "#x", value: "", note: "" },
          ...many
        ]
      })
    );
    expect(plan.steps.length).toBe(12);
    expect(plan.steps.some(step => step.action === ("delete" as never))).toBe(
      false
    );
  });

  it("sem passos ou sem aparelho, não inventa teste", () => {
    expect(cleanPlan(reply({ steps: [] })).needed).toBe(false);
    expect(cleanPlan(reply({ devices: [] })).devices).toEqual(["desktop"]);
  });
});
