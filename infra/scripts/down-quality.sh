#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.observability"
COMPOSE_FILE="$ROOT_DIR/docker-compose.quality.yml"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down

echo "[OK] quality stack parado"
