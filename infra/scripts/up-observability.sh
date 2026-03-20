#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

bash scripts/init-observability.sh

docker compose \
  --env-file .env.observability \
  -f docker-compose.observability.yml \
  up -d

echo "[ok] Stack de observability iniciado"
echo "[info] Config UI: http://localhost:4000"
echo "[info] Grafana:   http://localhost:3002"
echo "[info] API:       http://localhost:8081"
