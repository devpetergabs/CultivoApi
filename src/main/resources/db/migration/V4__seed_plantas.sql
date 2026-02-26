-- V4__seed_plantas.sql
-- Insere P1, P3, P4, P5, P6, P7.

-- Resolve cultivador_id pelo login (evita depender de id=1).
SET @cultivador_gabriel := (
    SELECT c.id
    FROM cultivadores c
    JOIN usuarios u ON u.id = c.usuario_id
    WHERE u.login = 'gabriel'
    LIMIT 1
);

-- Fallback: se por algum motivo o login não existir (ambiente diferente),
-- usa o primeiro cultivador disponível para não quebrar o seed.
SET @cultivador_gabriel := COALESCE(
    @cultivador_gabriel,
    (SELECT id FROM cultivadores ORDER BY id LIMIT 1)
);

INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, data_sexagem, data_floracao, cultivador_id, data_criacao)
VALUES ('P1', 'Rubi OG Kush', 'VINTE_E_UM_L', '2025-09-23', 'FEMEA', 141, 72, 0, 'FLORACAO_MEDIA', '2025-12-03', '2026-01-09', 1, '2025-09-23');


INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, cultivador_id, data_criacao)
VALUES ('P4', 'Lemon Haze', 'VINTE_E_UM_L', '2025-11-18', 'FEMEA', 17, 16, 0, 'VEGETATIVO', 1, '2025-11-18');

INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, cultivador_id, data_criacao)
VALUES ('P5', 'Lemon Haze', 'VINTE_E_UM_L', '2025-11-18', 'FEMEA', 14, 12, 0, 'VEGETATIVO', 1, '2025-11-18');

INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, cultivador_id, data_criacao)
VALUES ('P6', 'Lemon Haze', 'VINTE_E_UM_L', '2025-11-18', 'FEMEA', 9, 9, 0, 'VEGETATIVO', 1, '2025-11-18');

INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, cultivador_id, data_criacao)
VALUES ('P7', 'Black-Berry Kush', 'VINTE_E_UM_L', '2026-02-23', 'FEMEA', 0, 0, 0, 'GERMINACAO', 1, '2026-02-23');
