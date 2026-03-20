ALTER TABLE plantas
    ADD COLUMN tipo_ciclo VARCHAR(30) NOT NULL DEFAULT 'NAO_DEFINIDO' AFTER especie,
    ADD COLUMN genetica VARCHAR(30) NOT NULL DEFAULT 'NAO_DEFINIDO' AFTER tipo_ciclo;

UPDATE plantas
SET tipo_ciclo = COALESCE(tipo_ciclo, 'NAO_DEFINIDO'),
    genetica = COALESCE(genetica, 'NAO_DEFINIDO');