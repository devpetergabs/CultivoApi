#!/usr/bin/env bash
set -euo pipefail

echo "Plano de restore do DevLake"
echo "1. parar o stack de observability"
echo "2. garantir backup .sql existente em infra/_artifacts/backups"
echo "3. recriar/limpar o schema de destino com cuidado"
echo "4. restaurar com mysql < arquivo.sql dentro do container db"
echo "5. subir o stack e validar com smoke + doctor"
echo "6. somente depois abrir Config UI e Grafana"
