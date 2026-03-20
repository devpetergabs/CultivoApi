#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

docker compose \
  --env-file .env.observability \
  -f docker-compose.observability.yml \
  ps

echo
echo "[info] URLs esperadas"
echo "- Config UI: http://localhost:4000"
echo "- Grafana:   http://localhost:3002"
echo "- API:       http://localhost:8081"
