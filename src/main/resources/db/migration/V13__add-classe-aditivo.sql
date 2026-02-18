ALTER TABLE aditivos
    ADD COLUMN classe VARCHAR(50);

-- Backfill existing records using simple keyword matching.
-- Note: matching depends on MySQL collation/charset; we include both accented and unaccented keywords.
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