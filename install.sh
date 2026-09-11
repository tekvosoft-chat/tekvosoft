#!/usr/bin/env bash
#
#  Tekvosoft — instalador de produção.
#
#  Do servidor vazio ao sistema no ar, com HTTPS, em um comando:
#
#      curl -sSL https://raw.githubusercontent.com/tekvosoft-chat/tekvosoft/main/install.sh \
#        | sudo bash -s chat.exemplo.com.br voce@exemplo.com.br
#
#  Pode rodar de novo quando quiser: preserva o .env e os dados existentes.

set -euo pipefail

REPO_URL="https://github.com/tekvosoft-chat/tekvosoft.git"
INSTALL_DIR="/opt/tekvosoft"
BRANCH="main"

# Guardado antes de qualquer cd: é onde procuramos um backup para restaurar.
PWD_AT_START="${PWD}"

# ── aparência ────────────────────────────────────────────────
if [ -t 1 ]; then
  B=$'\e[1m'; DIM=$'\e[2m'; R=$'\e[31m'; G=$'\e[32m'; Y=$'\e[33m'; C=$'\e[36m'; N=$'\e[0m'
else
  B=""; DIM=""; R=""; G=""; Y=""; C=""; N=""
fi
say()  { echo "${C}→${N} $*"; }
ok()   { echo "${G}✓${N} $*"; }
warn() { echo "${Y}!${N} $*"; }
die()  { echo; echo "${R}✗${N} $*" >&2; echo; exit 1; }

usage() {
  cat <<EOF

  ${B}Instalador do Tekvosoft${N}

  ${B}Uso${N}
      curl -sSL ${DIM}<url-do-install.sh>${N} | sudo bash -s <dominio> <email>

  ${B}Exemplo${N}
      curl -sSL ${DIM}<url-do-install.sh>${N} | sudo bash -s chat.exemplo.com.br voce@exemplo.com.br

  ${B}Antes de rodar, confira${N}
      • servidor limpo com Ubuntu 20+ (ou Debian equivalente)
      • portas 80 e 443 livres e liberadas no firewall
      • DNS do domínio já apontando para o IP deste servidor

  ${B}Opções${N}
      -b <branch>   instala a partir de outra branch (padrão: main)

EOF
}

# ── verificações de entrada ──────────────────────────────────
[ -n "${BASH_VERSION:-}" ] || { echo "Rode este script com bash."; exit 1; }

if [ "${1:-}" = "-b" ]; then
  BRANCH="${2:?informe o nome da branch após -b}"
  shift 2
fi

if [ "${EUID}" -ne 0 ]; then
  usage
  die "Este script precisa de root. Use ${B}sudo${N}."
fi

DOMAIN="${1:-}"
ADMIN_EMAIL="${2:-}"

if [ -z "${DOMAIN}" ] || [ -z "${ADMIN_EMAIL}" ]; then
  usage
  die "Faltou informar o domínio e/ou o e-mail."
fi

if ! [[ "${DOMAIN}" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$ ]]; then
  die "Domínio inválido: '${DOMAIN}'
    Informe um domínio completo, como chat.exemplo.com.br — sem http:// e sem barra."
fi

if ! [[ "${ADMIN_EMAIL}" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  die "E-mail inválido: '${ADMIN_EMAIL}'"
fi

echo
echo "  ${B}Tekvosoft${N} ${DIM}— instalação${N}"
echo
echo "     domínio   ${B}${DOMAIN}${N}"
echo "     e-mail    ${B}${ADMIN_EMAIL}${N}"
echo "     destino   ${B}${INSTALL_DIR}${N}"
echo

# ── o DNS aponta mesmo para cá? ──────────────────────────────
# Certificado só sai se o domínio resolver para este servidor. É de longe
# a causa nº 1 de instalação que "sobe mas fica sem HTTPS".
check_dns() {
  command -v getent >/dev/null 2>&1 || return 0
  local resolved server_ip
  resolved=$(getent ahostsv4 "${DOMAIN}" 2>/dev/null | awk '{print $1; exit}') || true
  server_ip=$(curl -s --max-time 8 https://api.ipify.org 2>/dev/null) || true

  [ -z "${resolved}" ] && { warn "Não consegui resolver o DNS de ${DOMAIN} agora."; return 0; }
  [ -z "${server_ip}" ] && return 0

  if [ "${resolved}" != "${server_ip}" ]; then
    warn "O DNS de ${DOMAIN} aponta para ${resolved}, mas este servidor é ${server_ip}."
    echo "  ${DIM}A instalação continua, porém o certificado HTTPS não será emitido"
    echo "  enquanto o DNS não apontar para cá. Se você usa Cloudflare com proxy"
    echo "  ligado, isso é esperado.${N}"
    echo
  else
    ok "DNS confere: ${DOMAIN} → ${server_ip}"
  fi
}
check_dns

# ── Docker ───────────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  say "Instalando o Docker..."
  curl -sSL https://get.docker.com | sh >/dev/null 2>&1 || die "Falha ao instalar o Docker."
  ok "Docker instalado."
else
  ok "Docker já presente."
fi

docker compose version >/dev/null 2>&1 \
  || die "Seu Docker não tem o plugin Compose v2. Atualize: https://docs.docker.com/engine/install/"

systemctl enable docker >/dev/null 2>&1 || true
systemctl start  docker >/dev/null 2>&1 || true

# Sem isto o docker-proxy mascara o IP do visitante, e todo acesso aparece
# vindo de um IP interno nos logs do nginx.
configure_real_client_ip() {
  local cfg=/etc/docker/daemon.json
  local tmp; tmp=$(mktemp)

  if [ -f "${cfg}" ] && grep -q '"userland-proxy"[[:space:]]*:[[:space:]]*false' "${cfg}" 2>/dev/null; then
    return 0
  fi

  if [ -f "${cfg}" ] && command -v python3 >/dev/null 2>&1; then
    python3 - "${cfg}" "${tmp}" <<'PY' || { rm -f "${tmp}"; return 0; }
import json, sys
src, dst = sys.argv[1], sys.argv[2]
try:
    with open(src) as f:
        cfg = json.load(f)
except Exception:
    sys.exit(1)          # arquivo existe mas não é JSON — não mexemos
cfg["userland-proxy"] = False
with open(dst, "w") as f:
    json.dump(cfg, f, indent=2)
    f.write("\n")
PY
    mv "${tmp}" "${cfg}"
  elif [ ! -f "${cfg}" ]; then
    mkdir -p /etc/docker
    echo '{ "userland-proxy": false }' > "${cfg}"
  else
    rm -f "${tmp}"
    warn "Não consegui ajustar ${cfg}; os logs podem não mostrar o IP real do visitante."
    return 0
  fi

  say "Ajustando o Docker para preservar o IP real dos visitantes..."
  systemctl restart docker >/dev/null 2>&1 || true
}
configure_real_client_ip

# ── código ───────────────────────────────────────────────────
if [ -d "${INSTALL_DIR}/.git" ]; then
  say "Instalação encontrada em ${INSTALL_DIR} — atualizando o código..."
  git -C "${INSTALL_DIR}" fetch --quiet origin
  if ! git -C "${INSTALL_DIR}" diff --quiet; then
    warn "Há alterações locais; guardando com git stash."
    git -C "${INSTALL_DIR}" stash push --quiet || true
  fi
  git -C "${INSTALL_DIR}" checkout --quiet "${BRANCH}" 2>/dev/null \
    || git -C "${INSTALL_DIR}" checkout --quiet -b "${BRANCH}" "origin/${BRANCH}"
  git -C "${INSTALL_DIR}" reset --hard --quiet "origin/${BRANCH}"
else
  say "Baixando o Tekvosoft..."
  mkdir -p "$(dirname "${INSTALL_DIR}")"
  git clone --quiet --branch "${BRANCH}" "${REPO_URL}" "${INSTALL_DIR}" \
    || die "Falha ao baixar o repositório."
fi
ok "Código em ${INSTALL_DIR} (branch ${BRANCH})."

cd "${INSTALL_DIR}"

# ── configuração ─────────────────────────────────────────────
# Numa reinstalação, DB_PASS precisa ser preservado: trocá-lo deixaria o
# banco existente inacessível.
if [ -f .env ]; then
  DB_PASS=$(grep -E '^DB_PASS=' .env | head -1 | cut -d= -f2-)
  ok "Reaproveitando a senha do banco já configurada."
else
  DB_PASS=$(openssl rand -base64 32 2>/dev/null | tr -d '/+=' | head -c 32)
  [ -n "${DB_PASS}" ] || DB_PASS=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  say "Senha do banco gerada automaticamente."
fi

sed -e "s|^DOMAIN=.*|DOMAIN=${DOMAIN}|" \
    -e "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=${ADMIN_EMAIL}|" \
    -e "s|^DB_PASS=.*|DB_PASS=${DB_PASS}|" \
    .env.example > .env
chmod 600 .env
ok "Configuração escrita em ${INSTALL_DIR}/.env"

# ── restauração de backup, se houver ─────────────────────────
# Coloque um tekvosoft-*.tar.gz ao lado de onde você rodou o comando e ele
# é restaurado automaticamente numa instalação nova.
RESTORED=""
candidate=""
for dir in "${PWD_AT_START}" "${SUDO_USER:+/home/${SUDO_USER}}" /root; do
  [ -n "${dir}" ] && [ -d "${dir}" ] || continue
  found=$(ls -t "${dir}"/tekvosoft-*.tar.gz 2>/dev/null | head -1) || true
  if [ -n "${found}" ]; then candidate="${found}"; break; fi
done

if [ -n "${candidate}" ] && [ ! -f .installed ]; then
  say "Backup encontrado: $(basename "${candidate}") — será restaurado após subir o banco."
  mkdir -p backups
  cp -n "${candidate}" backups/ 2>/dev/null || true
  RESTORED=1
fi

# ── sobe ─────────────────────────────────────────────────────
say "Baixando as imagens e subindo os serviços..."
echo "${DIM}   Pode levar alguns minutos na primeira vez.${N}"
echo

./tekvosoft deploy || die "Falha ao subir os serviços. Veja: cd ${INSTALL_DIR} && ./tekvosoft logs"

if [ -n "${RESTORED}" ]; then
  say "Restaurando o backup..."
  echo restaurar | ./tekvosoft restore || warn "A restauração falhou; o sistema subiu vazio."
fi

touch .installed

# ── atalho global ────────────────────────────────────────────
ln -sf "${INSTALL_DIR}/tekvosoft" /usr/local/bin/tekvosoft
ok "Comando ${B}tekvosoft${N} disponível em todo o sistema."

# ── fim ──────────────────────────────────────────────────────
cat <<EOF

  ${G}${B}Instalação concluída.${N}

     Acesse      ${B}https://${DOMAIN}${N}
EOF

if [ -n "${RESTORED}" ]; then
  cat <<EOF
     Login       os mesmos do sistema de origem (dados restaurados)
EOF
else
  cat <<EOF
     Login       ${B}${ADMIN_EMAIL}${N}
     Senha       ${B}123456${N}  ${R}← troque no primeiro acesso${N}
EOF
fi

cat <<EOF

  ${DIM}O certificado HTTPS é emitido automaticamente e leva 1-2 minutos.
  Enquanto isso o navegador pode reclamar do certificado — é normal.${N}

  ${B}Comandos${N}
     sudo tekvosoft logs      acompanhar o sistema
     sudo tekvosoft backup    gravar um backup
     sudo tekvosoft update    atualizar para a última versão
     sudo tekvosoft help      ver tudo

EOF
