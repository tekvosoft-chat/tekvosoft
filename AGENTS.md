# AGENTS.md — vuup.me

Guia compacto para agentes trabalhando neste repositório.

## Estrutura

Repositório único, dois pacotes independentes, **sem `package.json` na raiz**.

- `backend/` — Node 24 / Express / TypeScript, Sequelize (Postgres), Redis + Bull, Baileys, Socket.IO
- `frontend/` — React 17 (JavaScript, **não TypeScript**), Material-UI v4, Create React App 5
- `tekvosoft` — CLI único. **Sempre prefira ele a chamar `docker compose` na mão.**
- `docker-compose.yml` + `.dev.yml` / `.prod.yml` — base e overrides
- `scripts/backup.sh` — backup/restauração, roda dentro do container `tools`

## Comandos

```bash
./tekvosoft dev      # sobe tudo local com hot reload
./tekvosoft logs     # logs ao vivo
./tekvosoft shell backend
./tekvosoft psql
./tekvosoft reset    # zera o banco de desenvolvimento
```

Portas em dev: frontend `3000`, backend `8080`, postgres `5432`, redis `6379`,
debugger `9229`. Todas configuráveis no `.env` se já estiverem ocupadas.

## Backend

- Entrada: `src/server.ts` → compilado em `dist/server.js`
- `npm run build` (produção) / `npm run devbuild` (com sourcemaps) / `npm run dev:server` (ts-node-dev)
- `npm run generate:i18nkeys` — codegen para `src/generated/translationKeys.ts`; **precisa rodar antes do build**
- `.sequelizerc` aponta para `dist/`, então **compile antes** de usar o CLI do Sequelize
- `scripts/entrypoint.sh` cuida de esperar o banco, compilar (só em dev), migrar e semear
- Testes: `npm test` (Jest + ts-jest). Arquivos em `**/__tests__/**/*.spec.ts`
- Após editar: `npx eslint --fix src/**/*.ts`

### i18n do backend
Traduções ficam na tabela `Translation` do Postgres. Use `_t(key, origem)` para
resolver o idioma a partir de um `Ticket`, `Contact`, `Whatsapp` ou `Company`.
`i18nReady` bloqueia a subida do servidor — não emita texto traduzido antes dele.

## Frontend

- `npm start` (dev) / `npm run build` (produção)
- Após editar: `npx prettier --write src/`
- i18n com dicionários estáticos em `src/translate/languages/*.js`; use `i18n.t("chave")`
- O toolchain exige `NODE_OPTIONS=--openssl-legacy-provider` no Node 20+

### `config.json` é público
`frontend/docker-entrypoint.sh` gera `/config.json`, servido a qualquer
visitante. Ele usa uma **lista explícita** de variáveis. Nunca acrescente
segredo ali, e nunca troque a lista por um despejo do ambiente.

## E-mails automáticos (n8n)

O backend não envia e-mail: `notifyAutomation()` (`src/libs/automation.ts`)
avisa o fluxo "vuup.me · E-mails automáticos" no n8n, que monta o HTML e
envia pelo Gmail. Configure `N8N_WEBHOOK_URL` e `N8N_WEBHOOK_SECRET` no `.env`.
Sem a URL nada é enviado e o código de navegador novo fica desligado. Os GIFs
ficam em `frontend/public/email/`.

## Convenções entre as pontas

- Mensagens enviadas ao WhatsApp são traduzidas **no backend** com `_t()`. Nunca
  mande chave de tradução crua para o usuário final.
- Códigos de erro da API permanecem como códigos; quem traduz é o frontend.

## Marca

O produto se chama **vuup.me** (antes Tekvosoft). Textos, logos (`frontend/public/vector/`,
favicons, `brand/`) e e-mails usam vuup.me. `tekvosoft` continua de propósito nos
identificadores técnicos: imagens `ghcr.io/.../tekvosoft-*`, CLI `./tekvosoft`, banco e
usuário do Postgres, serviços do compose, chaves do localStorage (`tekvosoft*`, `tkv:*`),
preset de tema `tekvosoft`, cabeçalho `x-tekvosoft-secret` e o caminho do webhook do n8n.

## Nomes que NÃO devem ser renomeados

O projeto foi renomeado de `ticketz` para `tekvosoft`, mas estes identificadores
ficaram para trás **de propósito** — são formato de dados ou integração externa:

| Identificador | Por que fica |
|---|---|
| `ticketzvCard` | Chave JSON dentro do corpo de mensagens já gravadas no banco |
| `TICKETZ_JWT_SECRET` | Chave no Redis; renomear invalida todas as sessões ativas |
| `/subscription/ticketz/webhook` | URL já registrada na operadora de pagamento |
| `pixTicketz` | Identificador de gateway gravado nas configurações |
| `ticketz_safe_jsonb_*` | Função criada por migration já aplicada — histórico é imutável |
| cupom `TICKETZ` (Wavoip) | Código de desconto real de um parceiro |

## Migrations

Migrations já aplicadas são **imutáveis**. Para corrigir algo, crie uma nova.
Ao escrever SQL que será restaurado por `pg_dump`, **qualifique o schema**
(`public.funcao(...)`) — o pg_dump restaura com `search_path` vazio, e chamadas
sem qualificar quebram a recriação de índices na restauração de backup.

## CI

`.github/workflows/build.yml` compila as duas imagens (amd64 + arm64) e publica
em `ghcr.io/${{ github.repository_owner }}/tekvosoft-{backend,frontend}`.
Use `github.repository_owner`, nunca um nome de organização fixo.

## Licença

AGPL. Se distribuir o sistema, o link para o código-fonte precisa continuar
acessível a qualquer usuário (hoje fica na tela "Sobre").

## Versionamento

Versões saem de tags git `vMAIOR.MENOR.CORREÇÃO`.

A **correção** é automática: o job `versao` em `build.yml` calcula e cria a tag
a cada push na `main` que altere as imagens. A tag nasce dentro da própria
execução, e não num passo que dispararia outro workflow, porque o GitHub não
dispara workflow para evento criado com `GITHUB_TOKEN` — uma tag criada assim
nunca iniciaria a compilação. Para pular, use `[sem versao]` no commit.

**Menor e maior** continuam manuais: `./tekvosoft release <minor|major>`, que
escreve o `CHANGELOG.md` e valida o estado do repositório. Quando esse comando
envia `main` e tag no mesmo push, o GitHub dispara duas execuções; a que vem
pela branch se cala ao ver que o commit já tem tag, senão sairiam duas versões
para o mesmo commit.

Tags das imagens: `1.2.3` (imutável), `1.2`, `1`, `latest` (última release) e
`main` (último build da branch). **`latest` sai de tag, nunca da main** — é o
que impede um commit qualquer de chegar a produção no próximo update.
