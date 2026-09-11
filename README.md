# Tekvosoft

Atendimento via WhatsApp com CRM e helpdesk. Múltiplas empresas, múltiplos
atendentes, filas, chatbot, campanhas e agendamentos — tudo em um sistema só.

---

## Um comando para cada coisa

### Instalar em produção

Servidor vazio → sistema no ar com HTTPS. Um comando:

```bash
curl -sSL https://raw.githubusercontent.com/tekvosoft-chat/tekvosoft/main/install.sh \
  | sudo bash -s chat.exemplo.com.br voce@exemplo.com.br
```

Troque pelo seu domínio e seu e-mail. O script instala o Docker se faltar,
baixa o projeto em `/opt/tekvosoft`, **gera a senha do banco sozinho** e sobe
tudo. O certificado sai automático pelo Let's Encrypt e se renova sozinho —
você nunca toca em certificado.

Antes de rodar, confira:

- [ ] servidor limpo com Ubuntu 20+ (ou Debian equivalente)
- [ ] portas 80 e 443 livres e liberadas no firewall
- [ ] DNS do domínio apontando para o IP do servidor

O login é o e-mail que você passou, senha `123456` — **troque no primeiro
acesso**.

Pode rodar de novo quando quiser: preserva o `.env`, a senha do banco e
os dados.

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

| Variável | Para que serve |
|---|---|
| `DOMAIN` | Domínio do sistema. `localhost` em desenvolvimento |
| `ADMIN_EMAIL` | Login do primeiro acesso e e-mail do certificado |
| `DB_PASS` | Senha do banco. Gere com `openssl rand -base64 32` |
| `TAG` | Versão a rodar. `latest` acompanha a última release |

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

## Publicação das imagens

O GitHub Actions compila as duas imagens a cada push na `main` e publica em
`ghcr.io/tekvosoft-chat/`. Em produção nada é compilado — o `deploy` e o
`update` só baixam o resultado, o que faz cada subida levar segundos em vez de
dezenas de minutos e permite rodar em VPS pequena.

Para lançar uma versão fixa, com rollback fácil:

```bash
git tag v1.0.0
git push --tags
```

Isso publica as tags `1.0.0`, `1.0`, `1` e `latest`.

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
