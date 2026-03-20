# Checklist — primeira leitura de DORA

## Pré-condições
- projeto DevLake criado
- Jira conectado
- GitHub conectado
- regex de deployment definido com base em workflows reais

## Validação semântica
- o projeto contém apenas os repositórios do produto?
- o Jira contém boards/issues que representam incidentes reais?
- o deployment regex captura somente jobs de entrega?
- o production regex exclui hml/staging/test?

## Validação dos dados
- existem deployments nos últimos 90 dias?
- existem pull requests e commits no mesmo período?
- existem incidentes ou bugs operacionais que façam sentido para o produto?

## Sinais de erro clássico
- deployment frequency zerada mesmo com releases reais
- deployment frequency alta demais por capturar build/test
- change failure rate artificial por classificar bug comum como incidente
- lead time estranho por projeto com repositório errado ou escopo lateral

## Saída esperada
Ao final da primeira leitura você deve conseguir responder, em linguagem simples:
- o projeto está entregando com que frequência?
- estamos olhando produção de verdade ou um ambiente intermediário?
- os números parecem coerentes com o que você vive no dia a dia?
