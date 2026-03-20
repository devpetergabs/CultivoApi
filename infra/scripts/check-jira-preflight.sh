#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.observability"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[erro] ${ENV_FILE} não encontrado. Rode bash scripts/init-observability.sh primeiro."
  exit 1
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

check_value() {
  local label="$1"
  local value="$2"
  local invalid_regex="$3"
  if [[ -z "${value}" || "${value}" =~ ${invalid_regex} ]]; then
    echo "[pendente] ${label}"
  else
    echo "[ok] ${label}"
  fi
}

echo "[info] pré-flight Jira"
check_value "JIRA_BASE_URL" "${JIRA_BASE_URL:-}" 'SEU-DOMINIO|example|^$'
check_value "JIRA_EMAIL" "${JIRA_EMAIL:-}" 'example|^$'
check_value "JIRA_API_TOKEN" "${JIRA_API_TOKEN:-}" 'SUBSTITUIR|^$'
check_value "JIRA_BOARD_IDS" "${JIRA_BOARD_IDS:-}" '1,2,3|^$'

echo
printf '%s
' "[info] endpoint esperado: https://SEU-DOMINIO.atlassian.net/rest/"
printf '%s
' "[info] boardId = número final da URL do board"
printf '%s
' "[info] projeto piloto recomendado: cultivo-jira-pilot"
