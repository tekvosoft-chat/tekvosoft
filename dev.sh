#!/usr/bin/env bash
#
#  Tekvosoft — ambiente de desenvolvimento em um comando.
#
#      curl -sSL https://raw.githubusercontent.com/tekvosoft-chat/tekvosoft/main/dev.sh | bash
#
#  Clona o projeto na pasta atual e sobe tudo com hot reload.
#  NÃO use sudo: o código precisa ser seu, não do root.

set -euo pipefail

REPO_URL="https://github.com/tekvosoft-chat/tekvosoft.git"
DIR_NAME="tekvosoft"

if [ -t 1 ]; then
  B=$'\e[1m'; DIM=$'\e[2m'; R=$'\e[31m'; G=$'\e[32m'; Y=$'\e[33m'; C=$'\e[36m'; N=$'\e[0m'
else
  B=""; DIM=""; R=""; G=""; Y=""; C=""; N=""
fi
say()  { echo "${C}→${N} $*"; }
ok()   { echo "${G}✓${N} $*"; }
warn() { echo "${Y}!${N} $*"; }
die()  { echo; echo "${R}✗${N} $*" >&2; echo; exit 1; }

[ -n "${BASH_VERSION:-}" ] || { echo "Rode este script com bash."; exit 1; }

if [ "${EUID}" -eq 0 ]; then
  die "Não rode isto como root.
    O código ficaria todo com dono root e você não conseguiria editá-lo.
    Rode como seu usuário normal, sem sudo."
fi

echo
echo "  ${B}Tekvosoft${N} ${DIM}— ambiente de desenvolvimento${N}"
echo

# ── pré-requisitos ───────────────────────────────────────────
command -v git >/dev/null 2>&1 || die "Git não está instalado.
    Ubuntu/Debian:  sudo apt install git"

command -v docker >/dev/null 2>&1 || die "Docker não está instalado.
    Instale com:  curl -sSL https://get.docker.com | sudo sh"

docker compose version >/dev/null 2>&1 \
  || die "Você tem Docker, mas sem o plugin Compose v2.
    Atualize: https://docs.docker.com/engine/install/"

if ! docker info >/dev/null 2>&1; then
  die "O Docker não responde para o seu usuário.
    Se ele precisa de sudo, adicione-se ao grupo docker:

        sudo usermod -aG docker \$USER

    Depois faça logout e login de novo (fechar o terminal não basta)."
fi
ok "Docker pronto."

# ── código ───────────────────────────────────────────────────
if [ -f "./tekvosoft" ] && [ -f "./docker-compose.yml" ]; then
  TARGET="."
  say "Já estou dentro do projeto; atualizando..."
  git pull --quiet 2>/dev/null || warn "Não consegui atualizar; sigo com o código local."
elif [ -d "${DIR_NAME}" ]; then
  TARGET="${DIR_NAME}"
  say "Pasta ${DIR_NAME}/ já existe; atualizando..."
  git -C "${DIR_NAME}" pull --quiet 2>/dev/null || warn "Não consegui atualizar; sigo com o código local."
else
  TARGET="${DIR_NAME}"
  say "Baixando o Tekvosoft..."
  git clone --quiet "${REPO_URL}" "${DIR_NAME}" || die "Falha ao clonar o repositório."
fi

cd "${TARGET}"
ok "Código em $(pwd)"

# ── sobe ─────────────────────────────────────────────────────
# O ./tekvosoft cria o .env a partir do exemplo se não existir; aqui só
# garantimos uma senha de banco decente em vez do placeholder.
if [ ! -f .env ]; then
  DB_PASS=$(openssl rand -base64 24 2>/dev/null | tr -d '/+=' | head -c 24)
  [ -n "${DB_PASS}" ] || DB_PASS="dev$(date +%s)"
  sed "s|^DB_PASS=.*|DB_PASS=${DB_PASS}|" .env.example > .env
  ok "Criei o .env com uma senha de banco gerada."
fi

chmod +x ./tekvosoft 2>/dev/null || true
echo
./tekvosoft dev

cat <<EOF

  ${DIM}Você está em $(pwd)
  Edite backend/ ou frontend/ — recarrega sozinho.${N}

  ${B}Comandos${N}
     ./tekvosoft logs      acompanhar o que está rodando
     ./tekvosoft psql      console do banco
     ./tekvosoft reset     zerar o banco e começar limpo
     ./tekvosoft stop      parar tudo
     ./tekvosoft help      ver tudo

EOF
