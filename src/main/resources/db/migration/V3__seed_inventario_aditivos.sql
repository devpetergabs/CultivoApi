-- V3__seed_inventario_aditivos.sql

-- Upsert requested additive catalog entries (idempotent).
-- Notes:
-- - `estagio` here refers to EstagioAditivo (VEGETATIVA | FLORACAO | FINALIZACAO)
-- - `classe` refers to ClasseAditivo (BASE_NUTRICIONAL | BOOSTER | ESTIMULANTE | FORTIFICANTE | FINALIZADOR | ...)
-- - This migration also consolidates duplicates created by earlier seed scripts by:
--   1) Repointing `planta_aditivos.aditivo_id` to the smallest id per name (for the catalog names only)
--   2) Deactivating the duplicate rows (ativo=false)

-- ========== BASE NUTRICIONAL ==========

-- pH Perfect Bloom
UPDATE aditivos

SET marca = 'Advanced Nutrients',
    descricao = 'Base completa de floração',
    estagio = 'FLORACAO',
    classe = 'BASE_NUTRICIONAL',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 5.0)
WHERE nome = 'pH Perfect Bloom';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'pH Perfect Bloom', 'Advanced Nutrients', 'Base completa de floração', 'FLORACAO', 'BASE_NUTRICIONAL', 5.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'pH Perfect Bloom');

-- Veg Coco Grow
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base nutricional vegetativa',
    estagio = 'VEGETATIVA',
    classe = 'BASE_NUTRICIONAL',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 1.0)
WHERE nome = 'Veg Coco Grow';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)

SELECT 'Veg Coco Grow', 'Advanced Nutrients', 'Base nutricional vegetativa', 'VEGETATIVA', 'BASE_NUTRICIONAL', 1.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Veg Coco Grow');

-- Sensi Grow Part A
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base A do vegetativo',
    estagio = 'VEGETATIVA',
    classe = 'BASE_NUTRICIONAL',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 2.0)
WHERE nome = 'Sensi Grow Part A';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Sensi Grow Part A', 'Advanced Nutrients', 'Base A do vegetativo', 'VEGETATIVA', 'BASE_NUTRICIONAL', 2.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Sensi Grow Part A');

-- Sensi Grow Part B
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base B do vegetativo',
    estagio = 'VEGETATIVA',
    classe = 'BASE_NUTRICIONAL',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 2.0)
WHERE nome = 'Sensi Grow Part B';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Sensi Grow Part B', 'Advanced Nutrients', 'Base B do vegetativo', 'VEGETATIVA', 'BASE_NUTRICIONAL', 2.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Sensi Grow Part B');

-- Sensi Bloom Part A
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base A da floração',
    estagio = 'FLORACAO',
    classe = 'BASE_NUTRICIONAL',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 2.0)
WHERE nome = 'Sensi Bloom Part A';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Sensi Bloom Part A', 'Advanced Nutrients', 'Base A da floração', 'FLORACAO', 'BASE_NUTRICIONAL', 2.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Sensi Bloom Part A');

-- Sensi Bloom Part B
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base B da floração',
    estagio = 'FLORACAO',
    classe = 'BASE_NUTRICIONAL',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 2.0)
WHERE nome = 'Sensi Bloom Part B';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Sensi Bloom Part B', 'Advanced Nutrients', 'Base B da floração', 'FLORACAO', 'BASE_NUTRICIONAL', 2.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Sensi Bloom Part B');

-- ========== BOOSTERS ==========

-- Big Bud
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Booster de engorda',
    estagio = 'FLORACAO',
    classe = 'BOOSTER',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 2.0)
WHERE nome = 'Big Bud';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Big Bud', 'Advanced Nutrients', 'Booster de engorda', 'FLORACAO', 'BOOSTER', 2.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Big Bud');

-- Bud Ignitor
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Arranque de floração',
    estagio = 'FLORACAO',
    classe = 'BOOSTER',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 1.2)
WHERE nome = 'Bud Ignitor';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Bud Ignitor', 'Advanced Nutrients', 'Arranque de floração', 'FLORACAO', 'BOOSTER', 1.2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Bud Ignitor');

-- Overdrive
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Booster final',
    estagio = 'FLORACAO',
    classe = 'BOOSTER',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 1.5)
WHERE nome = 'Overdrive';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Overdrive', 'Advanced Nutrients', 'Booster final', 'FLORACAO', 'BOOSTER', 1.5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Overdrive');

-- Hammerhead
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Booster estrutural',
    estagio = 'FLORACAO',
    classe = 'BOOSTER',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 1.5)
WHERE nome = 'Hammerhead';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Hammerhead', 'Advanced Nutrients', 'Booster estrutural', 'FLORACAO', 'BOOSTER', 1.5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Hammerhead');

-- Bloom Booster
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Booster genérico',
    estagio = 'FLORACAO',
    classe = 'BOOSTER',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 1.0)
WHERE nome = 'Bloom Booster';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Bloom Booster', 'Advanced Nutrients', 'Booster genérico', 'FLORACAO', 'BOOSTER', 1.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Bloom Booster');

-- ========== ESTIMULANTES ==========

-- Bud Candy
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Estimulante energético',
    estagio = 'FLORACAO',
    classe = 'ESTIMULANTE',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 3.0)
WHERE nome = 'Bud Candy';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Bud Candy', 'Advanced Nutrients', 'Estimulante energético', 'FLORACAO', 'ESTIMULANTE', 3.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Bud Candy');

-- Bud Factor X
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Estímulo metabólico',
    estagio = 'FLORACAO',
    classe = 'ESTIMULANTE',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 2.0)
WHERE nome = 'Bud Factor X';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Bud Factor X', 'Advanced Nutrients', 'Estímulo metabólico', 'FLORACAO', 'ESTIMULANTE', 2.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Bud Factor X');

-- Tasty Terpenes
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Aroma e perfil',
    estagio = 'FLORACAO',
    classe = 'ESTIMULANTE',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 2.0)
WHERE nome = 'Tasty Terpenes';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Tasty Terpenes', 'Advanced Nutrients', 'Aroma e perfil', 'FLORACAO', 'ESTIMULANTE', 2.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Tasty Terpenes');

-- B-52 (user listed PRE_FLORACAO; mapped to VEGETATIVA in current model)
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Estímulo geral',
    estagio = 'VEGETATIVA',
    classe = 'ESTIMULANTE',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 0.5)
WHERE nome = 'B-52';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'B-52', 'Advanced Nutrients', 'Estímulo geral', 'VEGETATIVA', 'ESTIMULANTE', 0.5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'B-52');

-- ========== FORTIFICANTES ==========

-- Rhino Skin
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Fortalece estrutura',
    estagio = 'VEGETATIVA',
    classe = 'FORTIFICANTE',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 0.8)
WHERE nome = 'Rhino Skin';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Rhino Skin', 'Advanced Nutrients', 'Fortalece estrutura', 'VEGETATIVA', 'FORTIFICANTE', 0.8, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Rhino Skin');

-- ========== FINALIZADORES ==========

-- Flawless Finish
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Flush final',
    estagio = 'FINALIZACAO',
    classe = 'FINALIZADOR',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 2.0)
WHERE nome = 'Flawless Finish';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Flawless Finish', 'Advanced Nutrients', 'Flush final', 'FINALIZACAO', 'FINALIZADOR', 2.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Flawless Finish');


-- ========== Consolidate duplicates for these catalog names ==========

-- Repoint plant-aditive relations to the smallest id per name (catalog names only)
UPDATE planta_aditivos pa
JOIN aditivos a ON a.id = pa.aditivo_id
JOIN (
    SELECT nome, MIN(id) AS keep_id
    FROM aditivos
    GROUP BY nome
) k ON k.nome = a.nome
SET pa.aditivo_id = k.keep_id
WHERE pa.aditivo_id <> k.keep_id
  AND a.nome IN (
    'pH Perfect Bloom',
    'Veg Coco Grow',
    'Sensi Grow Part A',
    'Sensi Grow Part B',
    'FLOWER Coco',
    'Sensi Bloom Part A',
    'Sensi Bloom Part B',
    'Big Bud',
    'Bud Ignitor',
    'Overdrive',
    'Hammerhead',
    'Bloom Booster',
    'Bud Candy',
    'Bud Factor X',
    'Tasty Terpenes',
    'B-52',
    'Rhino Skin',
    'Flawless Finish'
  );

-- Deactivate duplicates (keep the smallest id active as-is; deactivate the rest)

UPDATE aditivos
SET ativo = FALSE
WHERE id IN (
    SELECT * FROM (
        SELECT a1.id
        FROM aditivos a1
        JOIN (
            SELECT nome, MIN(id) AS keep_id
            FROM aditivos
            GROUP BY nome
        ) k ON k.nome = a1.nome
        WHERE a1.id <> k.keep_id
          AND a1.nome IN (
            'pH Perfect Bloom',
            'Veg Coco Grow',
            'Sensi Grow Part A',
            'Sensi Grow Part B',
            'FLOWER Coco',
            'Sensi Bloom Part A',
            'Sensi Bloom Part B',
            'Big Bud',
            'Bud Ignitor',
            'Overdrive',
            'Hammerhead',
            'Bloom Booster',
            'Bud Candy',
            'Bud Factor X',
            'Tasty Terpenes',
            'B-52',
            'Rhino Skin',
            'Flawless Finish'
          )
    ) AS sub
);

-- Connoisseur Grow A
INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Connoisseur Grow A', 'Advanced Nutrients',
  'Parte A do sistema Connoisseur Grow. Fórmula premium com micronutrientes e quelatos avançados para máximo desempenho na fase vegetativa.',
  'VEGETATIVA', 'BASE_NUTRICIONAL', 4.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Connoisseur Grow A');

-- Connoisseur Grow B
INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Connoisseur Grow B', 'Advanced Nutrients',
  'Parte B do sistema Connoisseur Grow. Complementa a Parte A fornecendo fósforo, potássio e micronutrientes balanceados para crescimento vigoroso.',
  'VEGETATIVA', 'BASE_NUTRICIONAL', 1.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Connoisseur Grow B');

-- Connoisseur Bloom A
INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Connoisseur Bloom A', 'Advanced Nutrients',
  'Parte A do sistema Connoisseur Bloom. Desenvolvido para suportar a fase de floração com base mineral e micronutrientes de alta disponibilidade.',
  'FLORACAO', 'BASE_NUTRICIONAL', 4.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Connoisseur Bloom A');

-- Connoisseur Bloom B
INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'Connoisseur Bloom B', 'Advanced Nutrients',
  'Parte B do sistema Connoisseur Bloom. Complementa a Parte A fornecendo fósforo e potássio em proporções ideais para formação de flores densas e resinosas.',
  'FLORACAO', 'BASE_NUTRICIONAL', 1.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Connoisseur Bloom B');

-- Backfill FINALIZADOR classification for existing records.
-- Only updates rows that are currently NULL/OUTROS to avoid overriding manual classifications.

UPDATE aditivos
SET classe = 'FINALIZADOR'
WHERE (classe IS NULL OR classe = 'OUTROS')
  AND LOWER(CONCAT_WS(' ', nome, descricao)) REGEXP '(^|[^a-z])flush([^a-z]|$)|finish|finalizador|flawless';

-- Restore canonical catalog descriptions with proper accents.
-- Some earlier migrations may have stored '?' placeholders depending on connection/session encoding at the time.
-- This migration is idempotent and simply re-applies the expected descriptions.

UPDATE aditivos SET descricao = 'Base completa de floração' WHERE nome = 'pH Perfect Bloom';
UPDATE aditivos SET descricao = 'Base nutricional de floração' WHERE nome = 'FLOWER Coco';

UPDATE aditivos SET descricao = 'Arranque de floração' WHERE nome = 'Bud Ignitor';
UPDATE aditivos SET descricao = 'Booster genérico' WHERE nome = 'Bloom Booster';
UPDATE aditivos SET descricao = 'Booster de engorda' WHERE nome = 'Big Bud';
UPDATE aditivos SET descricao = 'Booster final' WHERE nome = 'Overdrive';
UPDATE aditivos SET descricao = 'Booster estrutural' WHERE nome = 'Hammerhead';

UPDATE aditivos SET descricao = 'Estímulo metabólico' WHERE nome = 'Bud Factor X';
UPDATE aditivos SET descricao = 'Estimulante energético' WHERE nome = 'Bud Candy';
UPDATE aditivos SET descricao = 'Aroma e perfil' WHERE nome = 'Tasty Terpenes';
UPDATE aditivos SET descricao = 'Estímulo geral' WHERE nome = 'B-52';

UPDATE aditivos SET descricao = 'Base A da floração' WHERE nome = 'Sensi Bloom Part A';
UPDATE aditivos SET descricao = 'Base B da floração' WHERE nome = 'Sensi Bloom Part B';
UPDATE aditivos SET descricao = 'Base A do vegetativo' WHERE nome = 'Sensi Grow Part A';
UPDATE aditivos SET descricao = 'Base B do vegetativo' WHERE nome = 'Sensi Grow Part B';
UPDATE aditivos SET descricao = 'Base nutricional vegetativa' WHERE nome = 'Veg Coco Grow';

UPDATE aditivos SET descricao = 'Fortalece estrutura' WHERE nome = 'Rhino Skin';
UPDATE aditivos SET descricao = 'Flush final' WHERE nome = 'Flawless Finish';

UPDATE aditivos
SET descricao = 'Potencializador de densidade de flores na finalização'
WHERE nome = 'Benzinga';

-- =========================
-- Complementos de inventário (PROTECAO/INSETICIDA + VASOS) + backfills
-- =========================

-- Regra de classificação (fallback) para qualquer item sem classe.
UPDATE aditivos
SET classe = (
    CASE
        WHEN LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%a+b%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%a + b%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%part a%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%part b%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%base%'
        THEN 'BASE_NUTRICIONAL'

        WHEN LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%silica%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%silício%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%silicio%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%fortificante%'
        THEN 'FORTIFICANTE'

        WHEN LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%candy%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%sweet%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%carbo%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%melassa%'
        THEN 'ESTIMULANTE'

        WHEN LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%big bud%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%bloom booster%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%booster%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%pk%'
        THEN 'BOOSTER'

        WHEN LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%spinosad%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%neem%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%inseticida%'
          OR LOWER(CONCAT_WS(' ', nome, descricao)) LIKE '%fungicida%'
        THEN 'PROTECAO'

        ELSE 'OUTROS'
    END
)
WHERE classe IS NULL;

-- Upsert Spinosad (inventário)
UPDATE aditivos
SET marca = 'Corteva Agriscience',
    descricao = 'Inseticida (classe PROTECAO) à base de Spinosad (spinosyns A + D), derivado de fermentação de Saccharopolyspora spinosa. IRAC Group 5 (Spinosyns). Use conforme rótulo do fabricante e boas práticas de segurança.',
    classe = 'PROTECAO',
    tipo = 'INSETICIDA',
    ativo = TRUE,
    dose_padrao_em_ml = 3.0,
    estoque_ml = 90.0,
    rounds_recomendados = 6,
    descanso_dias_recomendados = 4
WHERE nome = 'Spinosad';

INSERT INTO aditivos (nome, marca, descricao, classe, tipo, dose_padrao_em_ml, estoque_ml, rounds_recomendados, descanso_dias_recomendados, ativo)
SELECT
    'Spinosad',
    'Corteva Agriscience',
    'Inseticida (classe PROTECAO) à base de Spinosad (spinosyns A + D), derivado de fermentação de Saccharopolyspora spinosa. IRAC Group 5 (Spinosyns). Use conforme rótulo do fabricante e boas práticas de segurança.',
    'PROTECAO',
    'INSETICIDA',
    3.0,
    90.0,
    6,
    4,
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Spinosad');

-- Backfill: qualquer PROTECAO vira INSETICIDA (se ainda não estiver).
UPDATE aditivos
SET tipo = 'INSETICIDA'
WHERE classe = 'PROTECAO'
  AND (tipo IS NULL OR tipo = '' OR tipo = 'ADITIVO');

-- Backfill: itens não-PROTECAO ficam como ADITIVO quando tipo vazio.
UPDATE aditivos
SET tipo = 'ADITIVO'
WHERE (tipo IS NULL OR tipo = '')
  AND (classe IS NULL OR classe <> 'PROTECAO');

-- Catálogo mínimo de vasos (equipamento) - capacidades reais do seu cultivo.
INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, estoque_ml, ativo, tipo, capacidade_litros)
SELECT 'Vaso 5L', 'Genérico', 'Vaso (equipamento) de 5 litros. Base do early game.', NULL, 'OUTROS', NULL, 0.0, TRUE, 'VASO', 5
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Vaso 5L');

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, estoque_ml, ativo, tipo, capacidade_litros)
SELECT 'Vaso 21L', 'Genérico', 'Vaso (equipamento) de 21 litros. Mid game outdoor.', NULL, 'OUTROS', NULL, 0.0, TRUE, 'VASO', 21
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Vaso 21L');

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, estoque_ml, ativo, tipo, capacidade_litros)
SELECT 'Vaso 30L', 'Genérico', 'Vaso (equipamento) de 30 litros. Late game outdoor.', NULL, 'OUTROS', NULL, 0.0, TRUE, 'VASO', 30
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Vaso 30L');
