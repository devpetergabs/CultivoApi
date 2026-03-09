#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.observability"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.observability.yml"
ARTIFACT_DIR="${ROOT_DIR}/_artifacts/observability/validation-$(date +%Y%m%d-%H%M%S)"
mkdir -p "${ARTIFACT_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[erro] ${ENV_FILE} não encontrado. Rode bash scripts/init-observability.sh primeiro."
  exit 1
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "[erro] comando obrigatório ausente: $1"
    exit 1
  }
}

http_probe() {
  local name="$1"
  local url="$2"
  local outfile="$3"
  local code
  code="$(curl -ksS -o /dev/null -w '%{http_code}' "${url}" || true)"
  echo "${code}" > "${outfile}"
  if [[ "${code}" =~ ^(200|302|401)$ ]]; then
    echo "[ok] ${name}: ${url} -> HTTP ${code}"
  else
    echo "[warn] ${name}: ${url} -> HTTP ${code}"
  fi
}

require_cmd docker
require_cmd curl

cd "${ROOT_DIR}"

echo "[info] salvando evidências em ${ARTIFACT_DIR}"

docker compose --env-file .env.observability -f "${COMPOSE_FILE}" ps | tee "${ARTIFACT_DIR}/compose-ps.txt"
docker compose --env-file .env.observability -f "${COMPOSE_FILE}" logs --tail=200 > "${ARTIFACT_DIR}/compose-logs-tail.txt" || true

http_probe "Config UI" "http://127.0.0.1:${DEVLAKE_CONFIG_UI_PORT}" "${ARTIFACT_DIR}/config-ui.status"
http_probe "Grafana" "http://127.0.0.1:${GRAFANA_PORT}" "${ARTIFACT_DIR}/grafana.status"
http_probe "Swagger via Config UI" "http://127.0.0.1:${DEVLAKE_CONFIG_UI_PORT}/api/swagger/index.html" "${ARTIFACT_DIR}/swagger.status"

cat > "${ARTIFACT_DIR}/summary.txt" <<SUMMARY
Config UI: http://127.0.0.1:${DEVLAKE_CONFIG_UI_PORT}
Grafana: http://127.0.0.1:${GRAFANA_PORT}
Swagger: http://127.0.0.1:${DEVLAKE_CONFIG_UI_PORT}/api/swagger/index.html
API: http://127.0.0.1:${DEVLAKE_API_PORT}
SUMMARY

echo "[ok] validação executada"
echo "[info] revise ${ARTIFACT_DIR}/summary.txt e os arquivos *.status"
