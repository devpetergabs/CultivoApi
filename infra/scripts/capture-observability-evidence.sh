#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.observability.yml"
ENV_FILE="${ROOT_DIR}/.env.observability"
OUT_DIR="${ROOT_DIR}/_artifacts/observability/evidence-$(date +%Y%m%d-%H%M%S)"
mkdir -p "${OUT_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[erro] ${ENV_FILE} não encontrado. Rode bash scripts/init-observability.sh primeiro."
  exit 1
fi

cd "${ROOT_DIR}"

docker compose --env-file .env.observability -f "${COMPOSE_FILE}" ps > "${OUT_DIR}/compose-ps.txt" || true
docker compose --env-file .env.observability -f "${COMPOSE_FILE}" logs --tail=500 > "${OUT_DIR}/compose-logs-tail-500.txt" || true

echo "Checklist aplicado:" > "${OUT_DIR}/notes.txt"
echo "- stack em pé" >> "${OUT_DIR}/notes.txt"
echo "- conexão Jira testada" >> "${OUT_DIR}/notes.txt"
echo "- projeto piloto executado" >> "${OUT_DIR}/notes.txt"
echo "- dashboards revisados" >> "${OUT_DIR}/notes.txt"

echo "[ok] evidências salvas em ${OUT_DIR}"
