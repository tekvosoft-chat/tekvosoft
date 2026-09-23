import "../bootstrap";
import sequelize from "../database";
import Company from "../models/Company";
import Whatsapp from "../models/Whatsapp";
import Queue from "../models/Queue";
import Tag from "../models/Tag";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import TicketTag from "../models/TicketTag";
import Message from "../models/Message";
import TicketNote from "../models/TicketNote";
import TicketJourney from "../models/TicketJourney";
import User from "../models/User";

/**
 * Cenário de demonstração para testar o assistente de IA.
 *
 * Cria uma operação inteira de mentirinha — filas, colunas do Kanban, clientes
 * e conversas com clima diferente em cada uma (cliente irritado, cliente
 * fechando negócio, pedido de suporte parado na fila errada...) — para dar à
 * IA material de verdade para ler, sugerir fila, mover no Kanban e resumir.
 *
 * Roda quantas vezes quiser: tudo é procurado pelo nome ou pelo número antes
 * de ser criado, e as conversas do cenário são refeitas do zero a cada vez.
 *
 *   docker exec tekvosoft-backend-1 npx ts-node --transpile-only \
 *     src/scripts/seedDemoScenario.ts [companyId]
 *
 * Os números são inválidos de propósito (DDD 19 sem o 9 do celular): servem
 * para aparecer na tela, mas não existem no WhatsApp, então não há risco de
 * uma mensagem de teste cair no celular de um estranho.
 */
const COMPANY_ID = Number(process.argv[2]) || 1;
const MARK = "[demo]";

type Line = { from: "cliente" | "atendente"; body: string; minutesAgo: number };

const QUEUES = [
  {
    name: "Comercial",
    color: "#5C59E8",
    greetingMessage:
      "Oi! Aqui é o comercial da vuup.me. Me conta o que você procura que eu já te ajudo.",
    about: "Primeiro contato, preços, planos e propostas.",
    instructions:
      "Peça o tamanho da equipe e o que a pessoa usa hoje. Nunca invente preço: ofereça uma conversa rápida."
  },
  {
    name: "Suporte Técnico",
    color: "#039BE5",
    greetingMessage:
      "Oi! Suporte da vuup.me. Me diz o que está acontecendo que eu vejo isso agora.",
    about: "Erros, dúvidas de uso e problemas de conexão de quem já é cliente.",
    instructions:
      "Peça print e horário do erro. Se for queda de conexão do WhatsApp, oriente reconectar e avise o time."
  },
  {
    name: "Financeiro",
    color: "#0B8043",
    greetingMessage:
      "Oi! Financeiro da vuup.me. Posso ajudar com boleto, nota fiscal ou pagamento.",
    about: "Cobrança, boleto, nota fiscal, troca de cartão e renovação.",
    instructions:
      "Confirme o CNPJ antes de falar de valores. Não prometa desconto; encaminhe para o comercial."
  },
  {
    name: "Implantação",
    color: "#8E24AA",
    greetingMessage:
      "Oi! Sou da implantação da vuup.me. Vamos deixar sua conta pronta pra usar?",
    about: "Configuração inicial, conexão do número e treinamento da equipe.",
    instructions:
      "Combine data e hora da reunião. Lembre a pessoa de ter o celular com o WhatsApp em mãos."
  },
  {
    name: "Retenção",
    color: "#F4511E",
    greetingMessage:
      "Oi! Vi que você quer falar sobre o seu plano. Me conta o que aconteceu?",
    about: "Cliente insatisfeito, pedido de cancelamento e reclamação.",
    instructions:
      "Ouça antes de oferecer. Registre o motivo do cancelamento e ofereça uma conversa com o responsável."
  }
];

// as colunas do Kanban, na ordem em que o card anda
const COLUMNS = [
  { name: "Novo contato", color: "#5C59E8" },
  { name: "Em atendimento", color: "#039BE5" },
  { name: "Aguardando cliente", color: "#F4B400" },
  { name: "Proposta enviada", color: "#8E24AA" },
  { name: "Fechado", color: "#0B8043" },
  { name: "Perdido", color: "#D50000" }
];

// etiquetas comuns, que não são coluna do Kanban
const LABELS = [
  { name: "VIP", color: "#B26A00" },
  { name: "Urgente", color: "#C81E36" }
];

type Scenario = {
  contact: { name: string; number: string; email?: string };
  queue: string;
  column?: string;
  labels?: string[];
  status: "open" | "pending" | "closed";
  assign?: boolean;
  note?: string;
  journey?: { kind: string; from?: string; to: string; byAi?: boolean }[];
  lines: Line[];
};

const SCENARIOS: Scenario[] = [
  // 1. cliente bravo: a IA tem que perceber o clima ruim e sugerir Retenção
  {
    contact: {
      name: "Marcela Tavares",
      number: "551900000001",
      email: "marcela@padariaboapraca.com.br"
    },
    queue: "Suporte Técnico",
    column: "Em atendimento",
    labels: ["Urgente"],
    status: "open",
    assign: true,
    journey: [
      { kind: "queue", to: "Comercial" },
      { kind: "queue", from: "Comercial", to: "Suporte Técnico" },
      { kind: "status", from: "pending", to: "open" }
    ],
    lines: [
      {
        from: "cliente",
        body: "bom dia, de novo o whats caiu aqui",
        minutesAgo: 190
      },
      {
        from: "cliente",
        body: "é a terceira vez essa semana",
        minutesAgo: 188
      },
      {
        from: "atendente",
        body: "Bom dia, Marcela! Já estou olhando aqui, me dá um minutinho.",
        minutesAgo: 180
      },
      { from: "cliente", body: "vcs falaram isso ontem tbm", minutesAgo: 120 },
      {
        from: "cliente",
        body: "eu perco pedido toda vez que isso acontece, tô pagando caro pra ficar assim",
        minutesAgo: 60
      },
      { from: "cliente", body: "alguém vai me responder???", minutesAgo: 12 },
      {
        from: "cliente",
        body: "se não resolver hoje eu vou cancelar e procurar outro sistema",
        minutesAgo: 4
      }
    ]
  },
  // 2. cliente animado, negócio quase fechado: clima bom, coluna Proposta
  {
    contact: {
      name: "Rodrigo Lemes",
      number: "551900000002",
      email: "rodrigo@clinicavitta.com.br"
    },
    queue: "Comercial",
    column: "Proposta enviada",
    labels: ["VIP"],
    status: "open",
    assign: true,
    note: "Clínica com 3 unidades. Quer começar pela recepção da unidade centro.",
    journey: [
      { kind: "queue", to: "Comercial" },
      { kind: "status", from: "pending", to: "open" },
      { kind: "tag", to: "Novo contato" },
      { kind: "tag", to: "Proposta enviada", byAi: true }
    ],
    lines: [
      {
        from: "cliente",
        body: "Oi! Vi a demonstração de vocês e gostei bastante",
        minutesAgo: 2880
      },
      {
        from: "cliente",
        body: "Somos uma clínica com 3 unidades, hoje cada recepção tem um celular separado",
        minutesAgo: 2875
      },
      {
        from: "atendente",
        body: "Que ótimo, Rodrigo! Dá pra juntar os três números numa conta só e dividir por fila. Quantas pessoas atendem?",
        minutesAgo: 2860
      },
      { from: "cliente", body: "são 6 meninas no total", minutesAgo: 2840 },
      {
        from: "atendente",
        body: "Perfeito. Te mandei a proposta por e-mail com 6 usuários e os 3 números.",
        minutesAgo: 1500
      },
      { from: "cliente", body: "recebi sim, obrigado!", minutesAgo: 1400 },
      {
        from: "cliente",
        body: "gostei da proposta, só preciso passar pro meu sócio hoje à tarde",
        minutesAgo: 240
      },
      {
        from: "cliente",
        body: "se ele aprovar a gente fecha ainda essa semana 👍",
        minutesAgo: 230
      }
    ]
  },
  // 3. suporte parado na fila errada: a IA tem que sugerir mudar de fila
  {
    contact: {
      name: "Juliana Prado",
      number: "551900000003",
      email: "juliana@escritorioprado.adv.br"
    },
    queue: "Comercial",
    column: "Novo contato",
    status: "pending",
    journey: [{ kind: "queue", to: "Comercial" }],
    lines: [
      {
        from: "cliente",
        body: "boa tarde, a nota fiscal de setembro não chegou no meu e-mail",
        minutesAgo: 95
      },
      {
        from: "cliente",
        body: "meu contador tá pedindo pra fechar o mês",
        minutesAgo: 94
      },
      {
        from: "cliente",
        body: "o CNPJ é 12.345.678/0001-90, consegue reenviar?",
        minutesAgo: 90
      }
    ]
  },
  // 4. implantação em andamento: conversa morna, aguardando cliente
  {
    contact: {
      name: "Carlos Eduardo Mano",
      number: "551900000004",
      email: "cadu@pneusexpress.com"
    },
    queue: "Implantação",
    column: "Aguardando cliente",
    status: "pending",
    assign: true,
    journey: [
      { kind: "queue", to: "Comercial" },
      { kind: "queue", from: "Comercial", to: "Implantação", byAi: true },
      { kind: "tag", to: "Em atendimento" },
      { kind: "tag", from: "Em atendimento", to: "Aguardando cliente" }
    ],
    lines: [
      {
        from: "atendente",
        body: "Oi Carlos! Sou da implantação. Podemos marcar 30 minutos pra conectar seu número?",
        minutesAgo: 1440
      },
      { from: "cliente", body: "pode ser sim", minutesAgo: 1400 },
      { from: "cliente", body: "quinta de manhã eu consigo", minutesAgo: 1398 },
      {
        from: "atendente",
        body: "Fechado, quinta às 9h. Deixa o celular com o WhatsApp aberto que a gente lê o QR code junto.",
        minutesAgo: 1380
      },
      {
        from: "atendente",
        body: "Carlos, confirma pra mim se quinta 9h continua de pé?",
        minutesAgo: 300
      }
    ]
  },
  // 5. cobrança resolvida: serve para o mapa da conversa ter um caso fechado
  {
    contact: {
      name: "Patrícia Nunes",
      number: "551900000005",
      email: "financeiro@mercadinhodobairro.com"
    },
    queue: "Financeiro",
    column: "Fechado",
    status: "closed",
    assign: true,
    note: "Boleto reenviado e pagamento confirmado no mesmo dia.",
    journey: [
      { kind: "queue", to: "Financeiro" },
      { kind: "status", from: "pending", to: "open" },
      { kind: "tag", to: "Em atendimento" },
      { kind: "tag", from: "Em atendimento", to: "Fechado", byAi: true },
      { kind: "status", from: "open", to: "closed" }
    ],
    lines: [
      {
        from: "cliente",
        body: "oi, o boleto desse mês venceu e não achei o e-mail",
        minutesAgo: 5800
      },
      {
        from: "atendente",
        body: "Oi Patrícia! Consigo gerar um novo com vencimento pra hoje, pode ser?",
        minutesAgo: 5790
      },
      { from: "cliente", body: "pode sim, por favor", minutesAgo: 5780 },
      {
        from: "atendente",
        body: "Acabei de enviar no seu e-mail 👍",
        minutesAgo: 5700
      },
      {
        from: "cliente",
        body: "recebi e já paguei, valeu pela rapidez!",
        minutesAgo: 5000
      },
      {
        from: "atendente",
        body: "Pagamento confirmado por aqui. Qualquer coisa é só chamar!",
        minutesAgo: 4990
      }
    ]
  },
  // 6. pedido de cancelamento: clima ruim, mas educado
  {
    contact: {
      name: "Fernanda Klein",
      number: "551900000006",
      email: "fernanda@studiokleinarq.com"
    },
    queue: "Retenção",
    column: "Em atendimento",
    status: "pending",
    journey: [
      { kind: "queue", to: "Suporte Técnico" },
      { kind: "queue", from: "Suporte Técnico", to: "Retenção", byAi: true }
    ],
    lines: [
      {
        from: "cliente",
        body: "Boa tarde. Eu gostaria de cancelar meu plano no fim do mês.",
        minutesAgo: 420
      },
      {
        from: "atendente",
        body: "Oi Fernanda, tudo bem? Posso saber o motivo? Talvez eu consiga ajudar.",
        minutesAgo: 400
      },
      {
        from: "cliente",
        body: "O sistema é bom, mas eu trabalho sozinha e acabo não usando quase nada",
        minutesAgo: 380
      },
      {
        from: "cliente",
        body: "pro meu tamanho tá caro, sinceramente",
        minutesAgo: 378
      }
    ]
  },
  // 7. primeiro contato cru: pouca coisa escrita, bom pra ver a IA se virar
  {
    contact: { name: "Diego Alencar", number: "551900000007" },
    queue: "Comercial",
    column: "Novo contato",
    status: "pending",
    lines: [
      { from: "cliente", body: "oi", minutesAgo: 25 },
      { from: "cliente", body: "quanto custa?", minutesAgo: 24 }
    ]
  },
  // 8. treinamento pedido por quem já é cliente: clima bom
  {
    contact: {
      name: "Luana Ferraz",
      number: "551900000008",
      email: "luana@grupoferrazimoveis.com.br"
    },
    queue: "Implantação",
    column: "Em atendimento",
    labels: ["VIP"],
    status: "open",
    assign: true,
    lines: [
      {
        from: "cliente",
        body: "Bom dia! Entraram duas corretoras novas no time",
        minutesAgo: 150
      },
      {
        from: "cliente",
        body: "dá pra fazer um treinamento rápido com elas?",
        minutesAgo: 149
      },
      {
        from: "atendente",
        body: "Bom dia, Luana! Dá sim, são 40 minutos por chamada. Terça às 14h serve?",
        minutesAgo: 140
      },
      { from: "cliente", body: "serve! pode marcar", minutesAgo: 100 },
      {
        from: "cliente",
        body: "vocês são muito atenciosos, viu? obrigada 😊",
        minutesAgo: 98
      }
    ]
  }
];

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000);

const run = async () => {
  const company = await Company.findByPk(COMPANY_ID);
  if (!company) throw new Error(`Empresa ${COMPANY_ID} não existe`);

  const whatsapp = await Whatsapp.findOne({
    where: { companyId: COMPANY_ID },
    order: [["id", "ASC"]]
  });
  if (!whatsapp) throw new Error("Nenhuma conexão cadastrada nesta empresa");

  const user = await User.findOne({
    where: { companyId: COMPANY_ID },
    order: [["id", "ASC"]]
  });

  // ── filas ──
  const queues: Record<string, Queue> = {};
  await Promise.all(
    QUEUES.map(async item => {
      const [queue] = await Queue.findOrCreate({
        where: { name: item.name, companyId: COMPANY_ID },
        defaults: {
          name: item.name,
          color: item.color,
          companyId: COMPANY_ID,
          greetingMessage: item.greetingMessage,
          // sem expediente: a fila atende a qualquer hora
          schedules: [],
          aiEnabled: false,
          aiConfig: JSON.stringify({
            about: item.about,
            instructions: item.instructions,
            tone: "friendly"
          })
        } as never
      });
      queues[item.name] = queue;
    })
  );

  // ── colunas do Kanban e etiquetas ──
  const tags: Record<string, Tag> = {};
  await Promise.all(
    [
      ...COLUMNS.map(column => ({ ...column, kanban: 1 })),
      ...LABELS.map(label => ({ ...label, kanban: 0 }))
    ].map(async item => {
      const [tag] = await Tag.findOrCreate({
        where: { name: item.name, companyId: COMPANY_ID },
        defaults: {
          name: item.name,
          color: item.color,
          kanban: item.kanban,
          companyId: COMPANY_ID
        } as never
      });
      if (tag.kanban !== item.kanban) await tag.update({ kanban: item.kanban });
      tags[item.name] = tag;
    })
  );

  // ── contatos, conversas e mensagens ──
  let tickets = 0;
  let messages = 0;

  // Promise.all daria corrida na criação dos contatos; aqui a ordem importa
  // pouco e o volume é pequeno, então vai um de cada vez mesmo
  await SCENARIOS.reduce(async (previous, scenario) => {
    await previous;

    const [contact] = await Contact.findOrCreate({
      where: { number: scenario.contact.number, companyId: COMPANY_ID },
      defaults: {
        name: scenario.contact.name,
        number: scenario.contact.number,
        email: scenario.contact.email || "",
        companyId: COMPANY_ID
      } as never
    });

    // refaz a conversa do zero para o cenário ficar sempre igual ao descrito
    const old = await Ticket.findAll({
      where: { contactId: contact.id, companyId: COMPANY_ID },
      attributes: ["id"]
    });
    const oldIds = old.map(ticket => ticket.id);
    if (oldIds.length) {
      await Message.destroy({ where: { ticketId: oldIds } });
      await TicketTag.destroy({ where: { ticketId: oldIds } });
      await TicketNote.destroy({ where: { ticketId: oldIds } });
      await TicketJourney.destroy({ where: { ticketId: oldIds } });
      await Ticket.destroy({ where: { id: oldIds } });
    }

    const first = scenario.lines[0];
    const last = scenario.lines[scenario.lines.length - 1];
    const queue = queues[scenario.queue];

    const ticket = await Ticket.create({
      status: scenario.status,
      lastMessage: last.body,
      contactId: contact.id,
      companyId: COMPANY_ID,
      whatsappId: whatsapp.id,
      queueId: queue?.id,
      userId: scenario.assign ? user?.id : null,
      unreadMessages: scenario.lines.filter(line => line.from === "cliente")
        .length,
      isGroup: false,
      createdAt: minutesAgo(first.minutesAgo),
      updatedAt: minutesAgo(last.minutesAgo)
    } as never);
    tickets += 1;

    await Promise.all(
      scenario.lines.map((line, index) =>
        Message.create({
          id: `${MARK}-${ticket.id}-${index}`,
          body: line.body,
          fromMe: line.from === "atendente",
          read: line.from === "atendente",
          ack: line.from === "atendente" ? 3 : 1,
          mediaType: "chat",
          ticketId: ticket.id,
          contactId: contact.id,
          companyId: COMPANY_ID,
          queueId: queue?.id,
          createdAt: minutesAgo(line.minutesAgo),
          updatedAt: minutesAgo(line.minutesAgo)
        } as never)
      )
    );
    messages += scenario.lines.length;

    const marks = [
      ...(scenario.column ? [scenario.column] : []),
      ...(scenario.labels || [])
    ];
    await Promise.all(
      marks
        .filter(name => tags[name])
        .map(name =>
          TicketTag.create({ ticketId: ticket.id, tagId: tags[name].id })
        )
    );

    if (scenario.note && user) {
      await TicketNote.create({
        note: scenario.note,
        userId: user.id,
        contactId: contact.id,
        ticketId: ticket.id
      } as never);
    }

    // passos do mapa da conversa, espalhados entre a primeira e a última fala
    const steps = scenario.journey || [];
    await Promise.all(
      steps.map((step, index) => {
        const span = first.minutesAgo - last.minutesAgo;
        const when =
          first.minutesAgo - (span * (index + 1)) / (steps.length + 1);
        return TicketJourney.create({
          ticketId: ticket.id,
          companyId: COMPANY_ID,
          userId: step.byAi ? null : user?.id,
          kind: step.kind,
          fromValue: step.from || null,
          toValue: step.to,
          byAi: !!step.byAi,
          createdAt: minutesAgo(when)
        } as never);
      })
    );
  }, Promise.resolve());

  console.log(
    [
      `empresa ${COMPANY_ID} (${company.name})`,
      `filas: ${Object.keys(queues).length}`,
      `colunas do kanban: ${COLUMNS.length}`,
      `etiquetas: ${LABELS.length}`,
      `conversas: ${tickets}`,
      `mensagens: ${messages}`
    ].join("\n")
  );
};

run()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async error => {
    console.error("falhou:", error.message);
    await sequelize.close();
    process.exit(1);
  });
