ALTER TABLE aditivos ADD COLUMN dose_min_em_ml DOUBLE NULL;
ALTER TABLE aditivos ADD COLUMN dose_max_em_ml DOUBLE NULL;
ALTER TABLE aditivos ADD COLUMN pragas_efetivas VARCHAR(255) NULL;

UPDATE aditivos
SET dose_min_em_ml = 1.0,
    dose_max_em_ml = 5.0,
    pragas_efetivas = 'TRIPES,LAGARTAS,PULGOES'
WHERE nome = 'Spinosad';