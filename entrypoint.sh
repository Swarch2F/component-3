#!/bin/sh
set -e

# Escribir config.json con la URL del backend
CONFIG_PATH="/app/public/config.json"
API_BASE_VALUE=${API_BASE:-"https://localhost:444/graphql"}
echo "{\"apiBase\": \"$API_BASE_VALUE\"}" > "$CONFIG_PATH"
echo "[Entrypoint] Configuración escrita en $CONFIG_PATH: $API_BASE_VALUE"

exec "$@" 