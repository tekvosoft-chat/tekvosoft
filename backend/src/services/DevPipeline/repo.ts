import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { DevConfig } from "./config";
import { DevChange } from "../../models/DevTask";

/**
 * De onde os agentes leem o código e para onde vai o PR.
 *
 *  - GitHub com token: lê o commit mais novo da branch base, cria a branch
 *    ai/<id>-<assunto>, faz o commit e abre o PR como rascunho;
 *  - GitHub sem token (repositório público): só lê; o resultado fica como
 *    patch para baixar;
 *  - código local (DEV_PIPELINE_REPO_PATH, só no ambiente de dev): lê a
 *    pasta montada no container, para testar o pipeline sem GitHub.
 *
 * Os agentes nunca veem segredo (.env, certificados) nem mexem no que
 * roda a infraestrutura (CI, Docker, scripts, dependências).
 */
export interface RepoFile {
  path: string;
  size: number;
}

export interface PublishRequest {
  baseSha: string;
  branch: string;
  title: string;
  body: string;
  message: string;
  changes: DevChange[];
}

export interface PublishResult {
  url: string;
  number: number;
}

export interface PullState {
  open: boolean;
  merged: boolean;
}

export interface RepoSource {
  kind: "github" | "local";
  label: string;
  canPublish: boolean;
  head(): Promise<string>;
  list(sha: string): Promise<RepoFile[]>;
  read(sha: string, file: string): Promise<string | null>;
  publish(request: PublishRequest): Promise<PublishResult>;
  pull(number: number): Promise<PullState | null>;
  // linhas "caminho:linha: texto" onde o termo aparece (null = sem busca)
  search(sha: string, query: string): Promise<string[] | null>;
}

export class RepoError extends Error {
  code: string;

  detail: string;

  constructor(code: string, detail = "") {
    super(detail ? `${code}: ${detail}` : code);
    this.code = code;
    this.detail = detail;
  }
}

// ---------------------------------------------------------------------------
// o que os agentes podem ler e escrever

const SECRET = [
  /(^|\/)\.env(\.[^/]*)?$/,
  /\.(pem|key|p12|pfx|crt|cer)$/i,
  /(^|\/)certs?\//,
  /(^|\/)certification\//,
  /(^|\/)\.git\//
];

const LOCKED = [
  /^\.github\//,
  /(^|\/)Dockerfile[^/]*$/,
  /(^|\/)docker-compose[^/]*$/,
  /(^|\/)docker-entrypoint[^/]*$/,
  /(^|\/)scripts\//,
  /^tekvosoft$/,
  /\.sh$/,
  /(^|\/)package(-lock)?\.json$/,
  /(^|\/)nginx\//,
  /^LICENSE/
];

const MIGRATION = /(^|\/)database\/(migrations|seeds)\//;

export const isSafePath = (file: string): boolean =>
  !!file &&
  file.length < 300 &&
  !file.startsWith("/") &&
  !file.includes("\\") &&
  !file.split("/").some(part => part === ".." || part === "." || !part);

export const canRead = (file: string): boolean =>
  isSafePath(file) && !SECRET.some(rule => rule.test(file));

/** Motivo de não poder mexer no arquivo, ou null se pode. */
export const writeBlock = (
  file: string,
  exists: boolean,
  op: DevChange["op"]
): string | null => {
  if (!canRead(file)) return "caminho proibido";
  if (LOCKED.some(rule => rule.test(file))) {
    return "arquivo de infraestrutura/dependências: só uma pessoa altera";
  }
  // migration aplicada é imutável: para corrigir, cria-se outra
  if (MIGRATION.test(file) && (exists || op !== "create")) {
    return "migration existente é imutável: crie uma nova";
  }
  return null;
};

// ---------------------------------------------------------------------------
// mapa do repositório: uma linha por pasta, só os nomes dos arquivos

const NOT_CODE =
  /\.(png|jpe?g|gif|webp|ico|bmp|svg|mp3|mp4|ogg|wav|webm|woff2?|ttf|eot|otf|zip|gz|pdf|lock|map)$/i;

export const buildRepoMap = (files: RepoFile[]): string => {
  const dirs = new Map<string, string[]>();
  const migrations: string[] = [];

  files.forEach(file => {
    if (NOT_CODE.test(file.path) || !canRead(file.path)) return;
    if (/(^|\/)(node_modules|\.vscode)\//.test(file.path)) return;
    const dir = path.posix.dirname(file.path);
    const name = path.posix.basename(file.path);
    if (/(^|\/)database\/migrations$/.test(dir)) {
      migrations.push(name);
      return;
    }
    // arquivo grande ganha o tamanho: o agente sabe que vale pedir trechos
    const label =
      file.size > 30000 ? `${name}(${Math.round(file.size / 1000)}k)` : name;
    if (!dirs.has(dir)) dirs.set(dir, []);
    dirs.get(dir).push(label);
  });

  const lines = [...dirs.keys()]
    .sort()
    .map(dir => `${dir}/: ${dirs.get(dir).sort().join(" ")}`);

  if (migrations.length) {
    migrations.sort();
    lines.push(
      `backend/src/database/migrations/: ${migrations.length} migrations (AAAAMMDDHHMMSS-descricao.ts); as últimas: ${migrations
        .slice(-4)
        .join(" ")}`
    );
  }
  return lines.join("\n");
};

// ---------------------------------------------------------------------------
// GitHub

const GITHUB = "https://api.github.com";

const encodeRef = (ref: string) =>
  ref.split("/").map(encodeURIComponent).join("/");

type GithubCall = { method?: string; body?: unknown; accept?: string };

class GithubSource implements RepoSource {
  kind = "github" as const;

  label: string;

  canPublish: boolean;

  private cache = new Map<string, string | null>();

  constructor(
    private repo: string,
    private branch: string,
    private token: string
  ) {
    this.label = `${repo}@${branch}`;
    this.canPublish = !!token;
  }

  private async call(pathname: string, init: GithubCall = {}) {
    return fetch(`${GITHUB}/repos/${this.repo}${pathname}`, {
      method: init.method || "GET",
      headers: {
        Accept: init.accept || "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "vuup.me-dev-pipeline",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(init.body ? { "Content-Type": "application/json" } : {})
      },
      body: init.body ? JSON.stringify(init.body) : undefined
    });
  }

  private static async fail(res: Response): Promise<never> {
    const text = (await res.text()).slice(0, 300);
    if (res.status === 401) throw new RepoError("ERR_DEV_GITHUB_AUTH");
    if (res.status === 403 || res.status === 429) {
      if (res.headers.get("x-ratelimit-remaining") === "0") {
        throw new RepoError("ERR_DEV_GITHUB_RATE_LIMIT");
      }
      // token fine-grained que lê (repositório público) mas não escreve:
      // quase sempre o dono do token é a conta pessoal e o repositório é de
      // uma organização, ou falta Contents/Pull requests em escrita. O
      // GitHub diz no cabeçalho qual permissão faltou
      if (/not accessible by personal access token/i.test(text)) {
        throw new RepoError(
          "ERR_DEV_GITHUB_PERMISSION",
          res.headers.get("x-accepted-github-permissions") || ""
        );
      }
      throw new RepoError("ERR_DEV_GITHUB_FORBIDDEN", text);
    }
    if (res.status === 404) throw new RepoError("ERR_DEV_GITHUB_NOT_FOUND");
    throw new RepoError("ERR_DEV_GITHUB_FAILED", `${res.status} ${text}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async json(pathname: string, init?: GithubCall): Promise<any> {
    const res = await this.call(pathname, init);
    if (!res.ok) await GithubSource.fail(res);
    return res.json();
  }

  async head(): Promise<string> {
    const ref = await this.json(`/git/ref/heads/${encodeRef(this.branch)}`);
    return ref.object.sha;
  }

  async list(sha: string): Promise<RepoFile[]> {
    const tree = await this.json(`/git/trees/${sha}?recursive=1`);
    return (tree.tree || [])
      .filter((entry: { type: string }) => entry.type === "blob")
      .map((entry: { path: string; size?: number }) => ({
        path: entry.path,
        size: entry.size || 0
      }));
  }

  async read(sha: string, file: string): Promise<string | null> {
    if (!canRead(file)) return null;
    const key = `${sha}:${file}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const res = await this.call(`/contents/${encodeRef(file)}?ref=${sha}`, {
      accept: "application/vnd.github.raw+json"
    });
    if (res.status === 404) {
      this.cache.set(key, null);
      return null;
    }
    if (!res.ok) await GithubSource.fail(res);
    const text = await res.text();
    this.cache.set(key, text);
    return text;
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    if (!this.token) throw new RepoError("ERR_DEV_GITHUB_NO_TOKEN");
    const { branch } = request;

    // nova rodada de ajuste: o commit entra em cima do que já está na branch
    const existing = await this.call(`/git/ref/heads/${encodeRef(branch)}`);
    const parent = existing.ok
      ? (await existing.json()).object.sha
      : request.baseSha;
    if (!existing.ok && existing.status !== 404) {
      await GithubSource.fail(existing);
    }

    const parentCommit = await this.json(`/git/commits/${parent}`);
    const tree = await this.json("/git/trees", {
      method: "POST",
      body: {
        base_tree: parentCommit.tree.sha,
        tree: request.changes.map(change =>
          change.op === "delete"
            ? { path: change.path, mode: "100644", type: "blob", sha: null }
            : {
                path: change.path,
                mode: "100644",
                type: "blob",
                content: change.content
              }
        )
      }
    });
    const commit = await this.json("/git/commits", {
      method: "POST",
      body: { message: request.message, tree: tree.sha, parents: [parent] }
    });

    if (existing.ok) {
      await this.json(`/git/refs/heads/${encodeRef(branch)}`, {
        method: "PATCH",
        body: { sha: commit.sha, force: false }
      });
    } else {
      await this.json("/git/refs", {
        method: "POST",
        body: { ref: `refs/heads/${branch}`, sha: commit.sha }
      });
    }

    // PR já aberto para a branch (rodada de ajuste): só ganhou um commit
    const owner = this.repo.split("/")[0];
    const open = await this.json(
      `/pulls?state=open&head=${encodeURIComponent(`${owner}:${branch}`)}`
    );
    if (Array.isArray(open) && open.length) {
      return { url: open[0].html_url, number: open[0].number };
    }

    const pr = { title: request.title, head: branch, base: this.branch };
    // rascunho: ninguém faz merge sem querer. Repositório privado em plano
    // gratuito não tem rascunho; aí abre normal
    let res = await this.call("/pulls", {
      method: "POST",
      body: { ...pr, body: request.body, draft: true }
    });
    if (res.status === 422) {
      res = await this.call("/pulls", {
        method: "POST",
        body: { ...pr, body: request.body }
      });
    }
    if (!res.ok) await GithubSource.fail(res);
    const created = await res.json();
    return { url: created.html_url, number: created.number };
  }

  async pull(number: number): Promise<PullState | null> {
    const res = await this.call(`/pulls/${number}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { open: data.state === "open", merged: !!data.merged };
  }

  /**
   * Busca de código do GitHub: só com token, só na branch padrão e com
   * limite de 10 por minuto. Devolve o trecho onde o termo aparece (sem
   * número de linha: o agente pede o arquivo para ver o resto).
   */
  async search(_sha: string, query: string): Promise<string[] | null> {
    if (!this.token) return null;
    const q = encodeURIComponent(`${query} repo:${this.repo}`);
    const res = await fetch(`${GITHUB}/search/code?q=${q}&per_page=20`, {
      headers: {
        Accept: "application/vnd.github.text-match+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "vuup.me-dev-pipeline",
        Authorization: `Bearer ${this.token}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.items || [])
      .filter((item: { path: string }) => canRead(item.path))
      .flatMap(
        (item: { path: string; text_matches?: { fragment: string }[] }) =>
          (item.text_matches || [{ fragment: "" }]).map(
            match =>
              `${item.path}: ${String(match.fragment || "")
                .replace(/\s+/g, " ")
                .slice(0, 200)}`
          )
      )
      .slice(0, 40);
  }
}

// ---------------------------------------------------------------------------
// pasta local (ambiente de desenvolvimento)

const run = promisify(execFile);

class LocalSource implements RepoSource {
  kind = "local" as const;

  label = "local";

  canPublish = false;

  constructor(private root: string) {}

  private git(args: string[]) {
    // a pasta é montada de outro dono: sem safe.directory o git se recusa
    return run("git", ["-c", "safe.directory=*", "-C", this.root, ...args], {
      maxBuffer: 20 * 1024 * 1024
    });
  }

  async head(): Promise<string> {
    try {
      const { stdout } = await this.git(["rev-parse", "HEAD"]);
      return stdout.trim();
    } catch {
      return "local";
    }
  }

  async list(): Promise<RepoFile[]> {
    const { stdout } = await this.git(["ls-files", "-z"]);
    const paths = stdout.split("\0").filter(Boolean);
    return Promise.all(
      paths.map(async file => {
        const stat = await fs.promises
          .stat(path.join(this.root, file))
          .catch(() => null);
        return { path: file, size: stat?.size || 0 };
      })
    ).then(list => list.filter(item => item.size > 0));
  }

  async read(_sha: string, file: string): Promise<string | null> {
    if (!canRead(file)) return null;
    const full = path.resolve(this.root, file);
    if (!full.startsWith(`${path.resolve(this.root)}${path.sep}`)) return null;
    try {
      return await fs.promises.readFile(full, "utf8");
    } catch {
      return null;
    }
  }

  async publish(): Promise<PublishResult> {
    throw new RepoError("ERR_DEV_GITHUB_NO_TOKEN");
  }

  async pull(): Promise<PullState | null> {
    return null;
  }

  async search(_sha: string, query: string): Promise<string[] | null> {
    try {
      const { stdout } = await this.git([
        "grep",
        "-n",
        "-I",
        "-F",
        "--max-count=5",
        "-e",
        query
      ]);
      return stdout
        .split("\n")
        .filter(line => line && canRead(line.split(":")[0]))
        .map(line => line.slice(0, 220))
        .slice(0, 40);
    } catch {
      // git grep sai com erro quando não acha nada
      return [];
    }
  }
}

/**
 * Fonte do código: GitHub com token manda; sem token, a pasta local (dev)
 * vem antes do GitHub público, para não gastar o limite de 60 leituras por
 * hora que o GitHub dá a quem não se identifica.
 */
export const openRepo = (config: DevConfig): RepoSource | null => {
  if (config.githubRepo && config.githubToken) {
    return new GithubSource(
      config.githubRepo,
      config.githubBranch,
      config.githubToken
    );
  }
  const local = process.env.DEV_PIPELINE_REPO_PATH;
  if (local && fs.existsSync(path.join(local, ".git"))) {
    return new LocalSource(local);
  }
  if (config.githubRepo) {
    return new GithubSource(config.githubRepo, config.githubBranch, "");
  }
  return null;
};
