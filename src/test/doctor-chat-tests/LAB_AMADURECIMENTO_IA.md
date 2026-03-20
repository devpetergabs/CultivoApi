# Laboratório de Amadurecimento da IA (Doctor Chat)

## Objetivo

Documentar a execução dos testes prioritários do **Doctor Chat** e acompanhar a evolução de estabilidade, roteamento e qualidade de resposta.

## Comando oficial de execução (Newman)

```bash
newman run doctor-chat-priority12.postman_collection.json -e doctor-chat-local.postman_environment.json -r "cli,json" --reporter-json-export reports/doctor-chat-report.json
```

> Execute este comando a partir de `src/test/doctor-chat-tests`.

## Pré-requisitos

1. Backend da API rodando em `http://localhost:8080`.
2. Arquivo `doctor-chat-local.postman_environment.json` preenchido corretamente.
3. Newman instalado (`newman --version` OK).
4. Pasta de saída de relatório existente:

```bash
mkdir -p reports
```

No PowerShell:

```powershell
New-Item -ItemType Directory -Force reports
```

## Estado atual do laboratório (07/03/2026)

Com base na última execução compartilhada:

- **Collection:** `Doctor Chat - Priority 12 Validation`
- **Executado com sucesso:**
  - `00 - Reset session` ✅
  - `P01 - o que é tripes?` ✅
- **Ponto de interrupção/instabilidade observado:**
  - `P02 - quais são os sinais de tripes na planta?` ⚠️
  - Saída exibida incompleta durante a chamada `POST /doctor/session/messages`.

## Leitura técnica do momento

O laboratório está em fase de **amadurecimento inicial** com os primeiros cenários funcionando, porém ainda com indício de instabilidade de fluxo no cenário `P02` (execução não finalizada no log compartilhado).

Isso indica que o pipeline básico está operacional (reset + resposta inicial), mas a robustez de continuidade ainda precisa ser consolidada.

## Critérios de amadurecimento (Priority 12)

Para considerar a suíte estabilizada:

- 12/12 cenários finalizando sem interrupção.
- 0 erro HTTP 5xx.
- tempo de resposta por request < 60s.
- parse JSON válido em todos os retornos com body.
- consistência conversacional nos prompts sequenciais.

## Próximos passos recomendados

1. Reexecutar a suíte completa e confirmar se `P02` falha de forma reprodutível.
2. Abrir `reports/doctor-chat-report.json` e registrar:
   - status por request,
   - tempo por request,
   - falha exata (timeout, assert, payload, autenticação etc.).
3. Se `P02` continuar falhando, testar isoladamente o endpoint com payload equivalente.
4. Após correção, rodar novamente a `Priority_12` e comparar com baseline anterior.

## Comandos úteis

Executar script shell:

```bash
bash run-newman.sh
```

Executar direto no Windows PowerShell (sem `.sh`):

```powershell
newman run doctor-chat-priority12.postman_collection.json -e doctor-chat-local.postman_environment.json -r "cli,json" --reporter-json-export reports/doctor-chat-report.json
```
