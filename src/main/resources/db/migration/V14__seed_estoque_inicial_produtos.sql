-- V14__seed_estoque_inicial_produtos.sql
-- Aplica estoque inicial informado para produtos selecionados no inventário por cultivador (Gabriel).
-- Regras:
-- 1) Garante linhas faltantes no estoque para os produtos alvo
-- 2) Atualiza valores apenas quando o item ainda estiver zerado (não sobrescreve estoque já movimentado)

-- 1) Garante existência de linhas de estoque para o cultivador Gabriel e produtos alvo
INSERT INTO cultivador_produtos_estoque (cultivador_id, produto_id, tipo_produto, stock_ml_atual, unidades, ml_frasco)
SELECT
    c.id AS cultivador_id,
    a.id AS produto_id,
    COALESCE(a.tipo, 'OUTRO') AS tipo_produto,
    CASE a.nome
        WHEN 'Big Bud' THEN 100
        WHEN 'Overdrive' THEN 500
        WHEN 'Bud Candy' THEN 900
        WHEN 'B-52' THEN 900
        WHEN 'Rhino Skin' THEN 150
        WHEN 'Flawless Finish' THEN 1000
        WHEN 'Connoisseur Grow A' THEN 900
        WHEN 'Connoisseur Grow B' THEN 900
        WHEN 'Connoisseur Bloom A' THEN 900
        WHEN 'Connoisseur Bloom B' THEN 900
        WHEN 'Spinosad' THEN 150
        ELSE 0
    END AS stock_ml_atual,
    1 AS unidades,
    CASE a.nome
        WHEN 'Big Bud' THEN 100
        WHEN 'Overdrive' THEN 500
        WHEN 'Bud Candy' THEN 1000
        WHEN 'B-52' THEN 1000
        WHEN 'Rhino Skin' THEN 250
        WHEN 'Flawless Finish' THEN 1000
        WHEN 'Connoisseur Grow A' THEN 1000
        WHEN 'Connoisseur Grow B' THEN 1000
        WHEN 'Connoisseur Bloom A' THEN 1000
        WHEN 'Connoisseur Bloom B' THEN 1000
        WHEN 'Spinosad' THEN 250
        ELSE 0
    END AS ml_frasco
FROM cultivadores c
JOIN usuarios u ON u.id = c.usuario_id
JOIN aditivos a ON a.nome IN (
    'Big Bud',
    'Overdrive',
    'Bud Candy',
    'B-52',
    'Rhino Skin',
    'Flawless Finish',
    'Connoisseur Grow A',
    'Connoisseur Grow B',
    'Connoisseur Bloom A',
    'Connoisseur Bloom B',
    'Spinosad'
)
WHERE u.login = 'gabriel.dev420@gmail.com'
    AND NOT EXISTS (
    SELECT 1
    FROM cultivador_produtos_estoque e
    WHERE e.cultivador_id = c.id
      AND e.produto_id = a.id
);

-- 2) Atualiza somente registros ainda zerados
UPDATE cultivador_produtos_estoque e
JOIN aditivos a ON a.id = e.produto_id
JOIN cultivadores c ON c.id = e.cultivador_id
JOIN usuarios u ON u.id = c.usuario_id
SET
    e.stock_ml_atual = CASE a.nome
        WHEN 'Big Bud' THEN 100
        WHEN 'Overdrive' THEN 500
        WHEN 'Bud Candy' THEN 900
        WHEN 'B-52' THEN 900
        WHEN 'Rhino Skin' THEN 150
        WHEN 'Flawless Finish' THEN 1000
        WHEN 'Connoisseur Grow A' THEN 900
        WHEN 'Connoisseur Grow B' THEN 900
        WHEN 'Connoisseur Bloom A' THEN 900
        WHEN 'Connoisseur Bloom B' THEN 900
        WHEN 'Spinosad' THEN 150
        ELSE e.stock_ml_atual
    END,
    e.unidades = CASE a.nome
        WHEN 'Big Bud' THEN 1
        WHEN 'Overdrive' THEN 1
        WHEN 'Bud Candy' THEN 1
        WHEN 'B-52' THEN 1
        WHEN 'Rhino Skin' THEN 1
        WHEN 'Flawless Finish' THEN 1
        WHEN 'Connoisseur Grow A' THEN 1
        WHEN 'Connoisseur Grow B' THEN 1
        WHEN 'Connoisseur Bloom A' THEN 1
        WHEN 'Connoisseur Bloom B' THEN 1
        WHEN 'Spinosad' THEN 1
        ELSE e.unidades
    END,
    e.ml_frasco = CASE a.nome
        WHEN 'Big Bud' THEN 100
        WHEN 'Overdrive' THEN 500
        WHEN 'Bud Candy' THEN 1000
        WHEN 'B-52' THEN 1000
        WHEN 'Rhino Skin' THEN 250
        WHEN 'Flawless Finish' THEN 1000
        WHEN 'Connoisseur Grow A' THEN 1000
        WHEN 'Connoisseur Grow B' THEN 1000
        WHEN 'Connoisseur Bloom A' THEN 1000
        WHEN 'Connoisseur Bloom B' THEN 1000
        WHEN 'Spinosad' THEN 250
        ELSE e.ml_frasco
    END
WHERE a.nome IN (
    'Big Bud',
    'Overdrive',
    'Bud Candy',
    'B-52',
    'Rhino Skin',
    'Flawless Finish',
    'Connoisseur Grow A',
    'Connoisseur Grow B',
    'Connoisseur Bloom A',
    'Connoisseur Bloom B',
    'Spinosad'
)
    AND u.login = 'gabriel.dev420@gmail.com'
  AND COALESCE(e.stock_ml_atual, 0) = 0
  AND COALESCE(e.unidades, 0) = 0
  AND COALESCE(e.ml_frasco, 0) = 0;
