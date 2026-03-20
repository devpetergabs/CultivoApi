#!/usr/bin/env bash
set -euo pipefail

cat <<'TXT'
================ DORA FIRST READOUT ================
1) O projeto DevLake representa apenas o produto Cultivo?
2) O Jira do projeto representa incidentes reais?
3) O GitHub do projeto contem backend + frontend certos?
4) O regex de deployment foi derivado de workflows/jobs reais?
5) O regex de production exclui hml/staging/test?
6) Existem deployments recentes coerentes com a sua memoria operacional?
7) Se o numero estiver estranho, voce confia mais na sua semantica ou no dashboard?

Regra:
- Se a semantica estiver errada, o dashboard esta errado.
- Corrija definicao antes de tirar conclusao executiva.
TXT
