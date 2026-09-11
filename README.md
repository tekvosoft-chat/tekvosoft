# Tekvosoft

Atendimento via WhatsApp com CRM e helpdesk. Múltiplas empresas, múltiplos
atendentes, filas, chatbot, campanhas e agendamentos — tudo em um sistema só.

---

## Um comando para cada coisa

### Instalar em produção

#### O que você precisa antes

**1. Um servidor.** Qualquer VPS serve, desde que tenha:

| | |
|---|---|
| Sistema | Ubuntu 20 ou mais novo (ou Debian equivalente) |
| Memória | 2 GB no mínimo — 4 GB se tiver muitos atendentes |
| Disco | 20 GB (as mídias do WhatsApp vão se acumulando) |
| Processador | Intel/AMD (`x86_64`) **ou** ARM (`arm64`) — os dois funcionam |
| Portas | 80 e 443 abertas no firewall |

**2. Um domínio apontando para esse servidor.** No painel onde você comprou o
domínio, crie um registro:

| Campo | Valor |
|---|---|
| Tipo | `A` |
| Nome | `chat` *(ou o subdomínio que preferir)* |
| Valor | o IP do seu servidor |

Isso dá `chat.suaempresa.com.br`. A propagação leva de minutos a algumas horas
— **sem ela o certificado HTTPS não é emitido.** O instalador confere isso e
avisa, mostrando o IP certo para você preencher.

**3. Um e-mail que você acessa.** Ele vira o seu **login de administrador** e é
usado para registrar o certificado de segurança.

#### O comando

Entre no servidor por SSH e rode, trocando pelos seus dados:

```bash
curl -sSL https://raw.githubusercontent.com/tekvosoft-chat/tekvosoft/main/install.sh \
  | sudo bash -s chat.suaempresa.com.br voce@suaempresa.com.br
```

> O domínio vai **sem** `https://` e **sem** barra no final.
> Certo: `chat.suaempresa.com.br` — Errado: `https://chat.suaempresa.com.br/`

Não precisa criar nem editar arquivo nenhum: o instalador escreve a
configuração, **gera a senha do banco sozinho**, instala o Docker se faltar e
sobe tudo em `/opt/tekvosoft`. Leva de 3 a 10 minutos.

#### Depois que terminar

Acesse `https://seu-dominio`, entre com o e-mail que você passou e a senha
`123456` — e **troque a senha na hora**.

Se o navegador reclamar que "a conexão não é particular", espere 1 ou 2
minutos e recarregue: o certificado está sendo emitido.

Pode rodar o instalador de novo quando quiser — ele preserva a configuração,
a senha do banco e os dados.

#### Se precisar mudar algo depois

Tudo mora em **`/opt/tekvosoft/.env`**:

```bash
sudo nano /opt/tekvosoft/.env
sudo tekvosoft deploy          # aplica a mudança
```

As variáveis estão descritas na seção [Configuração](#configuração).

### Atualizar a produção

```bash
curl -sSL https://raw.githubusercontent.com/tekvosoft-chat/tekvosoft/main/update.sh | sudo bash
```

Faz backup antes de mexer, traz o código e as imagens novas e reinicia.
Encontra a instalação sozinho. Se algo quebrar, `sudo tekvosoft rollback v1.2.3`
volta para a versão anterior.

### Preparar a máquina de desenvolvimento

```bash
curl -sSL https://raw.githubusercontent.com/tekvosoft-chat/tekvosoft/main/dev.sh | bash
```

Sem `sudo` — o código precisa ser seu. Clona o projeto na pasta atual e sobe
tudo com hot reload. Precisa só de Docker e Git: nem Node, nem Postgres, nem
Redis instalados na máquina.

Se alguma porta já estiver ocupada, ele detecta e usa a próxima livre.

| | |
|---|---|
| Sistema | <http://localhost:3000> |
| API | <http://localhost:8080> |
| Login | `admin@tekvosoft.local` / `123456` |

Edite `backend/` ou `frontend/` e recarrega sozinho. O debugger do Node fica
em `9229` — dá para dar attach pelo VSCode (`F5` → *Anexar ao backend*).

---

## O CLI

Depois de instalado, tudo passa pelo mesmo comando. Em produção ele fica
disponível como `sudo tekvosoft` de qualquer pasta; em desenvolvimento, como
`./tekvosoft` dentro do projeto.

```bash
./tekvosoft dev       # desenvolver, com hot reload
./tekvosoft deploy    # subir em produção
./tekvosoft update    # atualizar
./tekvosoft help      # ver tudo
```

Os scripts de instalação acima são só um atalho: eles preparam a máquina e
chamam este mesmo CLI. Nada é duplicado.

---

## Como funciona

```
                         ┌──────────────────────────────┐
   Internet  ──── 443 ───│  proxy + certs               │  HTTPS automático
                         │  nginx-proxy + acme          │  (Let's Encrypt)
                         └──────────────┬───────────────┘
                                        │
                         ┌──────────────▼───────────────┐
                         │  frontend                    │  React + nginx
                         │  serve a interface e faz     │
                         │  proxy de /backend           │
                         └──────────────┬───────────────┘
                                        │  rede interna
                         ┌──────────────▼───────────────┐
                         │  backend                     │  Node + Express
                         │  API, WhatsApp, WebSocket    │
                         └───────┬──────────────┬───────┘
                                 │              │
                      ┌──────────▼───┐   ┌──────▼───────┐
                      │  postgres    │   │  redis       │
                      │  dados       │   │  filas/cache │
                      └──────────────┘   └──────────────┘
```

Só o proxy fica exposto. Backend, banco e Redis vivem numa rede interna e não
são acessíveis de fora.

### Onde fica cada coisa

| Pasta / arquivo | O que é |
|---|---|
| `backend/` | API em Node 24 + TypeScript. Express, Sequelize, Bull, Baileys (WhatsApp), Socket.IO |
| `frontend/` | Interface em React 17 + Material-UI. Servida por nginx em produção |
| `tekvosoft` | O CLI. É o único ponto de entrada — não chame `docker compose` na mão |
| `.env` | **A única configuração que você edita.** Todo o resto é derivado |
| `install.sh` | Instalador de produção (`curl \| sudo bash`) |
| `update.sh` | Atualizador de produção (`curl \| sudo bash`) |
| `dev.sh` | Preparador da máquina de desenvolvimento (`curl \| bash`, sem sudo) |
| `docker-compose.yml` | Serviços comuns aos dois ambientes |
| `docker-compose.dev.yml` | O que muda em desenvolvimento (build local, hot reload, portas) |
| `docker-compose.prod.yml` | O que muda em produção (imagens prontas, proxy, TLS) |
| `scripts/backup.sh` | Backup e restauração, roda dentro de um container |
| `confs/` | Configuração extra do nginx do proxy |

---

## Configuração

Um arquivo só: `.env`. Se você usou os instaladores acima, ele já foi criado
e preenchido — não precisa mexer em nada.

**Onde fica:** `/opt/tekvosoft/.env` em produção, ou na raiz do projeto em
desenvolvimento. Depois de editar, rode `sudo tekvosoft deploy` para aplicar.

**O essencial** — preenchido pelo instalador:

| Variável | Para que serve |
|---|---|
| `DOMAIN` | Domínio do sistema. `localhost` em desenvolvimento |
| `ADMIN_EMAIL` | Login do primeiro acesso e e-mail do certificado |
| `DB_PASS` | Senha do banco. **Não mude depois de instalado** — a senha fica gravada no banco na criação, e trocá-la aqui deixa o sistema sem acesso aos dados |
| `TAG` | Versão a rodar. `latest` acompanha a última release |

**Opcionais** — só se você for usar:

| Variável | Para que serve |
|---|---|
| `TZ` | Fuso horário. Padrão `America/Sao_Paulo` |
| `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` | Protege o cadastro de empresas contra robôs. Vazio = desligado |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Atendimento por Facebook e Instagram. Vazio = só WhatsApp |
| `VERIFY_TOKEN` | Token que a Meta usa para validar os webhooks |
| `USER_LIMIT` / `CONNECTIONS_LIMIT` | Tetos de atendentes e de conexões da instância |

O resto (`BACKEND_URL`, `FRONTEND_URL`, string de conexão, portas internas) é
montado automaticamente nos compose a partir dessas. Você não repete nada.

> **Sobre segredos:** o container do frontend publica um `/config.json` que
> qualquer visitante consegue ler. Por isso ele recebe uma lista explícita de
> variáveis, definida em `frontend/docker-entrypoint.sh`. Nunca coloque senha
> ou chave secreta ali.

---

## Operação

```bash
./tekvosoft logs              # acompanhar tudo ao vivo
./tekvosoft logs backend      # só um serviço
./tekvosoft ps                # o que está rodando
./tekvosoft stop              # parar (os dados continuam salvos)

./tekvosoft backup            # gravar backup em ./backups
./tekvosoft restore           # restaurar o mais recente
./tekvosoft rollback v1.2.3   # voltar para uma versão anterior

./tekvosoft shell backend     # terminal dentro do container
./tekvosoft psql              # console do banco
./tekvosoft reset             # zerar o banco de desenvolvimento
```

Um backup é um único `.tar.gz` com o dump do Postgres e os arquivos enviados.
Ficam guardados os 10 mais recentes; os antigos são descartados sozinhos.

### Mudar de servidor

O backup é um arquivo só, então migrar é copiar e reinstalar:

```bash
# no servidor antigo
sudo tekvosoft backup
scp /opt/tekvosoft/backups/tekvosoft-*.tar.gz voce@servidor-novo:~/

# no servidor novo — o instalador acha o backup e restaura sozinho
curl -sSL https://raw.githubusercontent.com/tekvosoft-chat/tekvosoft/main/install.sh \
  | sudo bash -s chat.exemplo.com.br voce@exemplo.com.br
```

O `install.sh` procura um `tekvosoft-*.tar.gz` na pasta onde você rodou o
comando e, se encontrar numa instalação nova, restaura automaticamente. Os
logins e senhas continuam sendo os do servidor de origem.

---

## Versões

As versões seguem `MAIOR.MENOR.CORREÇÃO`:

| Parte | Quando muda | Exemplo |
|---|---|---|
| **correção** | conserto de bug | `1.2.3` → `1.2.4` |
| **menor** | recurso novo, compatível | `1.2.3` → `1.3.0` |
| **maior** | mudança que exige atenção ao atualizar | `1.2.3` → `2.0.0` |

### Publicar uma versão

```bash
./tekvosoft release patch     # ou minor, major, ou 1.5.0
```

O comando confere se o repositório está em condições de publicar (na `main`,
sem alterações pendentes, sincronizado com o GitHub), calcula a versão nova,
escreve o `CHANGELOG.md`, mostra o que vai entrar e pede confirmação. Só então
cria a tag e envia.

A partir daí o GitHub compila as imagens e publica a release sozinho.

### Ver e trocar de versão

```bash
./tekvosoft version           # o que está rodando e o que existe
./tekvosoft rollback 1.2.3    # voltar para uma anterior
```

### Arquiteturas

As imagens são publicadas para **`linux/amd64`** (Intel/AMD, o caso comum) e
**`linux/arm64`** (Ampere, Graviton, as instâncias ARM gratuitas da Oracle,
Raspberry Pi 4+, Macs com chip M). O Docker escolhe a certa sozinho — você não
passa nada.

O instalador detecta a arquitetura e recusa a instalação se não for uma
dessas, em vez de falhar no meio.

### O que cada tag significa

| Tag | Aponta para |
|---|---|
| `1.2.3` | aquela release exata — nunca muda |
| `1.2` | a última correção da série 1.2 |
| `1` | a última versão da série 1 |
| `latest` | a **última release** |
| `main` | o último build da branch main |

**Produção nunca deve usar `main`.** Ela acompanha a branch e pode conter
trabalho em andamento. O padrão do `.env` é `latest`, que só anda quando você
publica uma release de propósito.

Quer previsibilidade total? Fixe a versão exata no `.env`:

```bash
TAG=1.2.3
```

### Onde as imagens ficam

O GitHub Actions compila e publica em `ghcr.io/tekvosoft-chat/`. Em produção
nada é compilado — `deploy` e `update` só baixam o resultado, o que faz cada
subida levar segundos em vez de dezenas de minutos e permite rodar em VPS
pequena.

---

## Personalização da marca

O nome, o logo e as cores do sistema **não ficam no código** — são
configuração, em *Configurações → Whitelabel*, dentro do próprio sistema. O
nome exibido vem do ajuste `appName`; `Tekvosoft` é apenas o padrão quando
nada foi configurado.

---

## Licença

AGPL v3. A licença exige que **todo usuário com acesso ao sistema consiga
chegar ao código-fonte**. O link está na tela "Sobre" e aponta para este
repositório — se você mover o link de lugar, tudo bem, mas ele precisa
continuar acessível a qualquer usuário.

Este projeto deriva do [Ticketz](https://github.com/ticketz-oss/ticketz), que
por sua vez deriva do [Whaticket](https://github.com/canove/whaticket-community).
Os créditos aos autores originais estão preservados na tela "Sobre".

---

## Aviso

Este projeto não tem vínculo com a Meta, o WhatsApp ou qualquer outra empresa.
O uso é de responsabilidade de quem opera o sistema.
