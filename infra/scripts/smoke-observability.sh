#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.observability"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERRO] arquivo $ENV_FILE não encontrado"
  exit 1
fi

source "$ENV_FILE"

CONFIG_UI_PORT="${DEVLAKE_CONFIG_UI_PORT:-4000}"
GRAFANA_PORT="${DEVLAKE_GRAFANA_PORT:-3002}"

check() {
  local name="$1"
  local url="$2"
  echo "[SMOKE] $name -> $url"
  if curl -fsS "$url" >/dev/null; then
    echo "[OK] $name"
  else
    echo "[FALHA] $name"
    return 1
  fi
}

check "Config UI" "http://127.0.0.1:${CONFIG_UI_PORT}"
check "Grafana" "http://127.0.0.1:${GRAFANA_PORT}/login"
check "Swagger via Config UI" "http://127.0.0.1:${CONFIG_UI_PORT}/api/swagger/index.html"
