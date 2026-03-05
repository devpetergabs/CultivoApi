-- =========================
-- USER: bia
-- =========================
INSERT INTO usuarios (nome, login, senha, role)
SELECT 'bia', 'bia420@gmail.com', '$2b$10$kjGDYL4BPwQaBb7lUKWE4OTHUdaW9mjchMByTqvwfu4iuU/R8UDl.', 'ROLE_USER'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE login = 'bia420@gmail.com');

INSERT INTO cultivadores (usuario_id, telefone, ativo)
SELECT id, '', TRUE
FROM usuarios
WHERE login = 'bia420@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM cultivadores WHERE usuario_id = (SELECT id FROM usuarios WHERE login = 'bia420@gmail.com'));
