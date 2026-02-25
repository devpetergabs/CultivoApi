-- V24__insert_inseticida_e_rega_fev_2026.sql
-- Insere eventos para P1, P3, P4, P5, P6:
-- 18/02/2026 22:00 -> INSETICIDA (SPINOSAD 3 mL/L, 2 L => 6 mL)
-- 18/02/2026 22:30 -> REGA_NORMAL (água pura 1 L)
-- 22/02/2026 22:00 -> INSETICIDA (SPINOSAD 3 mL/L, 2 L => 6 mL)
-- 22/02/2026 22:30 -> REGA_NORMAL (água pura 1 L)

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

-- ===== 23/02/2026 - INSETICIDA 22:00 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'INSETICIDA',
  '2026-02-23 22:00:00',
  'SPINOSAD 3 mL/L | 2 L aplicados | Consumo total: 6 mL',
  6.0,
  CONCAT('seed:inseticida:spinosad:2026-02-23T22:00:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P3', 'P4', 'P5', 'P6');

-- ===== 23/02/2026 - REGA água pura 22:30 =====
INSERT INTO planta_eventos (planta_id, tipo, data_evento, descricao, dose_em_ml, idempotency_key)
SELECT
  p.id,
  'REGA_NORMAL',
  '2026-02-23 22:30:00',
  'Rega água pura | 1 L',
  NULL,
  CONCAT('seed:rega-agua:2026-02-23T22:30:', p.nome)
FROM plantas p
WHERE p.nome IN ('P1', 'P3', 'P4', 'P5', 'P6');