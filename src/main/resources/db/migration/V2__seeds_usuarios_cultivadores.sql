-- =========================
-- ADMIN: Bruna Moura
-- =========================
INSERT INTO usuarios (nome, login, senha, role)
SELECT 'Bruna Moura', 'bruna.smoura02@hotmail.com', '$2b$10$REex2vCPUMAo8HnoH7BY3OzE./0idrOsED0PbX.wntY7HcWA6cfim', 'ROLE_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE login = 'bruna.smoura02@hotmail.com');

INSERT INTO cultivadores (usuario_id, telefone, ativo)
SELECT id, '11 91401-7979', TRUE
FROM usuarios 
WHERE login = 'bruna.smoura02@hotmail.com'
  AND NOT EXISTS (SELECT 1 FROM cultivadores WHERE usuario_id = (SELECT id FROM usuarios WHERE login = 'bruna.smoura02@hotmail.com'));


INSERT INTO usuarios (nome, login, senha, role)
SELECT 'Gabriel', 'gabriel.dev420@gmail.com', '$2b$10$REex2vCPUMAo8HnoH7BY3OzE./0idrOsED0PbX.wntY7HcWA6cfim', 'ROLE_USER'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE login = 'gabriel.dev420@gmail.com');

INSERT INTO cultivadores (usuario_id, telefone, ativo)
SELECT id, '11 94543-3507', TRUE
FROM usuarios 
WHERE login = 'gabriel.dev420@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM cultivadores WHERE usuario_id = (SELECT id FROM usuarios WHERE login = 'gabriel.dev420@gmail.com'));