# GitHub Actions → Deployments reais do Cultivo

## Objetivo
Transformar o GitHub Actions em uma fonte de `deployments` coerente para DORA.

## O que conta como deployment neste projeto
Conte como deployment apenas jobs/runs que realmente façam uma destas ações:
- publicar imagem
- publicar release
- promover aplicação para ambiente
- atualizar serviço em ambiente executável
- enviar artefato de entrega para um ambiente real

## O que não conta
Não conte como deployment:
- build isolado
- testes
- lint
- análise estática
- geração de artefato sem promoção de ambiente
- validações locais de PR

## Estratégia operacional
1. Inventariar workflows e jobs existentes.
2. Classificar cada job como:
   - `validation`
   - `package`
   - `deploy-nonprod`
   - `deploy-prod`
3. Validar se o regex proposto captura só `deploy-*`.
4. Levar o regex final para o DevLake.

## Arquivos desta pasta
- `cultivo-workflow-inventory.template.md`: planilha textual para registrar workflows reais
- `cultivo-workflow-mapping.sample.yml`: modelo de decisão final

## Regra de ouro
Se o workflow tiver nome genérico como `ci`, `pipeline`, `build-and-deploy`, não use regex amplo sem antes olhar os **jobs internos**.
