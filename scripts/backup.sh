#!/bin/sh
#
# Backup e restauração do vuup.me.
# Roda dentro do container "tools" (postgres:16-alpine), chamado por:
#     ./tekvosoft backup
#     ./tekvosoft restore
#
# Um backup é um único .tar.gz contendo:
#     db.sql     dump completo do Postgres
#     public/    arquivos enviados (anexos, mídias)
#     private/   sessões do WhatsApp e dados internos
#
# Nota: o tar do Alpine (busybox) só honra UM "-C", então tudo é
# montado sob /data antes de empacotar.

set -eu

PREFIX=tekvosoft
export PGPASSWORD="${DB_PASS}"

case "${1:-}" in

  backup)
    STAMP=$(date +%Y%m%d-%H%M%S)
    OUT="/backups/${PREFIX}-${STAMP}.tar.gz"

    echo "→ Copiando o banco de dados..."
    pg_dump -h postgres -U "${DB_USER}" -d "${DB_NAME}" \
            --clean --if-exists --no-owner --no-privileges -f /data/db.sql

    echo "→ Empacotando arquivos..."
    mkdir -p /data/public /data/private
    tar czf "${OUT}" -C /data db.sql public private
    rm -f /data/db.sql

    echo "✓ $(basename "${OUT}")  ($(du -h "${OUT}" | cut -f1))"

    # Mantém os 10 backups mais recentes e descarta o resto.
    ls -t /backups/${PREFIX}-*.tar.gz 2>/dev/null | tail -n +11 | while read -r old; do
      echo "  descartando backup antigo: $(basename "${old}")"
      rm -f "${old}"
    done
    ;;

  restore)
    FILE="${2:-}"
    if [ -z "${FILE}" ]; then
      FILE=$(ls -t /backups/${PREFIX}-*.tar.gz 2>/dev/null | head -1)
    fi
    [ -n "${FILE}" ] && [ -f "${FILE}" ] || {
      echo "✗ Nenhum backup encontrado em ./backups" >&2
      exit 1
    }

    echo "→ Restaurando de $(basename "${FILE}")"
    tar xzf "${FILE}" -C /data

    echo "  recuperando o banco de dados..."
    # ON_ERROR_STOP: melhor abortar do que deixar o banco meio restaurado
    # sem ninguém perceber.
    if ! psql -h postgres -U "${DB_USER}" -d "${DB_NAME}" \
              -q -v ON_ERROR_STOP=1 -f /data/db.sql; then
      echo "✗ A restauração falhou. O banco pode estar inconsistente —" >&2
      echo "  restaure outro backup antes de voltar a usar o sistema." >&2
      rm -f /data/db.sql
      exit 1
    fi
    rm -f /data/db.sql

    echo "✓ Restauração concluída (banco e arquivos)."
    ;;

  list)
    ls -lht /backups/${PREFIX}-*.tar.gz 2>/dev/null || echo "Nenhum backup ainda."
    ;;

  *)
    echo "uso: backup.sh {backup|restore [arquivo]|list}" >&2
    exit 1
    ;;
esac
