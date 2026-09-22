#!/usr/bin/env bash
#
#  vuup.me — atualização de produção.
#
#      curl -sSL https://raw.githubusercontent.com/tekvosoft-chat/tekvosoft/main/update.sh | sudo bash
#
#  Faz backup, traz o código e as imagens novas e reinicia.
#  Se algo der errado depois, volte com:  sudo tekvosoft rollback <tag>

set -euo pipefail

BRANCH="${1:-}"

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
[ "${EUID}" -eq 0 ] || die "Este script precisa de root. Use ${B}sudo${N}."

# ── onde está instalado? ─────────────────────────────────────
INSTALL_DIR=""
for dir in /opt/tekvosoft "${PWD}" "${SUDO_USER:+/home/${SUDO_USER}/tekvosoft}" /root/tekvosoft; do
  [ -n "${dir}" ] || continue
  if [ -f "${dir}/tekvosoft" ] && [ -f "${dir}/docker-compose.yml" ]; then
    INSTALL_DIR="${dir}"
    break
  fi
done

[ -n "${INSTALL_DIR}" ] || die "Não encontrei uma instalação do vuup.me.
    Procurei em /opt/tekvosoft, na pasta atual e no seu diretório home.
    Se ainda não instalou, use o install.sh."

cd "${INSTALL_DIR}"
ok "Instalação encontrada em ${INSTALL_DIR}"

[ -f .env ] || die "O arquivo .env não existe em ${INSTALL_DIR}. Instalação incompleta."

# ── código ───────────────────────────────────────────────────
if [ -d .git ]; then
  say "Buscando atualizações do código..."
  git fetch --quiet origin || warn "Não consegui falar com o GitHub; sigo com o código atual."

  if ! git diff --quiet 2>/dev/null; then
    warn "Você tem alterações locais no código."
    echo "  ${DIM}Vou guardá-las com git stash para poder atualizar."
    echo "  Para recuperá-las depois:  cd ${INSTALL_DIR} && git stash pop${N}"
    git stash push --quiet || true
  fi

  if [ -n "${BRANCH}" ]; then
    say "Mudando para a branch ${BRANCH}..."
    git checkout --quiet "${BRANCH}" 2>/dev/null \
      || git checkout --quiet -b "${BRANCH}" "origin/${BRANCH}" \
      || die "Branch '${BRANCH}' não encontrada."
  fi

  CURRENT=$(git rev-parse --abbrev-ref HEAD)
  git reset --hard --quiet "origin/${CURRENT}" 2>/dev/null || true
  ok "Código atualizado (branch ${CURRENT})."
else
  warn "Esta pasta não é um repositório git; atualizando só as imagens."
fi

# ── delega o resto ao CLI, que já faz backup antes ───────────
chmod +x ./tekvosoft 2>/dev/null || true
./tekvosoft update || die "Falha na atualização. Veja: cd ${INSTALL_DIR} && ./tekvosoft logs"

# mantém o atalho global apontando para o lugar certo
ln -sf "${INSTALL_DIR}/tekvosoft" /usr/local/bin/tekvosoft 2>/dev/null || true

DOMAIN=$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2-)
cat <<EOF

  ${G}${B}Atualização concluída.${N}

     ${B}https://${DOMAIN}${N}

  ${DIM}Um backup foi gravado antes da atualização, em ${INSTALL_DIR}/backups
  Se algo quebrou:  sudo tekvosoft rollback <tag>${N}

EOF
