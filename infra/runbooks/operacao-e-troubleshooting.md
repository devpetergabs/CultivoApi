# Runbook — operação e troubleshooting

## 1. Sintoma: Config UI abre, mas API está indisponível

Verificar:
- `docker compose -f infra/docker-compose.observability.yml ps`
- logs do container `devlake`
- se o MySQL do lake passou no healthcheck

Ação:
- aguardar boot completo do backend
- rodar `bash infra/scripts/doctor-observability.sh`

## 2. Sintoma: Grafana abre, mas dashboards estão vazios

Verificar:
- se houve sync real de Jira/GitHub
- se o projeto DevLake foi criado com escopo mínimo coerente
- se regex de deployment não está estreito ou amplo demais

Ação:
- revisar blueprint e projeto
- revisar boardId do Jira
- revisar regex de GitHub Actions

## 3. Sintoma: upgrade do DevLake deu problema

Regra:
- sempre fazer backup antes

Ação:
- guardar dump do banco lake
- comparar compose e `.env` antigos vs novos
- validar `ENCRYPTION_SECRET`

## 4. Sintoma: SonarQube sobe, mas perde estado

Causa provável:
- uso incorreto de volumes / prune agressivo

Ação:
- confirmar volumes do PostgreSQL e do SonarQube
- evitar `docker compose down -v`
- evitar `docker volume prune` sem inspeção

## 5. Checklist rápido de saúde

```bash
bash infra/scripts/validate-observability.sh
bash infra/scripts/doctor-observability.sh
bash infra/scripts/smoke-observability.sh
```
