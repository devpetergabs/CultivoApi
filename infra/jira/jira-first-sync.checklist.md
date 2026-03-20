# Checklist — primeiro sync Jira no DevLake

## 1) Pré-flight do stack
- [ ] `bash scripts/up-observability.sh`
- [ ] `bash scripts/validate-observability.sh`
- [ ] Config UI abriu em `http://localhost:4000`
- [ ] Dashboards abriram em `http://localhost:3002`
- [ ] Swagger abriu em `http://localhost:4000/api/swagger/index.html`

## 2) Pré-flight do Jira
- [ ] domínio Jira validado
- [ ] endpoint termina com `/rest/`
- [ ] e-mail correto
- [ ] API token válido
- [ ] boardId principal identificado
- [ ] boardId secundário identificado, se houver

## 3) Criar conexão
- [ ] criar conexão `cultivo-jira`
- [ ] clicar em `Test Connection`
- [ ] salvar conexão somente se o teste passar
- [ ] adicionar 1 ou 2 boards, não mais do que isso no primeiro ciclo

## 4) Scope config mínimo
- [ ] Requirement definido, se o time usa tipo específico
- [ ] Bug definido
- [ ] Incident configurado somente se existir tipo confiável
- [ ] Epic Key validado
- [ ] evitar regex extra ou mapeamento inventado no primeiro ciclo

## 5) Criar projeto piloto
- [ ] criar projeto `cultivo-jira-pilot`
- [ ] associar conexão Jira
- [ ] selecionar apenas os boards piloto
- [ ] Data Time Range = 90 dias
- [ ] Sync Frequency = manual no primeiro teste
- [ ] Skip Failed Tasks = ligado

## 6) Rodar coleta
- [ ] executar `Collect Data`
- [ ] acompanhar `Status`
- [ ] se houver falha, baixar logs do pipeline
- [ ] rodar `bash scripts/capture-observability-evidence.sh`

## 7) Ler o resultado
- [ ] conferir se issues, bugs e epics aparecem no lake
- [ ] abrir dashboards no Grafana
- [ ] validar se a contagem geral de issues do board faz sentido
- [ ] validar se filtros por projeto/board fazem sentido

## 8) Critério de aprovação desta fatia
Considere esta fatia aprovada quando:
- [ ] o stack sobe sem erro
- [ ] a conexão Jira testa com sucesso
- [ ] o projeto piloto coleta sem falha crítica
- [ ] os dashboards mostram dados coerentes com o board

## 9) Sinais de que ainda não é hora de plugar GitHub
- [ ] board piloto não sincronizou
- [ ] tipos de issue ainda estão confusos
- [ ] incidência/bug não foi mapeada direito
- [ ] volume de dados já ficou ruidoso com só Jira
