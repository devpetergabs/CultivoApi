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

echo "[info] pré-flight GitHub"
check_value "GITHUB_CONNECTION_NAME" "${GITHUB_CONNECTION_NAME:-}" 'example|^$'
check_value "GITHUB_OWNER" "${GITHUB_OWNER:-}" 'SEU_ORG_OU_USUARIO|example|^$'
check_value "GITHUB_REPOS" "${GITHUB_REPOS:-}" 'cultivo-backend,cultivo-frontend|^$'
check_value "GITHUB_TOKEN" "${GITHUB_TOKEN:-}" 'colar-token-aqui|SUBSTITUIR|^$'
check_value "GITHUB_DEPLOYMENT_REGEX" "${GITHUB_DEPLOYMENT_REGEX:-}" '^$'
check_value "GITHUB_PRODUCTION_REGEX" "${GITHUB_PRODUCTION_REGEX:-}" '^$'

echo
printf '%s
' "[info] owner esperado = organização ou usuário dono dos repositórios"
printf '%s
' "[info] repos esperados = lista separada por vírgula"
printf '%s
' "[info] revise se production regex não captura dev/hml/test"
printf '%s
' "[info] projeto piloto recomendado = ${DEVLAKE_PROJECT_NAME:-cultivo-engineering-pilot}"
