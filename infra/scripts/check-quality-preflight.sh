#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.observability"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERRO] arquivo $ENV_FILE não encontrado"
  exit 1
fi

source "$ENV_FILE"

required=(SONARQUBE_VERSION SONARQUBE_DB_NAME SONARQUBE_DB_USER SONARQUBE_DB_PASSWORD SONARQUBE_JDBC_URL)

for var in "${required[@]}"; do
  val="${!var:-}"
  if [[ -z "$val" ]]; then
    echo "[ERRO] variável ausente: $var"
    exit 1
  fi
done

echo "[OK] preflight do quality stack passou"
