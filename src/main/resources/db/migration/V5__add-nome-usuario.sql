ALTER TABLE usuarios
    ADD COLUMN nome VARCHAR(100) NOT NULL DEFAULT '';

UPDATE usuarios
SET nome = login
WHERE nome = '';
