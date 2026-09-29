import path from "path";
import { createTwoFilesPatch } from "diff";
import { ts } from "ts-morph";
import { DevChange, DevCheck } from "../../models/DevTask";
import { RepoSource, writeBlock } from "./repo";

/**
 * Cópia de trabalho da tarefa: o commit base mais as alterações que os
 * agentes já fizeram (changes). Nada é gravado em disco: cada leitura
 * procura primeiro nas alterações e depois no repositório.
 *
 * As edições chegam como "troque este trecho por aquele" (search/replace).
 * Custa bem menos token que reescrever o arquivo inteiro e deixa o diff
 * pequeno para o revisor.
 */
export interface DevEdit {
  path: string;
  op: "replace" | "create" | "delete";
  search: string;
  replace: string;
}

// arquivo até este tamanho vai inteiro para o agente; maior, vai o índice
// (as linhas que abrem funções, componentes, rotas) e ele pede os trechos
export const FULL_FILE_CHARS = 24000;
const RANGE_MAX_LINES = 400;
const OUTLINE_MAX_LINES = 220;

const SIGNATURE = new RegExp(
  [
    "^(export|import|const|let|var|function|async function|class|interface|type|enum|module\\.exports)\\b",
    "^\\s{0,4}(public |private |protected |static |async )*[A-Za-z_$][\\w$]*\\s*\\([^)]*\\)\\s*(:[^={]+)?\\{\\s*$",
    "^\\s{2,8}[A-Za-z_$][\\w$]*\\s*:\\s*\\{\\s*$",
    "^\\s{0,6}(const|function) [A-Za-z_$][\\w$]* = ",
    "^\\s*[A-Za-z]+Routes?\\.(get|post|put|patch|delete)\\(",
    "^\\s*case [^:]+:\\s*$"
  ].join("|")
);

const numbered = (lines: string[], from: number) =>
  lines.map((line, i) => `${String(from + i).padStart(5)}| ${line}`).join("\n");

/** Índice de um arquivo grande: só as linhas de estrutura, numeradas. */
export const outline = (content: string): string => {
  const lines = content.split("\n");
  const picked: string[] = [];
  lines.forEach((line, i) => {
    if (picked.length < OUTLINE_MAX_LINES && SIGNATURE.test(line)) {
      picked.push(`${String(i + 1).padStart(5)}| ${line.slice(0, 160)}`);
    }
  });
  const more =
    picked.length >= OUTLINE_MAX_LINES ? "\n  ... (índice cortado)" : "";
  return picked.join("\n") + more;
};

const checkSyntax = (file: string, content: string): string[] => {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".json") {
    try {
      JSON.parse(content);
      return [];
    } catch (error) {
      return [String((error as Error).message)];
    }
  }
  if (![".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext)) return [];
  // o JavaScript do frontend tem JSX: lido como .jsx para não acusar erro
  const fileName = ext === ".js" ? file.replace(/\.js$/, ".jsx") : file;
  const result = ts.transpileModule(content, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      allowJs: true,
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ESNext
    }
  });
  return (result.diagnostics || []).slice(0, 5).map(diagnostic => {
    const where =
      diagnostic.file && diagnostic.start !== undefined
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line +
          1
        : 0;
    const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    return where ? `linha ${where}: ${text}` : text;
  });
};

const cleanPath = (file: string) =>
  String(file || "")
    .trim()
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");

/** Acha o trecho no arquivo: exato; se não, ignorando espaço no fim da linha. */
const locate = (
  content: string,
  search: string
): { start: number; end: number } | string => {
  if (!search.trim()) return "o trecho SEARCH veio vazio";

  const exact = content.split(search).length - 1;
  if (exact === 1) {
    const start = content.indexOf(search);
    return { start, end: start + search.length };
  }
  if (exact > 1) {
    return `o trecho aparece ${exact} vezes; inclua linhas vizinhas para ficar único`;
  }

  const lines = content.split("\n");
  const wanted = search.replace(/\n+$/, "").split("\n");
  const trim = (line: string) => line.replace(/\s+$/, "");
  const hits: number[] = [];
  for (let i = 0; i + wanted.length <= lines.length; i += 1) {
    if (wanted.every((line, j) => trim(lines[i + j]) === trim(line))) {
      hits.push(i);
    }
  }
  if (hits.length !== 1) {
    return hits.length
      ? `o trecho aparece ${hits.length} vezes; inclua linhas vizinhas para ficar único`
      : "trecho não encontrado: copie exatamente do arquivo atual, com a mesma indentação";
  }
  const offset = (line: number) =>
    lines.slice(0, line).reduce((sum, text) => sum + text.length + 1, 0);
  const start = offset(hits[0]);
  // a quebra de linha final entra no trecho só se o SEARCH terminava nela
  // (igual à busca exata), senão o REPLACE ganharia uma linha em branco
  const endLine = hits[0] + wanted.length;
  const withBreak = search.endsWith("\n") ? 0 : 1;
  const end = Math.min(content.length, offset(endLine) - withBreak);
  return { start, end };
};

export class Workspace {
  private overlay: Map<string, DevChange>;

  constructor(
    private repo: RepoSource,
    private sha: string,
    changes: DevChange[] = []
  ) {
    this.overlay = new Map(changes.map(change => [change.path, change]));
  }

  original(file: string): Promise<string | null> {
    return this.repo.read(this.sha, file);
  }

  async read(file: string): Promise<string | null> {
    const change = this.overlay.get(file);
    if (change) return change.op === "delete" ? null : change.content;
    return this.original(file);
  }

  /**
   * Arquivo para o agente: inteiro se couber, senão o índice numerado.
   * allowFull falso manda só o índice (a cota da mensagem já acabou).
   */
  async view(file: string, allowFull = true): Promise<string> {
    const content = await this.read(file);
    if (content === null) {
      return `### ${file}\n(não existe; crie com op "create" se precisar)`;
    }
    const lines = content.split("\n").length;
    if (allowFull && content.length <= FULL_FILE_CHARS) {
      return `### ${file} (${lines} linhas, completo)\n${content}`;
    }
    return `### ${file} (${lines} linhas: grande demais para vir inteiro; abaixo o índice numerado, peça os trechos com "read")\n${outline(content)}`;
  }

  /** Trecho pedido pelo agente (to = 0 lê até o fim). */
  async range(file: string, from: number, to: number): Promise<string> {
    const content = await this.read(cleanPath(file));
    if (content === null) return `### ${file}\n(não existe)`;
    const lines = content.split("\n");
    const start = Math.max(1, from || 1);
    let end = to && to >= start ? Math.min(to, lines.length) : lines.length;
    let note = "";
    if (end - start + 1 > RANGE_MAX_LINES) {
      end = start + RANGE_MAX_LINES - 1;
      note = `\n(parei na linha ${end}: peça o restante em outra leitura)`;
    }
    return `### ${file} (linhas ${start}-${end} de ${lines.length}; os números à esquerda não fazem parte do código)\n${numbered(
      lines.slice(start - 1, end),
      start
    )}${note}`;
  }

  /** Aplica as edições; as que não servirem voltam como erro para o agente. */
  async apply(
    edits: DevEdit[]
  ): Promise<{ applied: string[]; errors: string[] }> {
    const applied: string[] = [];
    const errors: string[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const edit of edits) {
      const file = cleanPath(edit.path);

      const [current, base] = await Promise.all([
        this.read(file),
        this.original(file)
      ]);
      const op = edit.op === "replace" ? "edit" : edit.op;
      const blocked = writeBlock(file, base !== null, op);
      if (blocked) {
        errors.push(`${file}: ${blocked}`);
      } else if (edit.op === "delete") {
        if (current === null) errors.push(`${file}: não existe`);
        else {
          this.overlay.set(file, { path: file, op: "delete", content: "" });
          applied.push(file);
        }
      } else if (edit.op === "create") {
        this.overlay.set(file, {
          path: file,
          op: base === null ? "create" : "edit",
          content: edit.replace
        });
        applied.push(file);
      } else if (current === null) {
        errors.push(`${file}: não existe (para arquivo novo use op "create")`);
      } else {
        const found = locate(current, edit.search);
        if (typeof found === "string") {
          errors.push(`${file}: ${found}`);
        } else {
          const content =
            current.slice(0, found.start) +
            edit.replace +
            current.slice(found.end);
          this.overlay.set(file, {
            path: file,
            op: base === null ? "create" : "edit",
            content
          });
          applied.push(file);
        }
      }
    }
    return { applied: [...new Set(applied)], errors };
  }

  /** Só o que de fato mudou em relação ao commit base. */
  async changes(): Promise<DevChange[]> {
    const list = await Promise.all(
      [...this.overlay.values()].map(async change => {
        const base = await this.original(change.path);
        if (change.op === "delete") return base === null ? null : change;
        return base === change.content ? null : change;
      })
    );
    return list.filter(Boolean).sort((a, b) => a.path.localeCompare(b.path));
  }

  /** Diff no formato do git (dá para aplicar com git apply). */
  async diff(context = 4): Promise<string> {
    const changes = await this.changes();
    const parts = await Promise.all(
      changes.map(async change => {
        const before = await this.original(change.path);
        const after = change.op === "delete" ? null : change.content;
        const patch = createTwoFilesPatch(
          before === null ? "/dev/null" : `a/${change.path}`,
          after === null ? "/dev/null" : `b/${change.path}`,
          before ?? "",
          after ?? "",
          undefined,
          undefined,
          { context }
        );
        const body = patch
          .split("\n")
          .filter(line => !/^={10,}$/.test(line) && !line.startsWith("Index: "))
          .join("\n");
        let mode = "";
        if (before === null) mode = "new file mode 100644\n";
        else if (after === null) mode = "deleted file mode 100644\n";
        return `diff --git a/${change.path} b/${change.path}\n${mode}${body}`;
      })
    );
    return parts.join("\n").trim();
  }

  /** Erros de sintaxe nos arquivos alterados (sem IA, custo zero). */
  async check(): Promise<DevCheck[]> {
    const changes = await this.changes();
    return changes.flatMap(change =>
      change.op === "delete"
        ? []
        : checkSyntax(change.path, change.content).map(message => ({
            path: change.path,
            message
          }))
    );
  }
}
