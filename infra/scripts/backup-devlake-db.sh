#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.observability.yml"
ENV_FILE="$ROOT_DIR/.env.observability"
OUT_DIR="$ROOT_DIR/_artifacts/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERRO] arquivo $ENV_FILE não encontrado"
  exit 1
fi

mkdir -p "$OUT_DIR"
source "$ENV_FILE"

OUT_FILE="$OUT_DIR/devlake-lake-${TIMESTAMP}.sql"

echo "[INFO] gerando dump em $OUT_FILE"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T devlake-db \
  mysqldump -u"${DEVLAKE_DB_USER}" -p"${DEVLAKE_DB_PASSWORD}" "${DEVLAKE_DB_NAME}" > "$OUT_FILE"

echo "[OK] backup gerado"
