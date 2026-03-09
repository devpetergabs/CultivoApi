#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Uso: bash infra/scripts/check-github-actions-mapping.sh <repo1> [repo2 ...]"
  exit 1
fi

found_any=0
for repo in "$@"; do
  echo "=================================================="
  echo "Repo: $repo"

  if [ ! -d "$repo" ]; then
    echo "- caminho inexistente"
    continue
  fi

  wf_dir="$repo/.github/workflows"
  if [ ! -d "$wf_dir" ]; then
    echo "- sem .github/workflows"
    continue
  fi

  count=$(find "$wf_dir" -maxdepth 1 -type f \( -name '*.yml' -o -name '*.yaml' \) | wc -l | tr -d ' ')
  echo "- workflows encontrados: $count"
  if [ "$count" -gt 0 ]; then
    found_any=1
    find "$wf_dir" -maxdepth 1 -type f \( -name '*.yml' -o -name '*.yaml' \) -print | sort
  fi

done

if [ "$found_any" -eq 0 ]; then
  echo "=================================================="
  echo "Nenhum workflow encontrado."
  echo "Conclusao: ainda nao existe material suficiente para fechar regex definitivo de deployment."
fi
