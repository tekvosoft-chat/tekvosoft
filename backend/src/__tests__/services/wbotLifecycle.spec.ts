import { EventEmitter } from "events";

jest.mock("libzapitu-rf", () => ({
  __esModule: true,
  default: jest.fn(),
  DisconnectReason: { loggedOut: 401, restartRequired: 515, connectionReplaced: 440 },
  jidNormalizedUser: (jid: string) => jid,
  isJidBroadcast: () => false
}));
jest.mock("libzapitu-rf/worker", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("node-cache", () => ({
  __esModule: true,
  default: class {
    values = new Map();
    get(key: string) { return this.values.get(key); }
    set(key: string, value: unknown) { this.values.set(key, value); }
  }
}));
jest.mock("../../utils/logger", () => ({
  logger: { info: jest.fn(), debug: jest.fn(), trace: jest.fn(), warn: jest.fn(), error: jest.fn() },
  loggerBaileys: {}
}));
jest.mock("@sentry/node", () => ({ captureException: jest.fn() }));
jest.mock("../../libs/socket", () => {
  const io = { to: jest.fn(), emit: jest.fn() };
  io.to.mockReturnValue(io);
  return { getIO: () => io };
});
jest.mock("../../helpers/authState", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ state: { creds: {}, keys: {} }, saveState: jest.fn() })
}));
jest.mock("../../helpers/CheckSettings", () => ({ GetCompanySetting: jest.fn().mockResolvedValue("disabled") }));
jest.mock("../../gitinfo", () => ({ GitInfo: { tagName: "test" } }));
jest.mock("../../services/WbotServices/wbotMessageListener", () => ({ wbotMessageListener: jest.fn() }));
jest.mock("../../services/WbotServices/wbotMonitor", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../services/WbotServices/StartWhatsAppSession", () => ({ StartWhatsAppSession: jest.fn() }));
jest.mock("../../services/DecoupledDriverServices/DecoupledDriverServices", () => ({
  DecoupledDriverServices: { getInstance: () => new Proxy({}, { get: () => jest.fn() }) }
}));

for (const modulePath of [
  "../../models/Whatsapp", "../../models/Contact", "../../models/Ticket",
  "../../models/Message", "../../models/OutOfTicketMessages",
  "../../models/BaileysKeys", "../../models/WhatsappLidMap",
  "../../services/BaileysServices/DeleteBaileysService",
  "../../services/SettingServices/GetPublicSettingService",
  "../../services/TicketServices/ShowTicketService", "../../helpers/GetTicketWbot"
]) {
  jest.doMock(modulePath, () => ({
    __esModule: true,
    default: Object.assign(jest.fn().mockResolvedValue(undefined), {
      findOne: jest.fn(), destroy: jest.fn().mockResolvedValue(undefined)
    })
  }));
}

const { initWASocket, removeWbot, closeAllSessions, getWbot } = require("../../libs/wbot");
const makeSocket = require("libzapitu-rf").default;
const Whatsapp = require("../../models/Whatsapp").default;
const { StartWhatsAppSession } = require("../../services/WbotServices/StartWhatsAppSession");
const { wbotMessageListener } = require("../../services/WbotServices/wbotMessageListener");
const monitor = require("../../services/WbotServices/wbotMonitor").default;

const flush = async () => {
  for (let index = 0; index < 30; index += 1) await Promise.resolve();
};
const whatsapp = {
  id: 11, companyId: 2, name: "Teste", provider: "stable",
  update: jest.fn().mockResolvedValue(undefined),
  reload: jest.fn().mockResolvedValue(undefined)
};
const sockets: any[] = [];

beforeEach(() => {
  jest.useFakeTimers();
  sockets.length = 0;
  Whatsapp.findOne.mockResolvedValue(whatsapp);
  makeSocket.mockImplementation(() => {
    const ws = Object.assign(new EventEmitter(), { close: jest.fn().mockResolvedValue(undefined) });
    const socket = {
      ev: new EventEmitter(), ws, end: jest.fn(), logout: jest.fn().mockResolvedValue(undefined),
      user: { id: "123@s.whatsapp.net", name: "Teste" },
      fetchAccountReachoutTimelock: jest.fn().mockResolvedValue(null),
      fetchNewChatMessageCap: jest.fn().mockResolvedValue(null),
      resyncAppState: jest.fn().mockResolvedValue(undefined)
    };
    sockets.push(socket);
    return socket;
  });
  StartWhatsAppSession.mockImplementation((row: unknown, companyId: number, refresh: boolean) => initWASocket(row, null, refresh));
  global.fetch = jest.fn().mockResolvedValue({ json: async () => [2, 3000, 0] });
});

afterEach(async () => {
  await closeAllSessions();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const close = (socket: any, code: number) => socket.ev.listeners("connection.update")[0]({
  connection: "close", lastDisconnect: { error: { output: { statusCode: code } } }
});

describe("ciclo de vida do WhatsApp", () => {
  it("registra a sessão e os listeners sem esperar o open e compartilha inicializações concorrentes", async () => {
    const [first, second] = await Promise.all([initWASocket(whatsapp), initWASocket(whatsapp)]);
    expect(first).toBe(second);
    expect(getWbot(11)).toBe(first);
    expect(makeSocket).toHaveBeenCalledTimes(1);
    expect(wbotMessageListener).toHaveBeenCalledTimes(1);
    expect(monitor).toHaveBeenCalledTimes(1);
  });

  it("reconecta após 515 antes do primeiro open e ignora closes repetidos ou tardios", async () => {
    const socket = await initWASocket(whatsapp);
    const handler = socket.ev.listeners("connection.update")[0];
    socket.ev.on("messages.upsert", jest.fn());
    socket.ev.on("messages.update", jest.fn());
    socket.ev.on("message-receipt.update", jest.fn());
    await close(socket, 515);
    await handler({ connection: "close" });
    expect(socket.ev.listenerCount("messages.upsert")).toBe(0);
    expect(socket.ev.listenerCount("messages.update")).toBe(0);
    expect(socket.ev.listenerCount("message-receipt.update")).toBe(0);
    jest.advanceTimersByTime(1000);
    await flush();
    expect(StartWhatsAppSession).toHaveBeenCalledTimes(1);
    expect(makeSocket).toHaveBeenCalledTimes(2);
    expect(getWbot(11)).toBe(sockets[1]);
    await handler({ connection: "close" });
    expect(getWbot(11)).toBe(sockets[1]);
  });

  it("reconecta uma queda de rede sem apagar as credenciais", async () => {
    const socket = await initWASocket(whatsapp);
    expect(makeSocket.mock.calls[0][0].emitOwnEvents).toBe(true);
    await close(socket, 408);
    expect(socket.logout).not.toHaveBeenCalled();
    jest.advanceTimersByTime(120000);
    await flush();
    expect(StartWhatsAppSession).toHaveBeenCalledTimes(1);
    expect(makeSocket).toHaveBeenCalledTimes(2);
  });

  it("tenta de novo se a primeira reconexão não criar um socket", async () => {
    const socket = await initWASocket(whatsapp);
    StartWhatsAppSession.mockResolvedValueOnce(undefined);
    await close(socket, 408);
    jest.advanceTimersByTime(2000);
    await flush();
    expect(StartWhatsAppSession).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(5000);
    await flush();
    expect(StartWhatsAppSession).toHaveBeenCalledTimes(2);
    expect(makeSocket).toHaveBeenCalledTimes(2);
  });

  it.each([401, 403])("não reconecta credenciais revogadas (%s)", async code => {
    const socket = await initWASocket(whatsapp);
    await close(socket, code);
    jest.advanceTimersByTime(120000);
    await flush();
    expect(socket.logout).toHaveBeenCalledTimes(1);
    expect(StartWhatsAppSession).not.toHaveBeenCalled();
  });

  it("cancelar a sessão cancela também a reconexão pendente", async () => {
    const socket = await initWASocket(whatsapp);
    await close(socket, 408);
    await removeWbot(11, false);
    jest.advanceTimersByTime(120000);
    await flush();
    expect(StartWhatsAppSession).not.toHaveBeenCalled();
  });

  it("rejeita erros assíncronos de inicialização sem deixar a tentativa presa", async () => {
    Whatsapp.findOne.mockRejectedValueOnce(new Error("banco indisponível"));
    await expect(initWASocket(whatsapp)).rejects.toThrow("banco indisponível");
    await expect(initWASocket(whatsapp)).resolves.toBeDefined();
  });
});
