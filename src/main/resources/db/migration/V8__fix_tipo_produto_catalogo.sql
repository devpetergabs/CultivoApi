-- V8__fix_tipo_produto_catalogo.sql
-- Hardening: garante que itens especiais não apareçam como ADITIVO no inventário de mix.
-- (Ambientes antigos podem ter rows criadas antes do campo `tipo` existir ou antes das seeds novas.)

-- Spinosad deve ser INSETICIDA e classe PROTECAO.
UPDATE aditivos
SET tipo = 'INSETICIDA',
    classe = 'PROTECAO'
WHERE LOWER(nome) = 'spinosad'
  AND (tipo IS NULL OR tipo = '' OR tipo = 'ADITIVO');

-- Vasos devem ser VASO e não devem ter dose (ml/L).
UPDATE aditivos
SET tipo = 'VASO',
    dose_padrao_em_ml = NULL
WHERE LOWER(nome) LIKE 'vaso %'
  AND (tipo IS NULL OR tipo = '' OR tipo = 'ADITIVO');

-- Sincroniza o tipo do estoque com o tipo do catálogo (quando houver divergência).
UPDATE cultivador_produtos_estoque e
JOIN aditivos a ON a.id = e.produto_id
SET e.tipo_produto = a.tipo
WHERE e.tipo_produto <> a.tipo;
