#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.observability.yml"
ENV_FILE="$ROOT_DIR/.env.observability"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERRO] arquivo $ENV_FILE não encontrado"
  exit 1
fi

echo "[INFO] docker compose ps"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps || true

echo

echo "[INFO] últimos logs do devlake"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=50 devlake || true

echo

echo "[INFO] últimos logs do config-ui"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=50 config-ui || true

echo

echo "[INFO] últimos logs do grafana"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=50 grafana || true
