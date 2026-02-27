-- V9__hardening_estoque_seed_zero.sql
-- Hardening do estoque por cultivador:
-- 1) Corrige possíveis NULLs herdados de bancos antigos
-- 2) Reforça NOT NULL + DEFAULT 0
-- 3) Garante que TODO produto do catálogo exista no estoque do cultivador com 0 (zera geral no bootstrap)

-- 1) Corrige NULLs (bancos antigos / volumes sujos)
UPDATE cultivador_produtos_estoque SET stock_ml_atual = 0 WHERE stock_ml_atual IS NULL;
UPDATE cultivador_produtos_estoque SET unidades = 0 WHERE unidades IS NULL;
UPDATE cultivador_produtos_estoque SET ml_frasco = 0 WHERE ml_frasco IS NULL;
UPDATE cultivador_produtos_estoque SET tipo_produto = 'OUTRO' WHERE tipo_produto IS NULL OR tipo_produto = '';

-- 2) Reforça constraints (idempotente: re-aplicar o mesmo MODIFY é seguro)
ALTER TABLE cultivador_produtos_estoque
  MODIFY stock_ml_atual DOUBLE PRECISION NOT NULL DEFAULT 0,
  MODIFY unidades INT NOT NULL DEFAULT 0,
  MODIFY ml_frasco INT NOT NULL DEFAULT 0,
  MODIFY tipo_produto VARCHAR(20) NOT NULL;

-- 3) Seed: cria linhas faltantes com 0 para todos os produtos e cultivadores.
-- Isso elimina o estado "--" no inventário e deixa o jogo começar SEM estoque (0).
INSERT INTO cultivador_produtos_estoque (cultivador_id, produto_id, tipo_produto, stock_ml_atual, unidades, ml_frasco)
SELECT
    c.id AS cultivador_id,
    a.id AS produto_id,
    COALESCE(a.tipo, 'OUTRO') AS tipo_produto,
    0 AS stock_ml_atual,
    0 AS unidades,
    0 AS ml_frasco
FROM cultivadores c
CROSS JOIN aditivos a
WHERE NOT EXISTS (
    SELECT 1
    FROM cultivador_produtos_estoque e
    WHERE e.cultivador_id = c.id
      AND e.produto_id = a.id
);
