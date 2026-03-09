#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Uso: bash infra/scripts/generate-gha-regex-candidates.sh <repo1> [repo2 ...]"
  exit 1
fi

extract_workflow_name() {
  local file="$1"
  awk '/^name:/ { sub(/^name:[[:space:]]*/, "", $0); print; exit }' "$file"
}

extract_job_names() {
  local file="$1"
  awk '
    /^jobs:/ { in_jobs=1; next }
    in_jobs && /^[^[:space:]]/ { in_jobs=0 }
    in_jobs && /^[[:space:]]{2}[A-Za-z0-9_-]+:/ {
      line=$0
      gsub(/^[[:space:]]+/, "", line)
      sub(/:$/, "", line)
      print line
    }
    in_jobs && /^[[:space:]]{4}name:/ {
      line=$0
      sub(/^[[:space:]]*name:[[:space:]]*/, "", line)
      print line
    }
  ' "$file"
}

all_names=""
for repo in "$@"; do
  wf_dir="$repo/.github/workflows"
  [ -d "$wf_dir" ] || continue
  while IFS= read -r file; do
    [ -f "$file" ] || continue
    wf_name=$(extract_workflow_name "$file" || true)
    if [ -n "${wf_name:-}" ]; then
      all_names+="$wf_name"$'\n'
    fi
    jobs=$(extract_job_names "$file" || true)
    if [ -n "${jobs:-}" ]; then
      all_names+="$jobs"$'\n'
    fi
  done < <(find "$wf_dir" -maxdepth 1 -type f \( -name '*.yml' -o -name '*.yaml' \) | sort)
done

all_names=$(printf "%s" "$all_names" | sed '/^$/d' | sort -u || true)
if [ -z "$all_names" ]; then
  echo "Nenhum workflow/job encontrado."
  exit 0
fi

echo "=== Inventario resumido de nomes ==="
printf "%s\n" "$all_names"

echo
echo "=== Sugestao inicial de candidatos a deployment ==="
printf "%s\n" "$all_names" | grep -Ei 'deploy|release|promote|publish|push-image|rollout' || echo "(nenhum candidato obvio)"

echo
echo "=== Sugestao inicial de candidatos a producao ==="
printf "%s\n" "$all_names" | grep -Ei 'prod|production|release-prod|promote-production' || echo "(nenhum candidato obvio)"

echo
echo "=== Regex base sugerido ==="
echo 'deployment: (?i).*(deploy|release|promote|publish|push-image|rollout).*'
echo 'production: (?i).*(prod|production|release-prod|promote-production).*'

echo
echo "Revise manualmente antes de usar no DevLake."
