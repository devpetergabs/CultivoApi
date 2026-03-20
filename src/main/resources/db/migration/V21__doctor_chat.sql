CREATE TABLE doctor_chat_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT NOT NULL,
    planta_id BIGINT NOT NULL,
    titulo VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVA',
    conversation_summary TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_doctor_chat_session_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_chat_session_planta FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_doctor_chat_session_usuario_planta_status
    ON doctor_chat_sessions (usuario_id, planta_id, status, updated_at);

CREATE TABLE doctor_chat_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_doctor_chat_message_session FOREIGN KEY (session_id) REFERENCES doctor_chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_doctor_chat_message_session_created
    ON doctor_chat_messages (session_id, created_at);