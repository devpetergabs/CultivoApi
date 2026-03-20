-- =========================
-- USER: knd
-- =========================
INSERT INTO usuarios (nome, login, senha, role)
SELECT 'knd', 'knd@gmail.com.br', '$2b$10$Owj3gWSRSazlcOUL2zpULeBQkhFhEweL4zivCOGxWF8K6oPolQLCa', 'ROLE_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE login = 'knd@gmail.com.br');

INSERT INTO cultivadores (usuario_id, telefone, ativo)
SELECT id, '', TRUE
FROM usuarios
WHERE login = 'knd@gmail.com.br'
  AND NOT EXISTS (SELECT 1 FROM cultivadores WHERE usuario_id = (SELECT id FROM usuarios WHERE login = 'knd@gmail.com.br'));
