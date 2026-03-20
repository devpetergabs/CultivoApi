# Doctor Chat Test Package

Pacote completo de testes do **Doctor Chat** para ficar versionado dentro do projeto em:

```text
src/test/doctor-chat-test
```

Gerado em: **07/03/2026 16:26**

## Objetivo

Este diretório concentra o material para validar e amadurecer o comportamento do chat em 6 frentes:

1. roteamento por intenção
2. seleção de fontes
3. uso correto de contexto
4. continuidade conversacional
5. segurança operacional
6. qualidade factual da resposta

## Estrutura do pacote

- `README.md` → visão geral e passo a passo
- `API_RUNBOOK.md` → endpoints, payloads e estratégia de execução
- `DOCS_DOMAIN_MAP.md` → mapeamento entre cenários e fontes do repositório `docs/`
- `LAB_AMADURECIMENTO_IA.md` → status do laboratório, comando oficial do Newman e critérios de estabilização
- `doctor_chat_test_suite_complete.xlsx` → planilha principal
- `doctor_chat_test_suite_master.csv` → suíte completa em CSV
- `doctor_chat_test_suite_priority12.csv` → 12 cenários prioritários
- `doctor_chat_failure_codes.csv` → catálogo de falhas
- `doctor-chat-priority12.postman_collection.json` → coleção Postman/Newman
- `doctor-chat-local.postman_environment.template.json` → template de environment
- `doctor-chat-priority12.http` → suíte para REST Client no VS Code
- `doctor-chat-priority12-data.csv` → apoio rápido para execução dos 12 prioritários
- `run-newman.sh` → runner simples para Linux/macOS/WSL
- `run-newman.cmd` → runner simples para Windows

## Base técnica usada

### Endpoints reais do backend
O pacote foi alinhado ao controller real do projeto:

- `POST /plantas/{plantaId}/doctor/session`
- `GET /plantas/{plantaId}/doctor/session`
- `POST /plantas/{plantaId}/doctor/session/messages`
- `POST /plantas/{plantaId}/doctor/session/reset`

Controller de referência:

```text
src/main/java/cultivo/api/api/controller/planta/DoctorPlantController.java
```

### Modos aceitos
Derivados do enum real:

- `AUTO`
- `CONHECIMENTO_GERAL`
- `AVALIACAO_BASICA`
- `AVALIACAO_TECNICA`
- `PRAGA`

Enum de referência:

```text
src/main/java/cultivo/api/application/ai/DoctorChatMode.java
```

## Onde salvar

Coloque exatamente esta pasta em:

```text
src/test/doctor-chat-test
```

### Por que aqui?
Porque este material:
- não é teste unitário JUnit clássico
- não deve ficar misturado com `src/test/java`
- precisa ficar versionado junto do backend
- pode evoluir depois para execução automatizada no CI

## Fluxo recomendado de uso

### 1. Ajustar credenciais e planta
Abra o arquivo:

```text
doctor-chat-local.postman_environment.template.json
```

Preencha:
- `baseUrl`
- `plantaId`
- `username`
- `password`

### 2. Rodar primeiro os 12 prioritários
Eles cobrem rapidamente:
- definição
- follow-up
- identificação visual
- diagnóstico geral
- manejo
- segurança em flora avançada
- leitura de estágio
- triagem ambígua
- memória conversacional

### 3. Registrar o resultado
Use a planilha principal:

```text
doctor_chat_test_suite_complete.xlsx
```

Campos mínimos para preencher:
- `Status_execucao`
- `Intencao_detectada`
- `Contexto_detectado`
- `Modo_usado`
- `Top_ref`
- `Grounding`
- `Resposta_correta`
- `Alucinacao`
- `Herdou_contexto`
- `Travou_timeout`
- `Acao_segura`
- `Observacao`

### 4. Classificar a falha
Use:

```text
doctor_chat_failure_codes.csv
```

Exemplos:
- `I-01` → intenção errada
- `M-01` → perdeu memória conversacional
- `F-01` → erro factual
- `T-01` → timeout/travamento
- `G-02` → top ref baixo com tom assertivo

### 5. Refinar por tipo de problema
Depois de cada rodada, separar em 3 listas:
- falhas de classificação
- falhas de conhecimento / grounding
- falhas de engenharia / timeout / contexto excessivo

## Ordem recomendada da primeira rodada

1. `o que é tripes?`
2. `quais são os sinais de tripes na planta?`
3. `como identificar tripes olhando a folha?`
4. `qual a diferença entre tripes e ácaros?`
5. `minha planta está com pontinhos claros nas folhas`
6. `tem raspagem prateada e pontinhos escuros`
7. `como tratar tripes?`
8. `posso pulverizar agora na flora avançada?`
9. `já é hora de colher?`
10. `tricomas leitosos com alguns âmbar, já colho?`
11. `minha planta tá ruim`
12. sequência:
   - `o que é tripes?`
   - `como tratar?`

## Critério sugerido de aprovação

- intenção detectada: **>= 85%**
- contexto correto: **>= 80%**
- resposta factual correta: **>= 80%**
- continuidade conversacional: **>= 75%**
- segurança operacional: **>= 95%**
- zero travamentos nos cenários críticos

## Sinais vermelhos imediatos

Se acontecer qualquer um desses, já vale abrir ajuste:

- pergunta conceitual caindo em pipeline clínico
- resposta com fato básico errado
- follow-up perdendo o assunto
- top ref baixo com tom assertivo
- recomendação perigosa sem checar estágio
- travamento em prompt híbrido

## Próximo passo ideal

Depois desta base consolidada, o caminho natural é automatizar o `Priority_12` em CI com Newman e depois expandir para a suíte master.
