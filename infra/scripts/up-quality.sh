#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.observability"
COMPOSE_FILE="$ROOT_DIR/docker-compose.quality.yml"

bash "$ROOT_DIR/scripts/check-quality-preflight.sh"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

echo "[OK] quality stack iniciado"
echo "SonarQube: http://127.0.0.1:9000"
