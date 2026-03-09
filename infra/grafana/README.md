# Grafana — provisioning base

A partir desta fase, dashboards e datasources podem ser tratados como código.

Estrutura:
- `provisioning/datasources`: datasources provisionados
- `provisioning/dashboards`: providers de dashboards
- `dashboards`: JSONs exportados/versionados

## Uso recomendado

1. validar dashboards nativos do DevLake
2. criar dashboard custom só depois de entender as métricas
3. exportar JSON e versionar neste diretório

## Observação

Provisioning aceita variáveis de ambiente nos valores de configuração, o que ajuda a manter GitOps simples.
