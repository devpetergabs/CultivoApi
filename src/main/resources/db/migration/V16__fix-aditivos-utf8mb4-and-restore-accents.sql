-- Ensure the `aditivos` table can store utf8mb4 characters (e.g. Portuguese accents)
-- and re-apply the catalog descriptions to restore any values previously stored with replacement characters (??).

ALTER TABLE aditivos
    CONVERT TO CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

-- Re-apply canonical catalog descriptions (accent-safe after table conversion)
UPDATE aditivos
SET descricao = 'Base completa de floração'
WHERE nome = 'pH Perfect Bloom';

UPDATE aditivos
SET descricao = 'Base nutricional de floração'
WHERE nome = 'FLOWER Coco';

UPDATE aditivos
SET descricao = 'Arranque de floração'
WHERE nome = 'Bud Ignitor';

UPDATE aditivos
SET descricao = 'Estimulante energético'
WHERE nome = 'Bud Candy';

UPDATE aditivos
SET descricao = 'Estímulo metabólico'
WHERE nome = 'Bud Factor X';

UPDATE aditivos
SET descricao = 'Estímulo geral'
WHERE nome = 'B-52';
