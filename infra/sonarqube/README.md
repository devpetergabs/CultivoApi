# SonarQube — base de expansão

Esta stack é opcional e separada do produto e do DevLake.

## Por que separado

- quality analysis tem ciclo e storage próprios
- SonarQube não deve usar H2 fora de teste rápido
- SonarQube com Docker deve ser configurado preferencialmente por environment variables

## Subida local

```bash
cp infra/.env.observability.example infra/.env.observability
bash infra/scripts/check-quality-preflight.sh
bash infra/scripts/up-quality.sh
```

Acesso esperado:
- SonarQube: `http://127.0.0.1:9000`

## Próximo passo depois da subida

1. criar projeto local de teste
2. gerar token técnico
3. integrar primeiro scanner do backend
4. só depois integrar frontend

## Regra prática

Não misturar a primeira implantação de SonarQube com a primeira calibração de DORA. São trilhas diferentes.
