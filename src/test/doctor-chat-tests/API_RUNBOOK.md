# API Runbook — Doctor Chat

## Base URL sugerida
```text
http://localhost:8080/api
```

## Endpoints reais

### Criar ou reutilizar sessão
```http
POST /plantas/{plantaId}/doctor/session
```

### Ler sessão ativa
```http
GET /plantas/{plantaId}/doctor/session
```

### Enviar mensagem
```http
POST /plantas/{plantaId}/doctor/session/messages
```

### Resetar sessão
```http
POST /plantas/{plantaId}/doctor/session/reset
```

## Payload padrão
```json
{
  "mensagem": "o que é tripes?",
  "modo": "AUTO"
}
```

## Modos aceitos
- `AUTO`
- `CONHECIMENTO_GERAL`
- `AVALIACAO_BASICA`
- `AVALIACAO_TECNICA`
- `PRAGA`

## Estratégia recomendada de execução

Para cada cenário relevante:
1. resetar a sessão
2. mandar o prompt em `AUTO`
3. observar metadata e resposta
4. repetir forçando modo, se quiser comparar classificador vs pipeline

## O que observar no retorno
Registrar, quando disponível:
- intenção detectada
- confiança de roteamento
- motivo
- sinais disparadores
- escopo de contexto
- grounding
- top ref
- módulo dominante
- fontes usadas
- resposta final

## Exemplo cURL — reset
```bash
curl -X POST "http://localhost:8080/api/plantas/1/doctor/session/reset" ^
  -u "usuario:senha"
```

## Exemplo cURL — definição
```bash
curl -X POST "http://localhost:8080/api/plantas/1/doctor/session/messages" ^
  -u "usuario:senha" ^
  -H "Content-Type: application/json" ^
  -d "{\"mensagem\":\"o que é tripes?\",\"modo\":\"AUTO\"}"
```

## Exemplo cURL — diagnóstico especializado
```bash
curl -X POST "http://localhost:8080/api/plantas/1/doctor/session/messages" ^
  -u "usuario:senha" ^
  -H "Content-Type: application/json" ^
  -d "{\"mensagem\":\"ph 6.9, ec 2.2, pontas queimadas e crescimento travado\",\"modo\":\"AUTO\"}"
```

## Ordem sugerida de validação
1. definição
2. definição com follow-up
3. diagnóstico geral
4. diagnóstico especializado
5. manejo
6. leitura de estágio
7. triagem ambígua
8. segurança operacional

## Diagnóstico rápido do erro
- mesma intenção errada em vários prompts → problema no classificador
- intenção certa mas resposta errada → problema de retrieval/síntese
- follow-up falhando → problema de memória conversacional
- travando em prompts híbridos → problema de engenharia/prompt pesado/timeout
