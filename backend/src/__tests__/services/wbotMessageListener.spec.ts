import { EventEmitter } from "events";

jest.mock("libzapitu-rf", () => ({
  getContentType: (message: object) => message && Object.keys(message)[0],
  extractMessageContent: (message: object) => message,
  jidNormalizedUser: (jid: string) => jid,
  WAMessageStubType: { REVOKE: 1, E2E_DEVICE_CHANGED: 2, E2E_IDENTITY_CHANGED: 3, CIPHERTEXT: 4 },
  WAMessageStatus: { ERROR: 0 }
}));
jest.mock("@sentry/node", () => ({ captureException: jest.fn(), setExtra: jest.fn() }));
jest.mock("../../utils/logger", () => ({
  logger: { info: jest.fn(), debug: jest.fn(), trace: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));
jest.mock("../../helpers/simpleObjectCache", () => ({
  SimpleObjectCache: class {
    values = new Map();
    get(key: string) { return this.values.get(key); }
    set(key: string, value: unknown) { this.values.set(key, value); }
  }
}));
jest.mock("../../libs/socket", () => {
  const io = { to: jest.fn(), emit: jest.fn() };
  io.to.mockReturnValue(io);
  return { getIO: () => io };
});
jest.mock("../../helpers/CheckSettings", () => ({
  __esModule: true, default: jest.fn(), GetCompanySetting: jest.fn().mockResolvedValue("disabled")
}));
jest.mock("../../libs/cache", () => ({ cacheLayer: { set: jest.fn().mockResolvedValue(undefined) } }));
jest.mock("../../queues/campaign", () => ({ campaignQueue: { add: jest.fn() } }));
jest.mock("../../services/AiServices/QueueAiAgent", () => ({ handleQueueAi: jest.fn() }));
jest.mock("../../services/AiServices/SmartReception", () => ({ decideQueue: jest.fn(), smartReceptionEnabled: jest.fn() }));
jest.mock("../../services/TranslationServices/i18nService", () => ({ _t: (key: string) => key }));
jest.mock("../../services/WbotServices/verifyContact", () => ({ verifyContact: jest.fn() }));

for (const modulePath of [
  "../../models/Contact", "../../models/Ticket", "../../models/Message", "../../models/OldMessage",
  "../../models/TicketTraking", "../../models/UserRating", "../../models/Queue", "../../models/QueueOption",
  "../../models/Campaign", "../../models/CampaignShipping", "../../models/User", "../../models/Setting",
  "../../models/Whatsapp", "../../models/WhatsappLidMap",
  "../../services/MessageServices/CreateMessageService",
  "../../services/TicketServices/FindOrCreateTicketService",
  "../../services/WhatsappService/ShowWhatsAppService",
  "../../services/TicketServices/UpdateTicketService",
  "../../services/CompanyService/VerifyCurrentSchedule",
  "../../services/WbotServices/SendWhatsAppMessage", "../../services/WbotServices/SendWhatsAppMedia",
  "../../services/WbotServices/getJidOf", "../../services/WbotServices/decryptMessageEdit",
  "../../helpers/Mustache", "../../helpers/Debounce", "../../helpers/MakeRandomId",
  "../../helpers/CheckCompanyCompliant", "../../helpers/parseToMilliseconds", "../../helpers/randomValue",
  "../../helpers/GetTicketWbot", "../../helpers/saveMediaFile"
]) {
  jest.doMock(modulePath, () => ({
    __esModule: true,
    default: Object.assign(jest.fn(), { findOne: jest.fn(), findAll: jest.fn().mockResolvedValue([]) }),
    websocketCreateMessage: jest.fn(), checkCompanyCompliant: jest.fn().mockResolvedValue(true),
    getMessageFileOptions: jest.fn(), debounce: jest.fn(), makeRandomId: jest.fn(),
    parseToMilliseconds: jest.fn(), randomValue: jest.fn(), getJidOf: jest.fn(), decryptMessageEdit: jest.fn()
  }));
}

const { wbotMessageListener } = require("../../services/WbotServices/wbotMessageListener");
const Message = require("../../models/Message").default;
const createMessage = require("../../services/MessageServices/CreateMessageService").default;
const findTicket = require("../../services/TicketServices/FindOrCreateTicketService").default;
const showWhatsapp = require("../../services/WhatsappService/ShowWhatsAppService").default;
const { verifyContact } = require("../../services/WbotServices/verifyContact");
const stored = new Set<string>();
const contact = { id: 20, companyId: 2, disableBot: true, isGroup: false };
const ticket = {
  id: 30, companyId: 2, status: "open", unreadMessages: 0, chatbot: false, contact,
  update: jest.fn().mockResolvedValue(undefined), reload: jest.fn().mockResolvedValue(undefined)
};
const makeSession = (id = 11) => ({
  id, ev: new EventEmitter(), user: { id: "999@s.whatsapp.net", name: "Teste" },
  sendReceipts: jest.fn().mockResolvedValue(undefined), sendMessage: jest.fn(), readMessages: jest.fn()
});
const message = (id: string, fromMe = false) => ({
  key: { id, fromMe, remoteJid: "123@s.whatsapp.net" },
  message: { conversation: "Olá" }, pushName: "Contato"
});
const upsert = (session: ReturnType<typeof makeSession>, messages: object[], type = "notify") =>
  session.ev.listeners("messages.upsert")[0]({ messages, type });

beforeEach(() => {
  stored.clear();
  Message.findOne.mockImplementation(async ({ where }: any) => stored.has(`${where.companyId}:${where.id}`) ? { id: where.id } : null);
  createMessage.mockImplementation(async ({ messageData, companyId }: any) => {
    stored.add(`${companyId}:${messageData.id}`);
    return { ...messageData, companyId };
  });
  findTicket.mockResolvedValue({ ticket, justCreated: false });
  showWhatsapp.mockResolvedValue({ queues: [] });
  verifyContact.mockResolvedValue(contact);
});

describe("recebimento do WhatsApp", () => {
  it("registra cada listener apenas uma vez no mesmo socket", async () => {
    const session = makeSession();
    await wbotMessageListener(session, 2);
    await wbotMessageListener(session, 2);
    for (const event of ["messages.upsert", "messages.update", "message-receipt.update"]) {
      expect(session.ev.listenerCount(event)).toBe(1);
    }
  });

  it("recebe texto iniciado no aplicativo oficial, inclusive embrulhado e em append", async () => {
    const session = makeSession();
    await wbotMessageListener(session, 2);
    const official = {
      ...message("official", true),
      key: { ...message("official", true).key, sender_pn: "999@s.whatsapp.net", peer_recipient_pn: "123@s.whatsapp.net" },
      message: { ephemeralMessage: { message: { deviceSentMessage: { message: { conversation: "Olá pelo celular" } } } } }
    };
    await upsert(session, [official], "append");
    expect(verifyContact).toHaveBeenCalledWith(expect.objectContaining({ id: "123@s.whatsapp.net" }), session, 2, { trustedMessage: true });
    expect(createMessage).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 2, messageData: expect.objectContaining({ id: "official", fromMe: true, body: "Olá pelo celular" })
    }));
    expect(session.sendReceipts).not.toHaveBeenCalled();
    expect(session.sendMessage).not.toHaveBeenCalled();
  });

  it("processa contatos enviados pelo celular sem o filtro antigo de texto e mídia", async () => {
    const session = makeSession();
    await wbotMessageListener(session, 2);
    await upsert(session, [{ ...message("contact", true), message: {
      contactMessage: { displayName: "Contato", vcard: "BEGIN:VCARD\nFN:Contato\nEND:VCARD" }
    } }]);
    expect(createMessage).toHaveBeenCalledTimes(1);
  });

  it("não duplica gravação nem contador quando dois sockets entregam a mesma mensagem", async () => {
    const first = makeSession();
    const second = makeSession(12);
    await wbotMessageListener(first, 2);
    await wbotMessageListener(second, 2);
    await Promise.all([upsert(first, [message("duplicate")]), upsert(second, [message("duplicate")])]);
    await upsert(second, [message("duplicate")], "append");
    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(findTicket).toHaveBeenCalledTimes(1);
    expect(Message.findOne).toHaveBeenCalledWith({ where: { id: "duplicate", companyId: 2 }, attributes: ["id"] });
    expect(first.sendMessage).not.toHaveBeenCalled();
    expect(second.sendMessage).not.toHaveBeenCalled();
  });

  it("a deduplicação não mistura empresas", async () => {
    const first = makeSession();
    const second = makeSession(12);
    await wbotMessageListener(first, 2);
    await wbotMessageListener(second, 3);
    await Promise.all([upsert(first, [message("shared-id")]), upsert(second, [message("shared-id")])]);
    expect(findTicket).toHaveBeenCalledTimes(2);
    expect(findTicket.mock.calls.map((call: any[]) => call[2]).sort()).toEqual([2, 3]);
  });

  it("não espera um recibo travado e permite receber outras mensagens", async () => {
    const session = makeSession();
    session.sendReceipts.mockImplementation(() => new Promise(() => {}));
    await wbotMessageListener(session, 2);
    await upsert(session, [message("receipt-1"), message("receipt-2")]);
    expect(createMessage).toHaveBeenCalledTimes(2);
  });

  it("preserva o tratamento de erro e libera a trava para uma nova entrega", async () => {
    const session = makeSession();
    await wbotMessageListener(session, 2);
    Message.findOne.mockRejectedValueOnce(new Error("banco indisponível"));
    await upsert(session, [message("retry")]);
    await upsert(session, [message("retry")]);
    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(require("@sentry/node").captureException).toHaveBeenCalled();
  });
});
