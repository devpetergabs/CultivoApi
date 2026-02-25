-- Migration: Inserção das plantas P1, P3, P4, P5, P6 e eventos de crescimento

INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, data_sexagem, data_floracao, cultivador_id, data_criacao)
VALUES ('P1', 'Rubi OG Kush', 'VINTE_E_UM_L', '2025-09-23', 'FEMEA', 141, 72, 0, 'FLORACAO_MEDIA', '2025-12-03', '2026-01-09', 1, '2025-09-23');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P1'), 'CRESCIMENTO', '2025-12-14', '125cm ALT, 55cm LARG');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P1'), 'CRESCIMENTO', '2025-12-21', '141cm ALT, 72cm LARG');

INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, cultivador_id, data_criacao)
VALUES ('P3', 'Lemon Haze', 'VINTE_E_UM_L', '2025-11-18', 'FEMEA', 22, 18.5, 0, 'VEGETATIVO', 1, '2025-11-18');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P3'), 'CRESCIMENTO', '2025-12-14', '14cm ALT, 16cm LARG');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P3'), 'CRESCIMENTO', '2025-12-21', '22cm ALT, 18.5cm LARG');

INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, cultivador_id, data_criacao)
VALUES ('P4', 'Lemon Haze', 'VINTE_E_UM_L', '2025-11-18', 'FEMEA', 17, 16, 0, 'VEGETATIVO', 1, '2025-11-18');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P4'), 'CRESCIMENTO', '2025-12-14', '10cm ALT, 13.5cm LARG');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P4'), 'CRESCIMENTO', '2025-12-21', '17cm ALT, 16cm LARG');

INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, cultivador_id, data_criacao)
VALUES ('P5', 'Lemon Haze', 'VINTE_E_UM_L', '2025-11-18', 'FEMEA', 14, 12, 0, 'VEGETATIVO', 1, '2025-11-18');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P5'), 'CRESCIMENTO', '2025-12-14', '9cm ALT, 12cm LARG');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P5'), 'CRESCIMENTO', '2025-12-21', '14cm ALT, 12cm LARG');

INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, cultivador_id, data_criacao)
VALUES ('P6', 'Lemon Haze', 'VINTE_E_UM_L', '2025-11-18', 'FEMEA', 9, 9, 0, 'VEGETATIVO', 1, '2025-11-18');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P6'), 'CRESCIMENTO', '2025-12-14', '8cm ALT, 11cm LARG');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P6'), 'CRESCIMENTO', '2025-12-21', '9cm ALT, 9cm LARG');

-- Inserção da semente P7 e seus eventos com Timestamp exato
INSERT INTO plantas (nome, strain, tamanho_vaso, data_germinacao, sexo_planta, altura, largura, largura_caule, estagio, cultivador_id, data_criacao)
VALUES ('P7', 'Black-Berry Kush', 'VINTE_E_UM_L', '2026-02-23', 'FEMEA', 0, 0, 0, 'GERMINACAO', 1, '2026-02-23');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P7'), 'OBSERVACAO', '2026-02-24 08:40:00', 'Inserida para hidratação inicial no copo de germinação');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P7'), 'OBSERVACAO', '2026-02-24 23:50:00', 'A radícula está visível, indicando que a germinação está ocorrendo');