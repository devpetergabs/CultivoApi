#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.observability"
EXAMPLE_FILE="${ROOT_DIR}/.env.observability.example"

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${EXAMPLE_FILE}" "${ENV_FILE}"
  echo "[ok] .env.observability criado a partir do exemplo"
fi

if grep -q '^DEVLAKE_ENCRYPTION_SECRET=SUBSTITUIR_POR_128_CHARS$' "${ENV_FILE}"; then
  if ! command -v openssl >/dev/null 2>&1; then
    echo "[erro] openssl não encontrado. Gere o secret manualmente e atualize ${ENV_FILE}."
    exit 1
  fi

  SECRET="$(openssl rand -base64 2000 | tr -dc 'A-Z' | fold -w 128 | head -n 1)"
  python3 - <<PY
from pathlib import Path
path = Path(r"${ENV_FILE}")
text = path.read_text()
text = text.replace("DEVLAKE_ENCRYPTION_SECRET=SUBSTITUIR_POR_128_CHARS", f"DEVLAKE_ENCRYPTION_SECRET=${SECRET}")
path.write_text(text)
PY
  echo "[ok] DEVLAKE_ENCRYPTION_SECRET gerado e salvo em ${ENV_FILE}"
else
  echo "[ok] DEVLAKE_ENCRYPTION_SECRET já configurado"
fi

echo "[info] Revise JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN e JIRA_BOARD_IDS antes da primeira conexão."
