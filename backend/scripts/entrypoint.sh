#!/bin/bash
#
# Prepara o banco e sobe o backend.
# Serve tanto para desenvolvimento quanto para produção — o que muda é
# que em dev o código vem montado do host e precisa ser compilado aqui.

set -e

echo "→ Aguardando o Postgres (${DB_HOST})..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT:-5432}" -U "${DB_USER}" -q; do
  sleep 1
done

if [ "${NODE_ENV}" != "production" ]; then
  # O CLI do Sequelize lê as migrações de dist/, então mesmo em dev
  # precisamos compilar antes de migrar.
  if [ ! -f src/generated/translationKeys.ts ]; then
    echo "→ Gerando chaves de tradução..."
    npm run generate:i18nkeys
  fi
  echo "→ Compilando TypeScript (incremental)..."
  npx tsc --sourceMap true --incremental
fi

echo "→ Aplicando migrações..."
npx sequelize db:migrate \
  --config dist/config/database.js \
  --migrations-path dist/database/migrations

# Importação opcional de dados vindos de outro sistema.
# load-retrieved.sh sai com: 0 = nada a fazer, 1 = importou, >=100 = erro.
IMPORTED=0
if [ -f /retrieve/retrieved_data.tar.gz ]; then
  echo "→ Encontrei dados para importar..."
  set +e
  ./scripts/load-retrieved.sh /retrieve
  code=$?
  set -e
  case "${code}" in
    0) ;;
    1) IMPORTED=1 ;;
    *) echo "✗ Falha ao importar os dados (código ${code})"; exit 1 ;;
  esac
fi

if [ "${IMPORTED}" = "1" ]; then
  echo "→ Dados importados — marcando as seeds como já aplicadas."
  npm run mark-seeds
else
  echo "→ Aplicando dados iniciais..."
  npx sequelize db:seed:all \
    --config dist/config/database.js \
    --seeders-path dist/database/seeds
fi

echo "→ Subindo o vuup.me."
exec "$@"
