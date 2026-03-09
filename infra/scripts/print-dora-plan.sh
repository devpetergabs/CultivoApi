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

cat <<PLAN
[info] desenho DORA proposto para o Cultivo

Projeto DevLake:
- ${DEVLAKE_PROJECT_NAME:-cultivo-engineering-pilot}

Changes:
- GitHub owner: ${GITHUB_OWNER:-PENDENTE}
- GitHub repos: ${GITHUB_REPOS:-PENDENTE}

Deployments:
- Deployment regex: ${GITHUB_DEPLOYMENT_REGEX:-PENDENTE}
- Production regex: ${GITHUB_PRODUCTION_REGEX:-PENDENTE}

Incidents:
- Jira boards: ${JIRA_BOARD_IDS:-PENDENTE}
- Jira base URL: ${JIRA_BASE_URL:-PENDENTE}

Janela inicial:
- ${DEVLAKE_TIME_RANGE_DAYS:-90} dias

Checklist mental antes do collect:
- backend e frontend representam o produto real?
- regex de deployment captura só deploy de verdade?
- regex de production não captura ambientes errados?
- boards Jira realmente representam incidente e fluxo do produto?
PLAN
