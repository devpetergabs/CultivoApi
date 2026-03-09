# Planejamento — expansão do Doctor P. para Extração e Finalização

## Objetivo
Adicionar `extracao` e `finalizacao` como temas de primeira classe no ecossistema de conhecimento do Doctor P., deixando a base preparada para roteamento, grounding, prompting e QA sem depender de heurística frágil ou memória acidental.

## Princípios
- A mensagem atual vence a memória quando trouxer entidade, estágio ou objetivo explícito.
- `finalizacao` e `extracao` são temas próximos, mas não equivalentes.
- `the-bible` continua como âncora fisiológica geral, mas não deve engolir fontes temáticas específicas.
- Em curiosidade e definição, a resposta deve ser curta e focada.
- Em recomendação operacional, o sistema deve explicar trade-off e risco antes da ação.

## Taxonomia recomendada
Temas primários:
- `pragas_manejo`
- `nutricao_fertilizacao`
- `arquitetura_poda_treinamento`
- `ciclos_fotoperiodo`
- `finalizacao`
- `extracao`

Temas secundários de apoio:
- `fisiologia`
- `manejo_operacional`
- `janela_colheita`
- `pos_colheita`

## Regras de roteamento
### Finalização
Entrar em `finalizacao` quando a pergunta mencionar, por exemplo:
- finalização
- reta final
- pré-colheita
- colheita
- tricomas
- tricomas leitosos
- tricomas âmbar
- janela de colheita
- flush
- terminar a flora
- posso pulverizar agora no fim?

### Extração
Entrar em `extracao` quando a pergunta mencionar objetivo pós-colheita ou tipo de extração:
- extração
- extract
- hash
- bubble hash
- dry sift
- rosin
- live resin
- preservar terpenos
- colher pensando em extração
- janela para resina

### Override semântico
Se a mensagem atual trouxer uma entidade nova explícita, um objetivo final novo ou um estágio novo, isso substitui o item equivalente vindo da memória recente.

Exemplos:
- antes: praga; agora: "tricomas leitosos com alguns âmbar" -> tema atual passa a ser `finalizacao`
- antes: finalização; agora: "quero colher pensando em live resin" -> tema atual passa a ser `extracao`

## Source pinning
### Finalização
Prioridade de fontes:
1. `fontes/finalizacao/*`
2. `fontes/the-bible.pdf`
3. `fontes/extracao/*` quando a pergunta mencionar destino da colheita

### Extração
Prioridade de fontes:
1. `fontes/extracao/*`
2. `fontes/finalizacao/*`
3. `fontes/the-bible.pdf`

## Query builder
### Finalização
Preferir consultas curtas e focadas:
- `finalizacao cannabis tricomas janela de colheita`
- `harvest maturity trichomes cannabis`
- `pre harvest cannabis trichome amber cloudy`

### Extração
Preferir consultas curtas e focadas:
- `cannabis extraction harvest timing live resin`
- `hash harvest window resin maturity`
- `terpene preservation harvest timing cannabis extraction`

## Prompting
Novos arquivos:
- `modo-finalizacao.md`
- `modo-extracao.md`

Regras adicionais:
- Em `finalizacao`, responder leitura de maturação e cautela de manejo tardio.
- Em `extracao`, responder orientado ao objetivo final sem confundir com colheita genérica.
- Em ambos, citar `the-bible` como base fisiológica quando realmente agregar.

## QA mínimo
### Finalização
- `tricomas leitosos com alguns âmbar, já colho?`
- `o que muda da flora avançada para finalização?`
- `posso pulverizar agora na finalização?`

### Extração
- `quero colher pensando em live resin`
- `para hash, a janela muda?`
- `extração muda a leitura do ponto de colheita?`

### Regras de aceite
- Pergunta de finalização não pode cair em pragas.
- Pergunta de extração não pode virar resposta genérica de colheita.
- Quando houver objetivo explícito de extração, ele deve aparecer na resposta.
- Quando houver leitura explícita de tricomas, isso deve aparecer na resposta.

## Ordem de implementação recomendada
1. Criar/organizar pastas e documentação temática.
2. Criar os modos de prompt de `finalizacao` e `extracao`.
3. Atualizar guardrails e regras do prompt principal.
4. Implementar source pinning e query builder por tema.
5. Adicionar suíte QA semântica para os novos casos.
