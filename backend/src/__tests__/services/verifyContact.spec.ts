import Contact from "../../models/Contact";
import WhatsappLidMap from "../../models/WhatsappLidMap";
import { Session } from "../../libs/wbot";
import CreateOrUpdateContactService, {
  updateContact
} from "../../services/ContactServices/CreateOrUpdateContactService";
import MergeContactsService from "../../services/ContactServices/MergeContactsService";
import { verifyContact } from "../../services/WbotServices/verifyContact";

jest.mock("../../models/Contact", () => ({
  __esModule: true,
  default: { findAll: jest.fn() }
}));
jest.mock("../../models/WhatsappLidMap", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  }
}));
jest.mock("../../services/ContactServices/CreateOrUpdateContactService", () => ({
  __esModule: true,
  default: jest.fn(),
  updateContact: jest.fn()
}));
jest.mock("../../services/ContactServices/MergeContactsService", () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock("../../services/WbotServices/GetProfilePicUrl", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined)
}));

const phone = { id: "351912345678@s.whatsapp.net", name: "Contato" };
const contact = {
  id: 10,
  companyId: 2,
  number: "351912345678",
  reload: jest.fn().mockResolvedValue(undefined)
} as unknown as Contact;
const onWhatsApp = jest.fn();
const session = { onWhatsApp } as unknown as Session;

beforeEach(() => {
  jest.clearAllMocks();
  (Contact.findAll as jest.Mock).mockResolvedValue([]);
  (WhatsappLidMap.findOne as jest.Mock).mockResolvedValue(null);
  (WhatsappLidMap.findAll as jest.Mock).mockResolvedValue([]);
  (CreateOrUpdateContactService as jest.Mock).mockResolvedValue(contact);
  (updateContact as jest.Mock).mockImplementation(async current => current);
  (MergeContactsService as jest.Mock).mockResolvedValue(contact);
  onWhatsApp.mockResolvedValue([]);
});

describe("contato de mensagem entregue pelo WhatsApp", () => {
  it("cria contato novo mesmo quando a consulta de LID não encontra o número", async () => {
    await expect(
      verifyContact(phone, session, 2, { trustedMessage: true })
    ).resolves.toBe(contact);
    expect(CreateOrUpdateContactService).toHaveBeenCalledWith(
      expect.objectContaining({ number: contact.number, companyId: 2 })
    );
    expect(Contact.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 2 })
      })
    );
  });

  it("não perde a mensagem por falha na consulta auxiliar", async () => {
    onWhatsApp.mockRejectedValueOnce(new Error("consulta indisponível"));
    await expect(
      verifyContact(phone, session, 2, { trustedMessage: true })
    ).resolves.toBe(contact);
  });

  it("mantém a validação estrita dos demais chamadores", async () => {
    await expect(verifyContact(phone, session, 2)).rejects.toThrow(
      "ERR_WAPP_CONTACT_NOT_FOUND"
    );
    expect(CreateOrUpdateContactService).not.toHaveBeenCalled();
  });

  it("reutiliza o contato e preserva o mapa existente sem um novo LID", async () => {
    const mappedContact = {
      ...contact,
      whatsappLidMap: { id: 20, lid: "123@lid" }
    } as Contact;
    (Contact.findAll as jest.Mock).mockResolvedValueOnce([mappedContact]);
    (MergeContactsService as jest.Mock).mockResolvedValue(mappedContact);

    await expect(
      verifyContact(phone, session, 2, { trustedMessage: true })
    ).resolves.toBe(mappedContact);
    expect(WhatsappLidMap.destroy).not.toHaveBeenCalled();
    expect(CreateOrUpdateContactService).not.toHaveBeenCalled();
  });

  it("usa o LID recebido sem consultar novamente o WhatsApp", async () => {
    await verifyContact(
      { ...phone, lid: "123@lid" },
      session,
      2,
      { trustedMessage: true }
    );
    expect(onWhatsApp).not.toHaveBeenCalled();
  });

  it("continua criando contatos novos com identidade somente LID", async () => {
    await verifyContact(
      { id: "123@lid", name: "Contato LID" },
      session,
      2,
      { trustedMessage: true }
    );
    expect(CreateOrUpdateContactService).toHaveBeenCalledWith(
      expect.objectContaining({ number: "123@lid", companyId: 2 })
    );
    expect(onWhatsApp).not.toHaveBeenCalled();
  });
});
