-- V7__estoque_por_cultivador.sql
-- Introduz estoque por cultivador (single source of truth) e remove o estoque global do catálogo.

CREATE TABLE cultivador_produtos_estoque (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cultivador_id BIGINT NOT NULL,
    produto_id BIGINT NOT NULL,
    tipo_produto VARCHAR(20) NOT NULL,
    stock_ml_atual DOUBLE PRECISION NOT NULL DEFAULT 0,
    unidades INT NOT NULL DEFAULT 0,
    ml_frasco INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_estoque_cultivador FOREIGN KEY (cultivador_id) REFERENCES cultivadores(id) ON DELETE CASCADE,
    CONSTRAINT fk_estoque_produto FOREIGN KEY (produto_id) REFERENCES aditivos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_estoque_cult_prod (cultivador_id, produto_id),
    INDEX idx_estoque_cultivador (cultivador_id),
    INDEX idx_estoque_tipo (tipo_produto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Backfill: migra o estoque antigo (global) para o primeiro cultivador cadastrado,
-- mas APENAS onde havia estoque > 0. (Itens sem estoque ficam "não rastreados".)
INSERT INTO cultivador_produtos_estoque (cultivador_id, produto_id, tipo_produto, stock_ml_atual, unidades, ml_frasco)
SELECT
    (SELECT id FROM cultivadores ORDER BY id LIMIT 1) AS cultivador_id,
    a.id AS produto_id,
    a.tipo AS tipo_produto,
    a.estoque_ml AS stock_ml_atual,
    0 AS unidades,
    0 AS ml_frasco
FROM aditivos a
WHERE a.estoque_ml > 0;

-- Remove a coluna antiga do catálogo (evita duas verdades).
ALTER TABLE aditivos DROP COLUMN estoque_ml;
