CREATE TABLE planta_eventos_planejados (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    tratamento_id BIGINT NOT NULL,
    tipo VARCHAR(40) NOT NULL,

    round_index INT NOT NULL,
    scheduled_at DATETIME NOT NULL,

    status VARCHAR(20) NOT NULL,
    executed_at DATETIME NULL,
    evento_execucao_id BIGINT NULL,

    dose_em_ml DOUBLE PRECISION NULL,

    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_planejado_planta FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE CASCADE,
    CONSTRAINT fk_planejado_tratamento FOREIGN KEY (tratamento_id) REFERENCES planta_tratamentos(id) ON DELETE CASCADE,
    CONSTRAINT fk_planejado_evento_exec FOREIGN KEY (evento_execucao_id) REFERENCES planta_eventos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX uk_planejado_tratamento_round
    ON planta_eventos_planejados (tratamento_id, tipo, round_index);

CREATE INDEX idx_planejado_planta_status
    ON planta_eventos_planejados (planta_id, status);

CREATE INDEX idx_planejado_schedule
    ON planta_eventos_planejados (scheduled_at);
