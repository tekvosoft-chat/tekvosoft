#!/bin/sh
#
# Gera /var/www/public/config.json e sobe o nginx.
#
# ATENÇÃO: este arquivo é servido publicamente — qualquer visitante
# consegue lê-lo em https://seu-dominio/config.json. Por isso a lista
# abaixo é explícita: só entra o que o navegador precisa saber.
# NUNCA acrescente senha, chave secreta ou token aqui.

set -e

KEYS="BACKEND_PROTOCOL BACKEND_HOST BACKEND_PORT BACKEND_PATH
      REACT_APP_BACKEND_URL RECAPTCHA_SITE_KEY"

{
  echo "{"
  first=1
  for key in ${KEYS}; do
    value=$(eval "printf '%s' \"\${${key}:-}\"")
    [ -n "${value}" ] || continue
    [ "${first}" -eq 1 ] || echo ","
    first=0
    printf '  "%s": "%s"' "${key}" "${value}"
  done
  echo
  echo "}"
} > /var/www/public/config.json

exec "$@"
