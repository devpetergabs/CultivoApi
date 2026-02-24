-- V20__upgrade_planta_eventos_for_game.sql
ALTER TABLE planta_eventos
  ADD COLUMN correlation_id VARCHAR(64) NULL,
  ADD COLUMN idempotency_key VARCHAR(80) NULL,
  ADD COLUMN payload_json JSON NULL,
  ADD COLUMN deleted_at DATETIME NULL,
  ADD COLUMN deleted_reason VARCHAR(255) NULL;

CREATE INDEX idx_event_correlation ON planta_eventos (planta_id, correlation_id);
CREATE UNIQUE INDEX uk_event_idempotency ON planta_eventos (planta_id, idempotency_key);