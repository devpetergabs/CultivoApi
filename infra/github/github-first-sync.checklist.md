# Checklist — primeiro sync GitHub no DevLake

## 1. Pré-flight
- [ ] stack DevLake em pé
- [ ] `.env.observability` preenchido
- [ ] `bash scripts/check-github-preflight.sh` sem pendências críticas
- [ ] owner correto
- [ ] lista de repositórios correta

## 2. Conexão
- [ ] criar conexão `cultivo-github`
- [ ] testar conexão com sucesso
- [ ] salvar conexão

## 3. Scope
- [ ] adicionar somente os repositórios do produto
- [ ] evitar repositórios de estudo/rascunho/experimento

## 4. Scope config
- [ ] SCM ligado
- [ ] Code Review ligado
- [ ] CI/CD ligado
- [ ] deployment regex preenchido
- [ ] production regex preenchido
- [ ] GraphQL coerente com o tipo de token

## 5. Projeto
- [ ] usar projeto `cultivo-engineering-pilot`
- [ ] associar GitHub ao mesmo projeto dos boards Jira corretos
- [ ] janela inicial de 90 dias
- [ ] sync manual no primeiro teste
- [ ] skip failed tasks ligado

## 6. Critérios de aprovação
- [ ] PRs aparecem no escopo certo
- [ ] commits aparecem no escopo certo
- [ ] workflow runs de deploy foram reconhecidos
- [ ] produção não está contaminada por test/hml/dev
- [ ] o conjunto GitHub + Jira faz sentido como um único produto
