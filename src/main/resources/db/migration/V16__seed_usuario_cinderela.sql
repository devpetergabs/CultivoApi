-- =========================
-- ADMIN: cinderela
-- =========================
INSERT INTO usuarios (nome, login, senha, role)
SELECT 'cinderela', 'cinderela420@gmail.com', '$2b$10$DqO7zugDCQXk7v/JphrJC.NZRQsiKcNmR/TVC7SjzhV34sndycKQu', 'ROLE_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE login = 'cinderela420@gmail.com');

INSERT INTO cultivadores (usuario_id, telefone, ativo)
SELECT id, '', TRUE
FROM usuarios
WHERE login = 'cinderela420@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM cultivadores WHERE usuario_id = (SELECT id FROM usuarios WHERE login = 'cinderela420@gmail.com'));
