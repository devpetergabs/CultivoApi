# Infra — fase 7/7

Esta fase fecha o trilho inicial de observability/analytics do Cultivo Inteligente.

## Objetivo desta fase

- endurecer a operação local do stack de observability
- deixar runbook curto de troubleshooting
- preparar a expansão controlada para quality stack com SonarQube
- preparar Grafana para versionamento por arquivos

## O que entra nesta fase

### 1) Hardening operacional

- bind local por padrão (`127.0.0.1`)
- backup explícito antes de upgrade do DevLake
- secrets fora de versionamento
- health/readiness checks antes do onboarding Jira/GitHub
- scripts de `backup`, `restore-plan`, `doctor` e `smoke`

### 2) SonarQube como stack separado

O SonarQube **não entra** no mesmo banco do produto nem no mesmo banco analítico do DevLake.

Separação recomendada:
- `cultivo-db`: banco transacional da aplicação
- `lake-db`: banco analítico do DevLake
- `sonar-db`: banco próprio do SonarQube

### 3) Grafana como código

A partir desta fase, a orientação é tratar provisioning do Grafana por arquivo versionado:
- datasources em `infra/grafana/provisioning/datasources`
- dashboards providers em `infra/grafana/provisioning/dashboards`
- dashboards JSON em `infra/grafana/dashboards`

## Fluxo recomendado daqui para frente

1. subir `observability`
2. rodar `validate-observability.sh`
3. rodar `doctor-observability.sh`
4. antes de upgrade, rodar `backup-devlake-db.sh`
5. conectar Jira/GitHub
6. somente depois avaliar quality stack com SonarQube

## Comandos úteis

```bash
bash infra/scripts/doctor-observability.sh
bash infra/scripts/smoke-observability.sh
bash infra/scripts/backup-devlake-db.sh
bash infra/scripts/check-quality-preflight.sh
bash infra/scripts/up-quality.sh
bash infra/scripts/down-quality.sh
```

## Regra de arquitetura que fica fixa

- não usar o banco do produto para DevLake
- não usar H2 do SonarQube fora de teste rápido
- não acoplar SonarQube ao stack do produto por conveniência
- não confiar em dashboard antes de validar semântica de coleta
