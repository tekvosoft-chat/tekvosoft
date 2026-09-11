#!/usr/bin/env bash
#
#  Tekvosoft — instalador de produção.
#
#  Do servidor vazio ao sistema no ar, com HTTPS, em um comando:
#
#      curl -sSL https://raw.githubusercontent.com/tekvosoft-chat/tekvosoft/main/install.sh \
#        | sudo bash -s chat.suaempresa.com.br voce@suaempresa.com.br
#
#  Pode rodar de novo quando quiser: preserva a configuração e os dados.

set -euo pipefail

REPO_URL="https://github.com/tekvosoft-chat/tekvosoft.git"
INSTALL_DIR="/opt/tekvosoft"
BRANCH="main"
TOTAL_PASSOS=7

# Guardado antes de qualquer cd: é onde procuramos um backup para restaurar.
PWD_AT_START="${PWD}"

# ── aparência ────────────────────────────────────────────────
if [ -t 1 ]; then
  B=$'\e[1m'; DIM=$'\e[2m'; R=$'\e[31m'; G=$'\e[32m'; Y=$'\e[33m'; C=$'\e[36m'; N=$'\e[0m'
else
  B=""; DIM=""; R=""; G=""; Y=""; C=""; N=""
fi

PASSO=0
passo() {
  PASSO=$((PASSO + 1))
  echo
  echo "${C}${B}[${PASSO}/${TOTAL_PASSOS}]${N} ${B}$1${N}"
}
info() { echo "        $*"; }
ok()   { echo "        ${G}✓${N} $*"; }
warn() { echo "        ${Y}!${N} $*"; }

die() {
  echo
  echo "  ${R}${B}A instalação parou.${N}"
  echo
  echo "  $1" | sed 's/^/  /'
  echo
  exit 1
}

linha() { echo "  ${DIM}────────────────────────────────────────────────────────────${N}"; }

usage() {
  cat <<EOF

  ${B}Instalador do Tekvosoft${N}

  ${B}Como usar${N}

      curl -sSL ${DIM}<endereço deste script>${N} | sudo bash -s ${C}<seu-dominio> <seu-email>${N}

  ${B}Exemplo${N}

      curl -sSL ${DIM}<endereço deste script>${N} | sudo bash -s ${C}chat.suaempresa.com.br voce@suaempresa.com.br${N}

  ${B}O que cada informação significa${N}

      ${C}<seu-dominio>${N}   O endereço onde o sistema vai atender, por exemplo
                      chat.suaempresa.com.br
                      Precisa estar com o DNS apontando para ESTE servidor.
                      Escreva sem http:// e sem barra no final.

      ${C}<seu-email>${N}     Vira o seu login de administrador e é usado para
                      emitir o certificado de segurança (HTTPS).
                      Use um e-mail que você acessa de verdade.

  ${B}Antes de rodar, você precisa de${N}

      • um servidor limpo com Ubuntu 20 ou mais novo (ou Debian equivalente)
      • as portas 80 e 443 abertas no firewall
      • um domínio com DNS apontando para o IP deste servidor
      • pelo menos 2 GB de memória

  ${B}Opção extra${N}

      -b <branch>     instala a partir de outra branch (padrão: main)

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
  die "Este script precisa de permissão de administrador.

Repita o comando incluindo ${B}sudo${N}, como no exemplo acima."
fi

DOMINIO="${1:-}"
EMAIL="${2:-}"

if [ -z "${DOMINIO}" ] || [ -z "${EMAIL}" ]; then
  usage
  die "Faltou informar o domínio e o e-mail.

Eles vão no final do comando, nessa ordem:

    ... | sudo bash -s ${C}chat.suaempresa.com.br voce@suaempresa.com.br${N}"
fi

if ! [[ "${DOMINIO}" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$ ]]; then
  die "O domínio '${DOMINIO}' não parece válido.

Escreva apenas o endereço, sem http:// e sem barra no final:

    ${G}certo:${N}   chat.suaempresa.com.br
    ${R}errado:${N}  https://chat.suaempresa.com.br/"
fi

if ! [[ "${EMAIL}" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  die "O e-mail '${EMAIL}' não parece válido.

Ele vira o seu login de administrador, então use um endereço real,
como voce@suaempresa.com.br"
fi

# ── apresentação ─────────────────────────────────────────────
clear 2>/dev/null || true
cat <<EOF

  ${B}Tekvosoft${N} ${DIM}— atendimento via WhatsApp com CRM e helpdesk${N}

EOF
linha
cat <<EOF

  Vou instalar o sistema neste servidor com estas informações:

      ${B}Endereço do sistema${N}   https://${DOMINIO}
      ${B}Seu login${N}             ${EMAIL}
      ${B}Pasta de instalação${N}   ${INSTALL_DIR}

  Leva de 3 a 10 minutos. Você não precisa fazer mais nada durante o
  processo — ao final eu mostro como entrar.

EOF
linha

# ── 1. requisitos do servidor ────────────────────────────────
passo "Conferindo o servidor"

ARQ=$(uname -m)
case "${ARQ}" in
  x86_64|amd64)  info "Arquitetura: ${ARQ} ${DIM}(compatível)${N}" ;;
  aarch64|arm64) info "Arquitetura: ${ARQ} ${DIM}(compatível)${N}" ;;
  *) die "Arquitetura '${ARQ}' não é suportada.

O Tekvosoft roda em servidores x86_64 (o mais comum) e arm64.
Contate o suporte se precisar de outra." ;;
esac

MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
if [ "${MEM_MB}" -gt 0 ] && [ "${MEM_MB}" -lt 1800 ]; then
  warn "Este servidor tem ${MEM_MB} MB de memória; o recomendado é 2 GB."
  info "${DIM}A instalação continua, mas o sistema pode ficar lento ou instável.${N}"
else
  [ "${MEM_MB}" -gt 0 ] && info "Memória: ${MEM_MB} MB"
fi

LIVRE_GB=$(df -BG --output=avail / 2>/dev/null | tail -1 | tr -dc '0-9' || echo 0)
if [ "${LIVRE_GB:-0}" -gt 0 ] && [ "${LIVRE_GB}" -lt 10 ]; then
  warn "Restam ${LIVRE_GB} GB de disco; o recomendado é pelo menos 10 GB."
fi
ok "Servidor compatível."

# ── 2. portas ────────────────────────────────────────────────
#
# 80 e 443 não são intercambiáveis. O Let's Encrypt valida o domínio pela
# porta 80, e o navegador do seu cliente vai na 443 quando ele digita
# https://dominio. Mudar para outra porta significaria obrigar todo mundo a
# digitar ":8443" na URL e ficar sem certificado. Por isso, em vez de
# escolher outra porta, identificamos o que está ocupando e explicamos.
passo "Conferindo as portas 80 e 443"

porta_ocupada() {
  ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$1\$"
}

quem_ocupa() {
  local p="$1" c proc
  c=$(docker ps --format '{{.Names}}|{{.Ports}}' 2>/dev/null \
        | awk -F'|' -v pat=":${p}->" '$2 ~ pat {print $1; exit}') || true
  if [ -n "${c:-}" ]; then echo "container|${c}"; return; fi
  proc=$(ss -ltnp 2>/dev/null | awk -v pat="[:.]${p}\$" '$4 ~ pat' \
        | grep -oE 'users:\(\("[^"]+"' | head -1 | sed 's/.*"\(.*\)"/\1/') || true
  if [ -n "${proc:-}" ]; then echo "processo|${proc}"; return; fi
  echo "desconhecido|"
}

CONFLITO=""
for PORTA in 80 443; do
  if ! porta_ocupada "${PORTA}"; then
    ok "Porta ${PORTA} livre."
    continue
  fi

  DONO=$(quem_ocupa "${PORTA}")
  TIPO="${DONO%%|*}"; NOME="${DONO##*|}"

  if [ "${NOME}" = "tekvosoft-proxy" ]; then
    ok "Porta ${PORTA}: já é o próprio Tekvosoft (instalação anterior)."
  elif [ "${TIPO}" = "container" ]; then
    warn "Porta ${PORTA} ocupada pelo container '${NOME}'."
    CONFLITO="${CONFLITO}
    ${B}Porta ${PORTA}${N} — container Docker ${B}${NOME}${N}
        Para liberar:  ${C}docker stop ${NOME}${N}"
  elif [ "${TIPO}" = "processo" ]; then
    warn "Porta ${PORTA} ocupada pelo programa '${NOME}'."
    CONFLITO="${CONFLITO}
    ${B}Porta ${PORTA}${N} — programa ${B}${NOME}${N}
        Para liberar:  ${C}sudo systemctl stop ${NOME} && sudo systemctl disable ${NOME}${N}"
  else
    warn "Porta ${PORTA} ocupada por um programa que não identifiquei."
    CONFLITO="${CONFLITO}
    ${B}Porta ${PORTA}${N} — descubra com:  ${C}sudo ss -ltnp | grep ':${PORTA}'${N}"
  fi
done

if [ -n "${CONFLITO}" ]; then
  die "As portas 80 e 443 precisam estar livres, e não estão.
${CONFLITO}

${B}Por que não uso outra porta?${N}

A porta 80 é onde o Let's Encrypt confirma que o domínio é seu — sem ela
não sai o certificado. A 443 é onde o navegador procura quando alguém
digita https://${DOMINIO}. Em outra porta, seus clientes teriam que digitar
o número na URL e o site ficaria sem o cadeado.

Libere as portas com os comandos acima e rode a instalação de novo."
fi

# Oracle Cloud tem DUAS camadas de firewall, e a segunda pega quase todo
# mundo: além da Security List no painel, a imagem Ubuntu vem com regras
# de iptables que bloqueiam tudo menos SSH.
if [ -d /etc/oracle-cloud-agent ] || [ -f /etc/oci-hostname.conf ] \
   || grep -qi oracle /sys/class/dmi/id/chassis_asset_tag 2>/dev/null; then
  echo
  info "${B}Detectei que este servidor é da Oracle Cloud.${N}"
  info "Lá o tráfego passa por duas barreiras — as duas precisam liberar:"
  echo
  info "  ${B}1. No painel da Oracle${N} ${DIM}(Security List da sub-rede)${N}"
  info "     Adicione regras de entrada permitindo 0.0.0.0/0 nas portas 80 e 443."
  echo
  info "  ${B}2. Aqui dentro da máquina${N} ${DIM}(iptables — é este que costuma pegar)${N}"
  info "     ${C}sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT${N}"
  info "     ${C}sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT${N}"
  info "     ${C}sudo netfilter-persistent save${N}   ${DIM}(sem isto, some ao reiniciar)${N}"
  echo
  info "${DIM}A instalação continua. Se o site não abrir de fora depois, é aqui.${N}"
elif command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  if ufw status 2>/dev/null | grep -qE '^(80|443)'; then
    ok "Firewall (ufw) já libera as portas."
  else
    warn "O firewall ufw está ativo e não parece liberar 80 e 443."
    info "Para liberar:  ${C}sudo ufw allow 80/tcp && sudo ufw allow 443/tcp${N}"
  fi
fi

# ── 3. DNS ───────────────────────────────────────────────────
passo "Verificando o endereço ${DOMINIO}"

IP_SERVIDOR=$(curl -s --max-time 10 https://api.ipify.org 2>/dev/null || echo "")
IP_DOMINIO=""
if command -v getent >/dev/null 2>&1; then
  IP_DOMINIO=$(getent ahostsv4 "${DOMINIO}" 2>/dev/null | awk '{print $1; exit}' || echo "")
fi

if [ -z "${IP_DOMINIO}" ]; then
  warn "O domínio ${DOMINIO} ainda não aponta para lugar nenhum."
  echo
  info "Para o site funcionar com HTTPS, entre no painel onde você"
  info "comprou o domínio e crie um registro assim:"
  echo
  info "    ${B}Tipo${N}    A"
  info "    ${B}Nome${N}    ${DOMINIO%%.*}"
  info "    ${B}Valor${N}   ${IP_SERVIDOR:-o IP deste servidor}"
  echo
  info "${DIM}A instalação continua. Assim que o DNS propagar (costuma levar"
  info "de minutos a algumas horas), o certificado é emitido sozinho.${N}"
elif [ -n "${IP_SERVIDOR}" ] && [ "${IP_DOMINIO}" != "${IP_SERVIDOR}" ]; then
  warn "O domínio aponta para outro servidor."
  echo
  info "    ${DOMINIO} aponta para   ${R}${IP_DOMINIO}${N}"
  info "    este servidor é          ${G}${IP_SERVIDOR}${N}"
  echo
  info "Corrija o registro A do domínio para ${IP_SERVIDOR} — ou, se você"
  info "usa Cloudflare com o proxy ligado (nuvem laranja), ignore este aviso."
  echo
  info "${DIM}Enquanto os dois não baterem, o certificado HTTPS não é emitido.${N}"
else
  ok "DNS correto: ${DOMINIO} aponta para este servidor (${IP_SERVIDOR})."
fi

# ── 4. Docker ────────────────────────────────────────────────
passo "Preparando o Docker"

if command -v docker >/dev/null 2>&1; then
  ok "Docker já está instalado."
else
  info "Instalando o Docker (pode levar alguns minutos)..."
  curl -sSL https://get.docker.com | sh >/dev/null 2>&1 \
    || die "Não consegui instalar o Docker neste servidor.

Instale manualmente seguindo https://docs.docker.com/engine/install/
e rode este comando de novo."
  ok "Docker instalado."
fi

docker compose version >/dev/null 2>&1 || die "O Docker deste servidor é antigo demais.

Ele precisa do Docker Compose v2. Atualize seguindo
https://docs.docker.com/engine/install/ e rode este comando de novo."

systemctl enable docker >/dev/null 2>&1 || true
systemctl start  docker >/dev/null 2>&1 || true

# Sem isto o docker-proxy mascara o IP do visitante, e todo acesso aparece
# vindo de um endereço interno nos registros do sistema.
configurar_ip_real() {
  local cfg=/etc/docker/daemon.json
  local tmp; tmp=$(mktemp)

  if [ -f "${cfg}" ] && grep -q '"userland-proxy"[[:space:]]*:[[:space:]]*false' "${cfg}" 2>/dev/null; then
    rm -f "${tmp}"; return 0
  fi

  if [ -f "${cfg}" ] && command -v python3 >/dev/null 2>&1; then
    python3 - "${cfg}" "${tmp}" <<'PY' || { rm -f "${tmp}"; return 0; }
import json, sys
src, dst = sys.argv[1], sys.argv[2]
try:
    with open(src) as f:
        cfg = json.load(f)
except Exception:
    sys.exit(1)          # existe mas não é JSON — não mexemos
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
    return 0
  fi

  info "Ajustando o Docker para registrar o IP real dos visitantes..."
  systemctl restart docker >/dev/null 2>&1 || true
}
configurar_ip_real
ok "Docker pronto."

# ── 5. código ────────────────────────────────────────────────
passo "Baixando o Tekvosoft"

if [ -d "${INSTALL_DIR}/.git" ]; then
  info "Já existe uma instalação em ${INSTALL_DIR} — vou atualizá-la."
  git -C "${INSTALL_DIR}" fetch --quiet origin \
    || die "Não consegui acessar o GitHub para baixar as atualizações.

Verifique a conexão do servidor com a internet."
  if ! git -C "${INSTALL_DIR}" diff --quiet; then
    warn "Havia alterações locais; guardei com 'git stash'."
    git -C "${INSTALL_DIR}" stash push --quiet || true
  fi
  git -C "${INSTALL_DIR}" checkout --quiet "${BRANCH}" 2>/dev/null \
    || git -C "${INSTALL_DIR}" checkout --quiet -b "${BRANCH}" "origin/${BRANCH}"
  git -C "${INSTALL_DIR}" reset --hard --quiet "origin/${BRANCH}"
else
  mkdir -p "$(dirname "${INSTALL_DIR}")"
  git clone --quiet --branch "${BRANCH}" "${REPO_URL}" "${INSTALL_DIR}" \
    || die "Não consegui baixar o Tekvosoft do GitHub.

Verifique a conexão do servidor com a internet e tente de novo."
fi
ok "Código em ${INSTALL_DIR}"

cd "${INSTALL_DIR}"

# ── 6. configuração ──────────────────────────────────────────
passo "Gravando a configuração"

# Numa reinstalação a senha do banco precisa ser preservada: trocá-la
# deixaria o banco existente inacessível.
if [ -f .env ]; then
  DB_PASS=$(grep -E '^DB_PASS=' .env | head -1 | cut -d= -f2-)
  info "Mantendo a senha do banco que já estava configurada."
else
  DB_PASS=$(openssl rand -base64 32 2>/dev/null | tr -d '/+=' | head -c 32)
  [ -n "${DB_PASS}" ] || DB_PASS=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  info "Gerei uma senha forte para o banco de dados."
fi

sed -e "s|^DOMAIN=.*|DOMAIN=${DOMINIO}|" \
    -e "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=${EMAIL}|" \
    -e "s|^DB_PASS=.*|DB_PASS=${DB_PASS}|" \
    .env.example > .env
chmod 600 .env
ok "Configuração salva em ${INSTALL_DIR}/.env"
info "${DIM}É esse o arquivo que você edita se precisar mudar algo depois.${N}"

# ── backup a restaurar, se houver ────────────────────────────
RESTAURAR=""
achado=""
for dir in "${PWD_AT_START}" "${SUDO_USER:+/home/${SUDO_USER}}" /root; do
  [ -n "${dir}" ] && [ -d "${dir}" ] || continue
  cand=$(ls -t "${dir}"/tekvosoft-*.tar.gz 2>/dev/null | head -1) || true
  if [ -n "${cand}" ]; then achado="${cand}"; break; fi
done

if [ -n "${achado}" ] && [ ! -f .instalado ]; then
  info "Encontrei um backup: $(basename "${achado}")"
  info "Ele será restaurado assim que o sistema subir."
  mkdir -p backups
  cp -n "${achado}" backups/ 2>/dev/null || true
  RESTAURAR=1
fi

# ── 7. subir ─────────────────────────────────────────────────
passo "Baixando os componentes e ligando o sistema"
info "${DIM}Esta é a parte mais demorada. Pode deixar rodando.${N}"
echo

TEKVOSOFT_QUIET=1 ./tekvosoft deploy || die "O sistema não subiu corretamente.

Para ver o que aconteceu:

    cd ${INSTALL_DIR}
    ./tekvosoft logs"

if [ -n "${RESTAURAR}" ]; then
  info "Restaurando o backup..."
  echo restaurar | ./tekvosoft restore >/dev/null 2>&1 \
    && ok "Backup restaurado." \
    || warn "Não consegui restaurar o backup; o sistema subiu vazio."
fi

touch .instalado
ln -sf "${INSTALL_DIR}/tekvosoft" /usr/local/bin/tekvosoft

# ── fim ──────────────────────────────────────────────────────
echo
linha
cat <<EOF

  ${G}${B}Pronto! O Tekvosoft está no ar.${N}

  ${B}Acesse${N}    https://${DOMINIO}

EOF

if [ -n "${RESTAURAR}" ]; then
  cat <<EOF
  ${B}Entrar${N}    use o mesmo login e senha do sistema anterior,
            porque os dados foram restaurados

EOF
else
  cat <<EOF
  ${B}Entrar${N}    e-mail: ${B}${EMAIL}${N}
            senha:  ${B}123456${N}

  ${R}${B}Troque essa senha assim que entrar pela primeira vez.${N}

EOF
fi

linha
cat <<EOF

  ${B}O certificado de segurança (cadeado)${N}

  Ele é emitido sozinho e leva 1 a 2 minutos. Se você abrir o site agora
  e o navegador reclamar que "a conexão não é particular", espere esse
  tempo e recarregue a página — é normal.

  ${B}Comandos para o dia a dia${N}

      sudo tekvosoft logs      ver o que o sistema está fazendo
      sudo tekvosoft backup    gravar uma cópia de segurança
      sudo tekvosoft update    atualizar para a última versão
      sudo tekvosoft help      ver todos os comandos

EOF
