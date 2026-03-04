# Migrations limpas (Flyway)

Este pacote consolida as migrations antigas em um baseline limpo:

- V1__schema.sql: cria todas as tabelas já no estado final
- V2__seed_usuarios_cultivadores.sql: seed do usuário/cultivador
- V3__seed_inventario_aditivos.sql: seed do catálogo/inventário (aditivos/inseticida/vasos)
- V4__seed_plantas.sql: seed das plantas (P1..P7)
- V5__seed_eventos.sql: seed dos eventos (crescimento + inseticida/rega + observações)
- V6__seed_equipamentos.sql: backfill do vaso como equipamento (slot POT)

⚠️ Observação: esse baseline é para **subir banco do zero** (DB limpo). Se você já tem flyway_schema_history em produção,
você teria que criar um baseline/repair, ou recriar o banco.
