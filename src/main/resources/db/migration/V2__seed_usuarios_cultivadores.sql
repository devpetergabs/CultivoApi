-- V2__seed_usuarios_cultivadores.sql
-- Seed mínimo: usuário admin + cultivador.

INSERT INTO usuarios (nome, login, senha, role)
SELECT 'Gabriel', 'gabriel', '$2a$10$ejc97ZARmMKUyZ2xu/Ei8.dl.v8znMoTzN.ekcDMfnHZKFdF/3xle', 'ROLE_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE login = 'gabriel');

UPDATE usuarios
SET nome = 'Gabriel', role = 'ROLE_ADMIN'
WHERE login = 'gabriel';

INSERT INTO cultivadores (usuario_id, telefone, ativo)
SELECT u.id, NULL, TRUE
FROM usuarios u
WHERE u.login = 'gabriel'
  AND NOT EXISTS (SELECT 1 FROM cultivadores c WHERE c.usuario_id = u.id);
