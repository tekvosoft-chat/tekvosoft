---
name: vuup-dev
description: Atalho para trabalhar no vuup.me (este repositório) sem redescobrir o ambiente. Use ao implementar, corrigir ou verificar qualquer coisa no backend ou no frontend — subir o ambiente local, testar na tela real com navegador headless, validar TypeScript/ESLint, aplicar migrations, mexer em traduções e escolher dados de teste que não disparam nada no WhatsApp de verdade.
---

# vuup.me — como trabalhar rápido aqui

Leia o `AGENTS.md` da raiz para as regras do projeto. Aqui fica só o
"como fazer" que já foi validado na prática.

## Ambiente local

- Subir/recriar: `./tekvosoft dev` (gera `.env` e `frontend/public/config.json`,
  troca portas ocupadas sozinho). Portas atuais ficam no `.env`
  (`PORT`, `API_PORT`) — nesta máquina: frontend **3001**, API **8081**.
- Login semeado: `admin@tekvosoft.local` / `123456` (empresa 1, super).
- Containers: `tekvosoft-frontend-1`, `tekvosoft-backend-1`, `tekvosoft-postgres-1`, `tekvosoft-redis-1`.
- O `node_modules` de cada pacote vive num volume do container: rode
  ferramentas com `docker exec tekvosoft-<frontend|backend>-1 npx ...`.
  Os erros de tipo que o editor mostra no backend (`findByPk does not exist`)
  são falta desses tipos no host, não erro de verdade.
- Banco: `docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -F " | "' < arquivo.sql`
  (SQL com aspas: escreva num arquivo no scratchpad e mande pelo `<`).


## Verificar

Backend (roda em ~10 s):
```bash
docker exec tekvosoft-backend-1 sh -c 'npx tsc --noEmit -p .; echo tsc=$?; npx eslint --fix <arquivos>; npx jest'
```
Migration nova: `docker compose -f docker-compose.yml -f docker-compose.dev.yml restart backend`
(o entrypoint compila e migra). Confira no log `== <arquivo>: migrated`.

Frontend:
```bash
docker exec tekvosoft-frontend-1 npx prettier --write <arquivos>
docker exec tekvosoft-frontend-1 npx eslint <arquivos>
docker logs --since 60s tekvosoft-frontend-1 | grep -E "compiled|Failed"
```

Tela real (headless): no scratchpad, `npm i playwright-core` uma vez e use
`chromium.launch({ executablePath: "/usr/bin/google-chrome" })`. Login pelo
formulário (`input[name=email]`, `input[name=password]`, `button[type=submit]`).
Dicas de seletor:
- itens da lista de conversas: `div[role="button"]` com `hasText`;
- `Popper` do MUI v4 não tem classe: use `[role="tooltip"]`;
- celular: `newContext({ viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true })`;
  "segurar o dedo" = `dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", ... }))`, espera 650 ms, `pointerup`;
- o console tem ruído antigo (Badge `overlap`, `key` no `LoggedInLayout`,
  `navigator.vibrate`): filtre antes de acusar erro.
- Tire print e olhe (Read no PNG) antes de dizer que ficou bom.

## Traduções

`frontend/src/translate/languages/*.js`: pt, pt_PT, en e es são completos;
de/fr/it/id caem no inglês (`fallbackLng: "en"`). Para inserir blocos em
vários idiomas de uma vez, um script Node que acha a linha âncora
(`^      settings: {`, `^      messagesInput: {`, `^        ERR_FORBIDDEN:`)
e insere o texto, seguido de `prettier --write`, é mais seguro que editar
arquivo por arquivo. Valide importando cada arquivo como `.mjs`.
Erros da API viram texto por `backendErrors.<CÓDIGO>`.
Nunca ponha `{{variavel}}` literal num texto de tradução sem passar o valor:
o i18next (v19) troca por vazio.

## Onde ficam as coisas

- Lista de conversas: `components/TicketsListCustom` + `TicketListItemCustom`;
  menu de contexto em `components/TicketContextMenu`.
- Barra de envio: `components/MessageInputCustom/index.js` (desktop e celular
  no mesmo arquivo; painel do raio = `aiMenu`, sugestão roxa = `aiSuggestionBox`).
- IA: `backend/src/services/AiServices/TicketCopilot.ts` (`clientOf`, `ask`,
  `transcript`, `composeWithAi`); chave em Configurações > Opções > IA.
- Configurações > Opções: `components/Settings/Options/` (`controls.js` + seções em `index.js`).
- Regra de acesso a ticket: `backend/src/helpers/CheckTicketAccess.ts`.
- Estilo: MUI v4 + `makeStyles`, tokens em `theme.palette.tkv.*`
  (`surface`, `border`, `brand.text`, `brand.textSoft`, `semantic.*`).
  Comentários em português explicando o porquê.
