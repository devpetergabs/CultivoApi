# DOCS Domain Map — Doctor Chat

Este arquivo ajuda a conectar os cenários de teste com as fontes reais já presentes no repositório `docs/`.

## Base geral
- `docs/ai/doctor-plant/referencial/fontes/the-bible.pdf`

Uso esperado:
- apoio conceitual amplo
- fallback técnico
- não deve dominar sozinho casos operacionais

## Pragas e manejo
- `docs/ai/doctor-plant/referencial/fontes/pragas_manejo/pt-guia_rapido_pragas_cannabis.txt`
- `docs/ai/doctor-plant/referencial/fontes/pragas_manejo/pt-acaro-rajado.pdf`
- `docs/ai/doctor-plant/referencial/fontes/pragas_manejo/pt-embrapa_controle_alternativo_de_pragas_e_fitopatogenos.pdf`
- `docs/ai/doctor-plant/referencial/fontes/pragas_manejo/en-biopesticides_against_arthropod_pests_of_cannabis_in_northeastern_oregon.pdf`
- `docs/ai/doctor-plant/referencial/fontes/pragas_manejo/en-sustainable_management_strategies_for_acarine_pests_of_industrial_hemp.pdf`

Cenários mais ligados:
- `o que é tripes?`
- `quais são os sinais de tripes na planta?`
- `como identificar tripes olhando a folha?`
- `qual a diferença entre tripes e ácaros?`
- `como tratar tripes?`
- `posso pulverizar agora na flora avançada?`

## Nutrição e fertilização
- `docs/ai/doctor-plant/referencial/fontes/nutricao_fertilizacao/...`

Cenários mais ligados:
- pH, EC, pontas queimadas, lockout, excesso, deficiência

## Arquitetura, poda e treinamento
- `docs/ai/doctor-plant/referencial/fontes/arquitetura_poda_treinamento/...`

Cenários mais ligados:
- topping em automática
- manejo estrutural
- resposta a poda/treinamento

## Ciclos e fotoperíodo
- `docs/ai/doctor-plant/referencial/fontes/ciclos_fotoperiodo/...`

Cenários mais ligados:
- leitura de estágio
- transição vegetativo → pré-flora → flora

## Extração / colheita / maturação
- `docs/ai/doctor-plant/referencial/fontes/extracao/...`

Cenários mais ligados:
- `já é hora de colher?`
- `tricomas leitosos com alguns âmbar, já colho?`

## Prompts de referência
- `docs/ai/doctor-plant/referencial/prompt/doctor-prompt.md`
- `docs/ai/doctor-plant/referencial/prompt/guardrails.md`
- `docs/ai/doctor-plant/referencial/prompt/modo-avaliacao-basica.md`
- `docs/ai/doctor-plant/referencial/prompt/modo-avaliacao-tecnica.md`
- `docs/ai/doctor-plant/referencial/prompt/modo-conhecimento-geral.md`
- `docs/ai/doctor-plant/referencial/prompt/modo-cross-module.md`
- `docs/ai/doctor-plant/referencial/prompt/modo-praga.md`

## Regra prática de leitura

### Se o erro for factual
Olhar primeiro:
- fontes da pasta do domínio
- `the-bible.pdf`
- prompt do modo usado

### Se o erro for de intenção
Olhar primeiro:
- `doctor-prompt.md`
- `guardrails.md`
- prompt do modo correspondente
- classificador e heurística no backend

### Se o erro for de follow-up
Olhar primeiro:
- memória conversacional
- última entidade ativa
- última intenção ativa

### Se o erro for de travamento
Olhar primeiro:
- prompt final enviado
- quantidade de contexto
- cross-module excessivo
- timeout do pipeline
