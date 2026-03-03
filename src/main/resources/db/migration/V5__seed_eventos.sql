-- V5__seed_eventos.sql
-- Eventos de crescimento (V19) + inseticida/rega (V24) + observações P7.

-- Crescimento P1
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P1'), 'CRESCIMENTO', '2025-12-14', '125cm ALT, 55cm LARG');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P1'), 'CRESCIMENTO', '2025-12-21', '141cm ALT, 72cm LARG');

-- Crescimento P4
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P4'), 'CRESCIMENTO', '2025-12-14', '10cm ALT, 13.5cm LARG');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P4'), 'CRESCIMENTO', '2025-12-21', '17cm ALT, 16cm LARG');

-- Crescimento P5
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P5'), 'CRESCIMENTO', '2025-12-14', '9cm ALT, 12cm LARG');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P5'), 'CRESCIMENTO', '2025-12-21', '14cm ALT, 12cm LARG');

-- Observações P7
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P7'), 'OBSERVACAO', '2026-02-25 08:20:00', 'Inserida para hidratação inicial no copo de germinação');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P7'), 'OBSERVACAO', '2026-02-25 21:20:00', 'Inserida no papel toalha para germinação');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P7'), 'OBSERVACAO', '2026-02-27 22:20:00', 'Foi feito a preparação do vaso com substrato preparado( perlita, arroz carbonizado, humus, terra adubada) escoamento com argila expandida e vaso ativado com 2l agua');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P7'), 'OBSERVACAO', '2026-02-27 22:25:00', 'planta colocada no vaso e regada com 500ml de agua com 1ml de b52 da advanced nutrients');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P7'), 'OBSERVACAO', '2026-03-01 22:00:00', 'A plantula perfurou o solo e esta em formato de U invertido, com as folhas ainda fechadas, mas já é possível ver a cor verde');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P7'), 'OBSERVACAO', '2026-03-01 22:00:00', 'A plantula esta vigoroza e firme com verde vibrante e as folhas abertas, mostrando o inicio do crescimento das folhas serrilhadas.');

-- Observações P8
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P8'), 'OBSERVACAO', '2026-02-27 09:20:00', 'Inserida para hidratação inicial no copo de germinação'); 

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P8'), 'OBSERVACAO', '2026-02-27 21:20:00', 'Inserida no papel toalha para germinação');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P8'), 'OBSERVACAO', '2026-03-01 22:20:00', 'Foi feito a preparação do vaso com substrato preparado( perlita, arroz carbonizado, humus, terra adubada) escoamento com argila expandida e vaso ativado com 2l agua');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P8'), 'OBSERVACAO', '2026-03-01 22:25:00', 'planta colocada no vaso regado com 1l de agua com 1ml de b52 e Rhino da advanced nutrients');

INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao)
VALUES ((SELECT id FROM plantas WHERE nome = 'P8'), 'OBSERVACAO', '2026-03-02 22:00:00', 'A plantula segue no vaso com copo plastico fazendo de estufa e thermohigrometro com 99% de umidade e temperatura de 25 graus');


-- ===== 18/02/2026 - INSETICIDA 22:00 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'INSETICIDA',
  '2026-02-18 22:00:00',
  'SPINOSAD 3 mL/L | 2 L aplicados | Consumo total: 6 mL',
  6.0,
  CONCAT('seed:inseticida:spinosad:2026-02-18T22:00:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P3', 'P4', 'P5', 'P6');

-- ===== 18/02/2026 - REGA água pura 22:30 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'REGA_NORMAL',
  '2026-02-18 22:30:00',
  'Rega água pura | 1 L',
  NULL,
  CONCAT('seed:rega-agua:2026-02-18T22:30:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P3', 'P4', 'P5', 'P6');

-- ===== 22/02/2026 - INSETICIDA 22:00 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'INSETICIDA',
  '2026-02-22 22:00:00',
  'SPINOSAD 3 mL/L | 2 L aplicados | Consumo total: 6 mL',
  6.0,
  CONCAT('seed:inseticida:spinosad:2026-02-22T22:00:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P4', 'P5');


-- ===== 22/02/2026 - REGA água pura 22:30 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'REGA_NORMAL',
  '2026-02-22 22:30:00',
  'Rega água pura | 1 L',
  NULL,
  CONCAT('seed:rega-agua:2026-02-22T22:30:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P4', 'P5');

-- ===== 26/02/2026 - INSETICIDA 22:00 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'INSETICIDA',
  '2026-02-26 23:00:00',
  'SPINOSAD 3 mL/L | 2 L aplicados | Consumo total: 6 mL',
  6.0,
  CONCAT('seed:inseticida:spinosad:2026-02-26T23:00:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P4', 'P5');

-- ===== 26/02/2026 - REGA água pura 22:30 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'REGA_NORMAL',
  '2026-02-26 22:30:00',
  'Rega água pura | 1 L',
  NULL,
  CONCAT('seed:rega-agua:2026-02-26T22:30:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P4', 'P5');

-- ===== 02/03/2026 - INSETICIDA 22:00 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'INSETICIDA',
  '2026-03-02 22:00:00',
  'SPINOSAD 3 mL/L | 2 L aplicados | Consumo total: 6 mL',
  6.0,
  CONCAT('seed:inseticida:spinosad:2026-03-02T22:00:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P4', 'P5');

-- ===== 02/03/2026 - REGA água pura 22:30 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'REGA_NORMAL',
  '2026-03-02 22:30:00',
  'Rega água pura | 1 L',
  NULL,
  CONCAT('seed:rega-agua:2026-03-02T22:30:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P4', 'P5');


