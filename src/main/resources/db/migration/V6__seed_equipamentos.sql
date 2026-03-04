-- V6__seed_equipamentos.sql
-- Backfill: para cada planta existente, cria o equipamento POT com base no tamanho_vaso atual.
-- Mapeamento:
--   CINCO_L -> 5
--   VINTE_E_UM_L -> 21
--   TRINTA_L -> 30

INSERT INTO planta_equipamentos (planta_id, slot, aditivo_id, cor_hex, skin_id, apelido)
SELECT
    p.id AS planta_id,
    'POT' AS slot,
    a.id AS aditivo_id,
    NULL AS cor_hex,
    NULL AS skin_id,
    NULL AS apelido
FROM plantas p
JOIN aditivos a
    ON a.tipo = 'VASO'
   AND a.capacidade_litros = (
       CASE p.tamanho_vaso
           WHEN 'CINCO_L' THEN 5
           WHEN 'VINTE_E_UM_L' THEN 21
           WHEN 'TRINTA_L' THEN 30
           ELSE NULL
       END
   )
LEFT JOIN planta_equipamentos pe
    ON pe.planta_id = p.id AND pe.slot = 'POT'
WHERE pe.id IS NULL
  AND p.tamanho_vaso IS NOT NULL;
