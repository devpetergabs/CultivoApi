# Segurança mínima do stack local

## Regras

- `.env.observability` não entra em versionamento
- `ENCRYPTION_SECRET` deve ser único e persistido com segurança
- ports bindados em `127.0.0.1` por padrão
- tokens de Jira/GitHub/Sonar nunca em README nem script versionado

## Backup

Antes de upgrade do DevLake, exportar dump do banco do lake.

## Logs e evidências

As capturas locais vão para `_artifacts/`.

## Escopo

Este material cobre hardening mínimo local/de laboratório. Para ambiente compartilhado, entram depois reverse proxy, TLS, RBAC e secrets manager.
