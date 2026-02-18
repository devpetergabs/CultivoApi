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

-- VEG Coco
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base nutricional vegetativa',
    estagio = 'VEGETATIVA',
    classe = 'BASE_NUTRICIONAL',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 1.0)
WHERE nome = 'VEG Coco';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'VEG Coco', 'Advanced Nutrients', 'Base nutricional vegetativa', 'VEGETATIVA', 'BASE_NUTRICIONAL', 1.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'VEG Coco');

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

-- FLOWER Coco
UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base nutricional de floração',
    estagio = 'FLORACAO',
    classe = 'BASE_NUTRICIONAL',
    ativo = TRUE,
    dose_padrao_em_ml = COALESCE(dose_padrao_em_ml, 1.5)
WHERE nome = 'FLOWER Coco';

INSERT INTO aditivos (nome, marca, descricao, estagio, classe, dose_padrao_em_ml, ativo)
SELECT 'FLOWER Coco', 'Advanced Nutrients', 'Base nutricional de floração', 'FLORACAO', 'BASE_NUTRICIONAL', 1.5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'FLOWER Coco');

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
    'VEG Coco',
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
UPDATE aditivos a
JOIN (
    SELECT nome, MIN(id) AS keep_id
    FROM aditivos
    GROUP BY nome
) k ON k.nome = a.nome
SET a.ativo = FALSE
WHERE a.id <> k.keep_id
  AND a.nome IN (
    'pH Perfect Bloom',
    'VEG Coco',
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