/**
 * Skills que já vêm com o sistema (source "seed"). Entram uma vez, pelo
 * slug, e depois são do super: editar ou arquivar aqui não sobrescreve o
 * que ele mudou. Curtas de propósito: cada uma vai inteira para o agente
 * quando a tarefa pede, e texto grande é token gasto em toda tarefa.
 */
export interface SkillSeed {
  slug: string;
  name: string;
  description: string;
  content: string;
}

export const DEFAULT_SKILLS: SkillSeed[] = [
  {
    slug: "design-ui",
    name: "Design e interface",
    description:
      "Qualquer mudança em tela: layout, cores, componentes, responsividade, celular, tema escuro.",
    content: `- Material-UI v4 com makeStyles. Cor, borda e raio só pelos tokens de theme.palette.tkv: surface, surfaceSunken, surfaceHover, border, brand.main/text/textSoft/textBorder/contrastText/hover, semantic.success|warning|danger|info (+ *Soft), radius.xs|sm|md|lg|xl|pill, accents (cores de gráfico). Nunca cor fixa em hex: o tema escuro e as cores da empresa vêm dos tokens.
- Celular = theme.breakpoints.down("xs") (useMediaQuery). Diálogo vira tela cheia (fullScreen={phone}); menu e opções viram components/ui/BottomSheet; painel lateral sobe de baixo; listas largas rolam na horizontal com scroll-snap; alvo de toque com 40px ou mais; nada que só funcione com hover.
- Botão: borderRadius pill, textTransform "none", fontWeight 700, sem sombra. Ação principal contained color="primary"; secundária outlined ou texto.
- Texto: rem (0.75 a 1.375), título 700/800, apoio em theme.palette.text.secondary.
- Toda tela ou lista tem carregando (components/ui/BoxLoader ou PageLoader), vazio (components/ui/EmptyState) e erro (toastError).
- Acessibilidade: aria-label em IconButton, aria-pressed/aria-current/aria-selected, role="tab" nas abas.
- Imite a tela vizinha mais parecida (pages/Helps, pages/DevPipeline, components/Settings/Options) em espaçamento e hierarquia.
- No plan, descreva como fica no computador e no celular.`
  },
  {
    slug: "i18n",
    name: "Textos e traduções",
    description:
      "Qualquer texto novo ou alterado na tela, mensagem de erro ou mensagem enviada ao cliente.",
    content: `- Frontend: dicionários em frontend/src/translate/languages/{pt,pt_PT,en,es}.js, todos completos (de/fr/it/id caem no inglês). Use i18n.t("area.chave") de ../translate/i18n. Chave nova vai nos 4 idiomas, no mesmo lugar da árvore.
- pt_PT não é pt-BR: ficheiro, ecrã, guardar, eliminar, equipa, "a fazer" em vez de gerúndio.
- {{variavel}} no texto exige passar o valor: i18n.t("x", { nome }). Sem valor, o i18next troca por vazio.
- Erro da API é código (AppError("ERR_ALGO", 400)); o frontend traduz em backendErrors.ERR_ALGO. Nunca mande texto pronto do backend para a tela.
- Mensagem que vai para o WhatsApp do cliente é traduzida no backend com _t(chave, ticket|contact|whatsapp|company).
- Arquivos de tradução são enormes: peça só o trecho da área que vai mexer (busque a chave vizinha).`
  },
  {
    slug: "backend-api",
    name: "Rotas, controllers e permissões",
    description:
      "Endpoint novo ou alterado, regra de acesso, validação de entrada, serviço do backend.",
    content: `- Rota em backend/src/routes/<area>Routes.ts, registrada em routes/index.ts. Middlewares: isAuth (logado), isAdmin (profile admin), isSuper (dono da instalação). Copie as checagens das rotas vizinhas.
- Controller (controllers/<Area>Controller.ts) valida e corta a entrada (String(...).trim().slice(0, N)) e chama um serviço em services/<Area>Services/.
- Toda consulta filtra por req.user.companyId: um cliente nunca vê dado de outra empresa. Registro de outra empresa responde 404 (não revela que existe).
- Erro: throw new AppError("ERR_CODIGO", status). 400 entrada inválida, 403 sem permissão, 404 não achou, 409 estado não permite.
- Acesso a ticket: helpers/CheckTicketAccess.ts. Configuração da empresa: GetCompanySetting(companyId, chave, padrão).
- TypeScript estrito o bastante para o tsc passar; imports relativos como os vizinhos; comentários em português explicando o porquê.`
  },
  {
    slug: "banco-migrations",
    name: "Banco de dados e migrations",
    description:
      "Tabela ou coluna nova, mudança de modelo Sequelize, índice, dado que precisa ser gravado.",
    content: `- Migration nova em backend/src/database/migrations/AAAAMMDDHHMMSS-descricao.ts (use data/hora posterior à última do mapa), com module.exports = { up, down } e QueryInterface/DataTypes. Nunca edite migration existente.
- SQL cru que fica no banco (função, índice com expressão) qualifica o schema: public.funcao(...). O pg_dump restaura com search_path vazio.
- Model em backend/src/models/<Nome>.ts com sequelize-typescript (@Table, @Column, @Default, @ForeignKey, @BelongsTo) e registrado na lista de backend/src/database/index.ts.
- JSONB com defaultValue [] ou {}; índice com nome explícito; FK com onDelete coerente (CASCADE para filho, SET NULL para referência opcional).
- No backend, atualize só os campos que mudaram: instance.update({ campo }) em vez de mexer no objeto e salvar tudo.`
  },
  {
    slug: "tempo-real",
    name: "Tempo real (socket)",
    description:
      "Tela que precisa atualizar sozinha quando algo muda no servidor.",
    content: `- Backend: getIO() de libs/socket; emita para a sala certa: company-<id>-mainchannel (toda a empresa), company-<id>-admin, user-<id>, super (dono da instalação). Payload pequeno (ação + id); a tela recarrega o que precisa.
- Frontend: const socketManager = useContext(SocketContext); const socket = socketManager.GetSocket(companyId); socket.on("evento", handler) dentro de useEffect, e no retorno socket.off("evento", handler) + socket.disconnect().
- Rajada de eventos: junte em um debounce curto (300 a 400 ms) antes de recarregar.`
  },
  {
    slug: "configuracoes",
    name: "Opções em Configurações",
    description:
      "Nova opção ou ajuste em Configurações > Opções (liga/desliga, escolha, texto, número).",
    content: `- Tela: frontend/src/components/Settings/Options/index.js (DEFAULTS, SECTIONS e o case de cada seção) e controls.js (SwitchRow, SelectRow, TextRow, NumberRow, MessageRow, Group).
- Título, explicação e opções vêm de settings.options.fields.<chave>.{title,description,options.<valor>} nos 4 idiomas; grupo em settings.options.groups.
- Liga/desliga grava "enabled"/"disabled". Backend lê com GetCompanySetting(companyId, "<chave>", "<padrão>").
- Chave que começa com "_" é do super (fica na empresa 1, admin comum não lê). Segredo nunca vai para o config.json público.
- Opção que atendentes (não admin) precisam ler entra em safeSettingsKeys (GetSettingService).`
  },
  {
    slug: "conversas",
    name: "Conversas, tickets e mensagens",
    description:
      "Lista de conversas, tela de chat, envio de mensagem, filas, status do atendimento.",
    content: `- Lista: frontend/src/components/TicketsListCustom (+ TicketListItemCustom, menu de contexto em TicketContextMenu, filtros em TicketsManagerTabs). Backend: services/TicketServices/ListTicketsService.ts.
- Chat: components/MessagesList (mensagens) e components/MessageInputCustom/index.js (barra de envio, desktop e celular no mesmo arquivo; é enorme: peça trechos).
- Ticket tem status open (em atendimento), pending (aguardando) e closed; pertence a fila (queueId), atendente (userId) e conexão (whatsappId).
- Mudança de ticket emite socket para a empresa; a lista se atualiza por evento, não por recarga completa.
- Nunca dispare mensagem real de WhatsApp em teste; toda mensagem ao cliente passa por _t().`
  }
];
