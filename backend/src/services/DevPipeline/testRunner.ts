import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { Op } from "sequelize";
import { Browser, BrowserContext, Page, chromium } from "playwright-core";
import User from "../../models/User";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { DevAttachment, DevTestPlan } from "../../models/DevTask";
import { logger } from "../../utils/logger";
import { saveCapture } from "./images";
import { TesterPlanReply } from "./prompts";

/**
 * O navegador do testador (Clique).
 *
 * Roda num container à parte (serviço "browser" do compose, a imagem oficial
 * do Playwright) e o backend só conecta nele: o Chromium não entra na imagem
 * do backend nem enxerga os segredos dela. Sem PLAYWRIGHT_WS_ENDPOINT, não
 * há teste de tela e a demanda segue sem ele.
 *
 * Segurança, porque o teste roda no sistema de verdade:
 *  - entra como o primeiro super admin com um token feito aqui (nenhuma
 *    senha é guardada nem digitada, e o código de navegador novo não vale
 *    para ele, que nunca passa pela tela de login);
 *  - só-leitura: todo pedido que não seja GET é barrado no próprio
 *    navegador, menos a renovação do token. Um clique errado não salva,
 *    não envia mensagem e não apaga nada;
 *  - só abre caminhos do próprio sistema, com tempo máximo por passo e
 *    por aparelho.
 */
export class TestRunError extends Error {
  code: string;

  detail: string;

  constructor(code: string, detail = "") {
    super(detail ? `${code}: ${detail}` : code);
    this.code = code;
    this.detail = detail;
  }
}

export interface StepLog {
  device: string;
  step: number;
  action: string;
  target: string;
  ok: boolean;
  error?: string;
  note?: string;
  // anexo da foto tirada neste passo
  shot?: string;
}

export interface TestRun {
  url: string;
  captures: DevAttachment[];
  log: StepLog[];
  // escritas que o navegador barrou (mostra que o teste não mexeu em nada)
  blocked: string[];
  // erros de JavaScript da página: sinal de tela quebrada
  pageErrors: string[];
}

const endpoint = () => String(process.env.PLAYWRIGHT_WS_ENDPOINT || "").trim();

export const browserReady = (): boolean => !!endpoint();

// onde o navegador abre o sistema: o endereço público; DEV_TEST_URL troca
// quando o navegador enxerga o sistema por outro nome
const appUrl = () =>
  String(process.env.DEV_TEST_URL || process.env.FRONTEND_URL || "").replace(
    /\/+$/,
    ""
  );

const STEP_TIMEOUT = 10000;
const DEVICE_BUDGET = 120000;
const MAX_STEPS = 12;
const KEYS = ["Escape", "Tab", "ArrowDown", "ArrowUp", "PageDown", "PageUp"];

const DEVICES = {
  desktop: {
    viewport: { width: 1366, height: 820 },
    deviceScaleFactor: 1
  },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
  }
};

type Device = keyof typeof DEVICES;

const tester = () =>
  User.findOne({
    where: { super: true, active: { [Op.ne]: false } },
    order: [["id", "ASC"]]
  });

/** Entra como o super: token no navegador e o cookie de renovação. */
const signIn = async (context: BrowserContext, user: User, base: string) => {
  const api = new URL(String(process.env.BACKEND_URL || base));
  const secure = api.protocol === "https:";
  await context.addCookies([
    {
      name: "jrt",
      value: createRefreshToken(user),
      domain: api.hostname,
      path: "/",
      httpOnly: true,
      secure,
      sameSite: secure ? "None" : "Lax"
    }
  ]);
  // o mesmo que o login grava (useAuth); só na primeira página, para não
  // desfazer a renovação que o próprio sistema fizer depois
  const values = {
    token: JSON.stringify(createAccessToken(user)),
    companyId: String(user.companyId),
    userId: String(user.id),
    impersonated: "false"
  };
  await context.addInitScript({
    content: `(() => {
      if (window.location.origin !== ${JSON.stringify(new URL(base).origin)}) return;
      if (window.localStorage.getItem("token")) return;
      const values = ${JSON.stringify(values)};
      Object.keys(values).forEach(key => window.localStorage.setItem(key, values[key]));
    })();`
  });
};

/** Só-leitura: o navegador não consegue gravar nada no sistema. */
const readOnly = async (context: BrowserContext, blocked: string[]) => {
  await context.route("**/*", route => {
    const request = route.request();
    const method = request.method();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) return route.continue();
    const { pathname } = new URL(request.url());
    if (pathname.endsWith("/auth/refresh_token")) return route.continue();
    if (blocked.length < 30) blocked.push(`${method} ${pathname}`);
    return route.abort("blockedbyclient");
  });
};

const TEST_ACTIONS = [
  "goto",
  "click",
  "fill",
  "press",
  "wait",
  "scroll",
  "screenshot"
];

/** O roteiro como a IA escreveu, podado para o que o navegador aceita. */
export const cleanPlan = (reply: TesterPlanReply): DevTestPlan => {
  const steps = (reply.steps || [])
    .filter(step => TEST_ACTIONS.includes(step.action))
    .slice(0, 12)
    .map(step => ({
      action: step.action,
      target: String(step.target || "").slice(0, 300),
      value: String(step.value || "").slice(0, 200),
      note: String(step.note || "").slice(0, 200)
    }));
  // sem abrir uma tela primeiro, a foto sairia em branco
  if (steps.length && steps[0].action !== "goto") {
    steps.unshift({ action: "goto", target: "/", value: "", note: "" });
  }
  const devices = [
    ...new Set(
      (reply.devices || []).filter(device =>
        ["desktop", "mobile"].includes(device)
      )
    )
  ];
  return {
    needed: !!reply.needed && steps.length > 0,
    reason: String(reply.reason || "").slice(0, 500),
    devices: devices.length ? devices : ["desktop"],
    steps,
    checks: (reply.checks || []).slice(0, 4)
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Um passo do roteiro. Devolve true quando o passo pede foto. */
const runStep = async (
  page: Page,
  base: string,
  step: DevTestPlan["steps"][number]
): Promise<boolean> => {
  const target = String(step.target || "").trim();
  const value = String(step.value || "");
  switch (step.action) {
    case "goto": {
      const where = target || "/";
      if (!where.startsWith("/") || where.startsWith("//")) {
        throw new Error("caminho fora do sistema");
      }
      await page.goto(`${base}${where}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });
      // a tela ainda busca dados depois de abrir: espera um pouco, sem travar
      await page
        .waitForLoadState("networkidle", { timeout: 8000 })
        .catch(() => null);
      return false;
    }
    case "click":
      await page.locator(target).first().click({ timeout: STEP_TIMEOUT });
      await page.waitForTimeout(600);
      return false;
    case "fill":
      await page
        .locator(target)
        .first()
        .fill(value.slice(0, 200), { timeout: STEP_TIMEOUT });
      await page.waitForTimeout(400);
      return false;
    case "press":
      if (!KEYS.includes(target)) throw new Error(`tecla ${target} barrada`);
      await page.keyboard.press(target);
      await page.waitForTimeout(300);
      return false;
    case "wait":
      await page.waitForTimeout(clamp(parseInt(value, 10) || 1000, 0, 3000));
      return false;
    case "scroll":
      await page.mouse.wheel(0, clamp(parseInt(value, 10) || 400, -4000, 4000));
      await page.waitForTimeout(400);
      return false;
    case "screenshot":
      return true;
    default:
      throw new Error(`ação ${step.action} desconhecida`);
  }
};

const shoot = async (page: Page, name: string): Promise<DevAttachment> =>
  saveCapture(await page.screenshot({ type: "png" }), name, "image/png");

/** Roda o roteiro num aparelho, gravando vídeo; nunca passa do tempo. */
const runDevice = async (
  browser: Browser,
  device: Device,
  plan: DevTestPlan,
  user: User,
  run: TestRun
) => {
  const base = run.url;
  const context = await browser.newContext({
    ...DEVICES[device],
    locale: "pt-BR",
    timezoneId: process.env.TZ || "America/Sao_Paulo",
    recordVideo: { dir: path.join(os.tmpdir(), "vuup-tests") }
  });
  let page: Page | null = null;
  const shots: DevAttachment[] = [];
  try {
    await readOnly(context, run.blocked);
    await signIn(context, user, base);
    page = await context.newPage();
    page.on("pageerror", error => {
      if (run.pageErrors.length < 10) {
        run.pageErrors.push(
          `${device}: ${String(error.message).slice(0, 200)}`
        );
      }
    });

    const started = Date.now();
    const steps = plan.steps.slice(0, MAX_STEPS);
    // eslint-disable-next-line no-restricted-syntax
    for (const [index, step] of steps.entries()) {
      const entry: StepLog = {
        device,
        step: index + 1,
        action: step.action,
        target: step.target,
        note: step.note,
        ok: true
      };
      run.log.push(entry);
      if (Date.now() - started > DEVICE_BUDGET) {
        entry.ok = false;
        entry.error = "tempo do aparelho esgotado";
        break;
      }
      try {
        if (await runStep(page, base, step)) {
          const shot = await shoot(page, `${device}-${shots.length + 1}.png`);
          shots.push(shot);
          entry.shot = shot.id;
        }
      } catch (error) {
        entry.ok = false;
        entry.error = String((error as Error)?.message || error)
          .split("\n")[0]
          .slice(0, 240);
        // a foto do momento do erro ajuda mais que qualquer mensagem
        const shot = await shoot(page, `${device}-erro.png`).catch(() => null);
        if (shot) {
          shots.push(shot);
          entry.shot = shot.id;
        }
        break;
      }
    }
    // roteiro sem foto: fica ao menos o fim do caminho
    if (!shots.length) shots.push(await shoot(page, `${device}-1.png`));
  } finally {
    const video = page?.video();
    await context.close().catch(() => null);
    run.captures.push(...shots);
    if (video) {
      const file = path.join(
        os.tmpdir(),
        `vuup-${crypto.randomBytes(8).toString("hex")}.webm`
      );
      try {
        // conectado a outro container, o vídeo só chega pelo saveAs
        await video.saveAs(file);
        const data = await fs.promises.readFile(file);
        run.captures.push(
          await saveCapture(data, `${device}.webm`, "video/webm")
        );
      } catch (error) {
        logger.warn({ error }, "DevPipeline: vídeo do teste");
      } finally {
        fs.promises.unlink(file).catch(() => null);
      }
    }
  }
};

export const runBrowserTest = async (plan: DevTestPlan): Promise<TestRun> => {
  if (!browserReady()) throw new TestRunError("ERR_DEV_TEST_NO_BROWSER");
  const url = appUrl();
  if (!url) throw new TestRunError("ERR_DEV_TEST_NO_URL");
  const user = await tester();
  if (!user) throw new TestRunError("ERR_DEV_TEST_NO_USER");

  let browser: Browser;
  try {
    browser = await chromium.connect(endpoint(), { timeout: 30000 });
  } catch (error) {
    throw new TestRunError(
      "ERR_DEV_TEST_BROWSER",
      String((error as Error)?.message || error).split("\n")[0]
    );
  }

  const run: TestRun = {
    url,
    captures: [],
    log: [],
    blocked: [],
    pageErrors: []
  };
  const devices = (plan.devices || []).filter(
    (device): device is Device => device in DEVICES
  );
  try {
    // eslint-disable-next-line no-restricted-syntax
    for (const device of devices.length ? devices : ["desktop" as Device]) {
      await runDevice(browser, device, plan, user, run);
    }
  } finally {
    await browser.close().catch(() => null);
  }
  return run;
};
