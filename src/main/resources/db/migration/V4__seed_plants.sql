-- V4__seed_plantas.sql
-- Insere P1, P4, P5, P6, P7.

-- Resolve cultivador_id pelo login
SET @cultivador_admin := (
    SELECT c.id
    FROM cultivadores c
    JOIN usuarios u ON u.id = c.usuario_id
    WHERE u.login = 'gabriel.dev420@gmail.com'
    LIMIT 1
);

-- Fallback para primeiro cultivador disponível
SET @cultivador_admin := COALESCE(
    @cultivador_admin,
    (SELECT id FROM cultivadores ORDER BY id LIMIT 1)
);

-- ===== PLANTAS =====

INSERT INTO plantas
(nome, strain, tamanho_vaso, data_germinacao, sexo_planta,
 altura, largura, largura_caule, estagio,
 data_sexagem, data_floracao,
 cultivador_id, data_criacao)
VALUES
('P1', 'Rubi OG Kush', 'VINTE_E_UM_L', '2025-09-23', 'FEMEA',
 141, 72, 0, 'FLORACAO_MEDIA',
 '2025-12-03', '2026-01-09',
 @cultivador_admin, '2025-09-23');


INSERT INTO plantas
(nome, strain, tamanho_vaso, data_germinacao, sexo_planta,
 altura, largura, largura_caule, estagio,
 cultivador_id, data_criacao)
VALUES
('P4', 'Lemon Haze', 'VINTE_E_UM_L', '2025-11-18', 'FEMEA',
 17, 16, 0, 'VEGETATIVO',
 @cultivador_admin, '2025-11-18');

INSERT INTO plantas
(nome, strain, tamanho_vaso, data_germinacao, sexo_planta,
 altura, largura, largura_caule, estagio,
 cultivador_id, data_criacao)
VALUES
('P5', 'Lemon Haze', 'VINTE_E_UM_L', '2025-11-18', 'FEMEA',
 14, 12, 0, 'VEGETATIVO',
 @cultivador_admin, '2025-11-18');


INSERT INTO plantas
(nome, strain, tamanho_vaso, data_germinacao, sexo_planta,
 altura, largura, largura_caule, estagio,
 cultivador_id, data_criacao)
VALUES
('P7', 'Gorila Z - Auto', 'VINTE_E_UM_L', '2026-02-25', 'FEMEA',
 0, 0, 0, 'GERMINACAO',
 @cultivador_admin, '2026-02-26');

 INSERT INTO plantas
(nome, strain, tamanho_vaso, data_germinacao, sexo_planta,
 altura, largura, largura_caule, estagio,
 cultivador_id, data_criacao)
VALUES
('P8', 'Black-Berry Kush', 'VINTE_E_UM_L', '2026-02-27', 'FEMEA',
 0, 0, 0, 'GERMINACAO',
 @cultivador_admin, '2026-02-27');