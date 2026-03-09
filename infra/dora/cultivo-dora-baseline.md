# Baseline DORA — Cultivo Inteligente

## Projeto DevLake
- **Nome**: `cultivo-engineering-pilot`
- **Objetivo**: representar o produto Cultivo Inteligente, não um time genérico

## Entidades do baseline

### 1. Changes
Entram como changes do produto:
- pull requests do backend
- pull requests do frontend
- commits vinculados a esses repositórios

Não entram:
- repositórios de laboratório
- assets isolados sem entrega de software
- playgrounds e spikes desconectados do produto

### 2. Deployments
Contam como deployment apenas workflows/jobs que:
- publicam imagem
- realizam deploy
- publicam release
- empurram artefato de entrega para ambiente real

Regex inicial sugerido:
- **Deployment**: `(?i).*(deploy|push-image|publish).*`
- **Production**: `(?i).*(prod|production|release).*`

### 3. Incidents
Contam como incidentes apenas itens Jira que:
- representam falha em produção
- exigem correção/reversão/restauração
- afetam estabilidade ou disponibilidade

Não contam:
- tarefas comuns
- estudos
- cards de documentação
- bugs de laboratório que nunca viraram incidente operacional

## Leitura correta do primeiro ciclo
Se o dashboard parecer bonito mas a semântica estiver errada, o dashboard está errado.
Primeiro valida definição. Depois confia no número.
