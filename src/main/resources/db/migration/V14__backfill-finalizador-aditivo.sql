-- Backfill FINALIZADOR classification for existing records.
-- Only updates rows that are currently NULL/OUTROS to avoid overriding manual classifications.

UPDATE aditivos
SET classe = 'FINALIZADOR'
WHERE (classe IS NULL OR classe = 'OUTROS')
  AND LOWER(CONCAT_WS(' ', nome, descricao)) REGEXP '(^|[^a-z])flush([^a-z]|$)|finish|finalizador|flawless';
