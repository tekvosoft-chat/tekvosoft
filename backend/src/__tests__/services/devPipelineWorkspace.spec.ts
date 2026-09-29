import {
  RepoSource,
  buildRepoMap,
  canRead,
  writeBlock
} from "../../services/DevPipeline/repo";
import { Workspace } from "../../services/DevPipeline/workspace";
import { parseJson } from "../../services/DevPipeline/llm";
import { costOf, priceOf } from "../../services/DevPipeline/pricing";
import { slugify } from "../../services/DevPipeline/skills";

// repositório em memória: o pipeline só enxerga o código por esta interface
const fakeRepo = (files: Record<string, string>): RepoSource => ({
  kind: "local",
  label: "teste",
  canPublish: false,
  head: async () => "sha",
  list: async () =>
    Object.keys(files).map(path => ({ path, size: files[path].length })),
  read: async (_sha, file) => (file in files ? files[file] : null),
  publish: async () => {
    throw new Error("sem publicação no teste");
  },
  pull: async () => null,
  search: async (_sha, query) =>
    Object.keys(files)
      .filter(file => files[file].includes(query))
      .map(file => `${file}: ${query}`)
});

const SOURCE = [
  "export const soma = (a: number, b: number) => {",
  "  return a + b;",
  "};",
  "",
  "export const dobro = (a: number) => {",
  "  return a * 2;",
  "};",
  ""
].join("\n");

describe("DevPipeline: o que os agentes podem ler e escrever", () => {
  it("não deixa ler segredos nem sair da pasta do repositório", () => {
    expect(canRead("backend/src/app.ts")).toBe(true);
    expect(canRead(".env")).toBe(false);
    expect(canRead("backend/.env.production")).toBe(false);
    expect(canRead("backend/certs/server.key")).toBe(false);
    expect(canRead("../etc/passwd")).toBe(false);
    expect(canRead("/etc/passwd")).toBe(false);
  });

  it("não deixa mexer em infraestrutura nem em migration já aplicada", () => {
    expect(writeBlock("backend/src/app.ts", true, "edit")).toBeNull();
    expect(
      writeBlock(".github/workflows/build.yml", true, "edit")
    ).not.toBeNull();
    expect(writeBlock("backend/Dockerfile", true, "edit")).not.toBeNull();
    expect(writeBlock("frontend/package.json", true, "edit")).not.toBeNull();
    expect(
      writeBlock("backend/src/database/migrations/2025-a.ts", true, "edit")
    ).not.toBeNull();
    // migration nova pode
    expect(
      writeBlock("backend/src/database/migrations/2026-b.ts", false, "create")
    ).toBeNull();
  });

  it("monta o mapa por pasta, sem imagens e resumindo as migrations", () => {
    const map = buildRepoMap([
      { path: "backend/src/app.ts", size: 100 },
      { path: "backend/src/server.ts", size: 200 },
      { path: "frontend/public/logo.png", size: 5000 },
      { path: "frontend/src/big.js", size: 90000 },
      { path: "backend/src/database/migrations/20250101000000-a.ts", size: 1 },
      { path: ".env", size: 10 }
    ]);
    expect(map).toContain("backend/src/: app.ts server.ts");
    expect(map).toContain("big.js(90k)");
    expect(map).toContain("1 migrations");
    expect(map).not.toContain("logo.png");
    expect(map).not.toContain(".env");
  });
});

describe("DevPipeline: edições por search/replace", () => {
  it("aplica troca exata, arquivo novo e gera diff no formato do git", async () => {
    const workspace = new Workspace(
      fakeRepo({ "src/conta.ts": SOURCE }),
      "sha"
    );
    const { applied, errors } = await workspace.apply([
      {
        path: "src/conta.ts",
        op: "replace",
        search: "  return a * 2;",
        replace: "  return a * 3;"
      },
      {
        path: "src/novo.ts",
        op: "create",
        search: "",
        replace: "export const um = 1;\n"
      }
    ]);
    expect(errors).toEqual([]);
    expect(applied).toEqual(["src/conta.ts", "src/novo.ts"]);
    expect(await workspace.read("src/conta.ts")).toContain("return a * 3;");

    const diff = await workspace.diff();
    expect(diff).toContain("diff --git a/src/conta.ts b/src/conta.ts");
    expect(diff).toContain("-  return a * 2;");
    expect(diff).toContain("+  return a * 3;");
    expect(diff).toContain("new file mode 100644");
    expect(diff).toContain("--- /dev/null");
  });

  it("acha o trecho mesmo com espaço sobrando no fim da linha", async () => {
    const workspace = new Workspace(
      fakeRepo({ "src/conta.ts": SOURCE }),
      "sha"
    );
    const { errors } = await workspace.apply([
      {
        path: "src/conta.ts",
        op: "replace",
        search: "  return a + b;   \n};",
        replace: "  return b + a;\n};"
      }
    ]);
    expect(errors).toEqual([]);
    const content = await workspace.read("src/conta.ts");
    expect(content).toContain("return b + a;\n};\n\nexport const dobro");
  });

  it("devolve erro legível para trecho ausente, repetido ou arquivo que não existe", async () => {
    const workspace = new Workspace(
      fakeRepo({ "src/conta.ts": SOURCE }),
      "sha"
    );
    const { applied, errors } = await workspace.apply([
      {
        path: "src/conta.ts",
        op: "replace",
        search: "nao existe",
        replace: "x"
      },
      { path: "src/conta.ts", op: "replace", search: "};", replace: "}" },
      { path: "src/outro.ts", op: "replace", search: "a", replace: "b" }
    ]);
    expect(applied).toEqual([]);
    expect(errors[0]).toContain("trecho não encontrado");
    expect(errors[1]).toContain("aparece 2 vezes");
    expect(errors[2]).toContain("não existe");
  });

  it("acusa erro de sintaxe no que foi alterado, sem IA", async () => {
    const workspace = new Workspace(
      fakeRepo({ "src/conta.ts": SOURCE }),
      "sha"
    );
    await workspace.apply([
      {
        path: "src/conta.ts",
        op: "replace",
        search: "  return a * 2;",
        replace: "  return (a * 2;"
      }
    ]);
    const checks = await workspace.check();
    expect(checks).toHaveLength(1);
    expect(checks[0].path).toBe("src/conta.ts");
    expect(checks[0].message).toMatch(/^linha 6:/);
  });

  it("não conta como mudança o arquivo que voltou a ser igual ao original", async () => {
    const workspace = new Workspace(
      fakeRepo({ "src/conta.ts": SOURCE }),
      "sha",
      [{ path: "src/conta.ts", op: "edit", content: SOURCE }]
    );
    expect(await workspace.changes()).toEqual([]);
  });

  it("lê trechos numerados e para no limite de linhas", async () => {
    const long = Array.from({ length: 900 }, (_, i) => `linha ${i + 1}`).join(
      "\n"
    );
    const workspace = new Workspace(fakeRepo({ "src/longo.ts": long }), "sha");
    const part = await workspace.range("src/longo.ts", 10, 12);
    expect(part).toContain("   10| linha 10");
    expect(part).toContain("   12| linha 12");
    expect(part).not.toContain("linha 13");
    const capped = await workspace.range("src/longo.ts", 1, 0);
    expect(capped).toContain("parei na linha 400");
  });
});

describe("DevPipeline: resposta dos agentes", () => {
  it("aceita JSON puro ou embrulhado em bloco de código", () => {
    expect(parseJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
    expect(parseJson<{ a: number }>('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(() => parseJson("sem json")).toThrow("ERR_DEV_AI_FORMAT");
  });
});

describe("DevPipeline: custo e skills", () => {
  it("acha o preço pelo começo do nome, a chave mais longa primeiro", () => {
    expect(priceOf("gpt-5-mini-2025-08-07")).toEqual([0.25, 2, 0.025, 0]);
    expect(priceOf("gpt-5-2025-08-07")?.[0]).toBe(1.25);
    expect(priceOf("claude-opus-5")?.[1]).toBe(25);
    expect(priceOf("modelo-desconhecido")).toBeNull();
  });

  it("soma entrada, saída, leitura e gravação de cache", () => {
    const cost = costOf("claude-opus-5", {
      input: 1000000,
      output: 100000,
      cacheRead: 1000000,
      cacheWrite: 100000
    });
    // 5 + 2,5 + 0,5 + 0,625
    expect(cost).toBeCloseTo(8.625, 5);
    expect(
      costOf("sem-preco", { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 })
    ).toBeNull();
  });

  it("gera slug limpo para a skill", () => {
    expect(slugify("Padrões de Botão & Ícones!")).toBe(
      "padroes-de-botao-icones"
    );
    expect(slugify("")).toBe("skill");
  });
});
