-- V1__schema.sql
-- Baseline schema consolidado (substitui V1..V29).
-- MySQL 8.x / InnoDB / utf8mb4

CREATE TABLE usuarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    login VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL DEFAULT '',
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cultivadores (
    id BIGINT NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT NOT NULL UNIQUE,
    telefone VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT fk_cultivadores_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE aditivos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    marca VARCHAR(255) NOT NULL,
    descricao TEXT,
    dose_padrao_em_ml DOUBLE PRECISION,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    -- evolução do catálogo/inventário
    estagio VARCHAR(50),
    classe VARCHAR(50),
    estoque_ml DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- tudo vira "produto" (mesma tabela por enquanto)
    tipo VARCHAR(20) NOT NULL DEFAULT 'ADITIVO', -- ADITIVO | INSETICIDA | VASO
    capacidade_litros INT NULL,                 -- para VASO
    rounds_recomendados INT NULL,               -- para INSETICIDA
    descanso_dias_recomendados INT NULL,        -- para INSETICIDA

    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE plantas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cultivador_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    strain VARCHAR(255),
    especie VARCHAR(30) NOT NULL DEFAULT 'CANNABIS',

    data_germinacao DATE,
    altura DOUBLE PRECISION,
    largura DOUBLE PRECISION,
    largura_caule DOUBLE PRECISION,

    tamanho_vaso VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao DATE NOT NULL,

    -- evolução
    estagio VARCHAR(50),
    sexo_planta VARCHAR(50),
    data_sexagem DATE,
    data_floracao DATE,

    -- RPG
    level INT NOT NULL DEFAULT 1,
    xp INT NOT NULL DEFAULT 0,
    pontos_disponiveis INT NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_plantas_cultivador
        FOREIGN KEY (cultivador_id) REFERENCES cultivadores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE planta_tratamentos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    produto_id BIGINT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    inicio_em DATETIME NOT NULL,
    rounds_total INT NOT NULL,
    round_atual INT NOT NULL,
    descanso_dias INT NOT NULL,
    proxima_aplicacao_em DATETIME NULL,
    fim_tratamento_em DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_tratamento_planta FOREIGN KEY (planta_id) REFERENCES plantas(id),
    CONSTRAINT fk_tratamento_produto FOREIGN KEY (produto_id) REFERENCES aditivos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_tratamentos_planta_status_tipo
    ON planta_tratamentos (planta_id, status, tipo);

CREATE TABLE planta_eventos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    data_evento DATETIME NOT NULL,
    descricao TEXT,
    dose_em_ml DOUBLE PRECISION,

    -- game/idempotência/soft-delete
    correlation_id VARCHAR(64) NULL,
    idempotency_key VARCHAR(80) NULL,
    payload_json JSON NULL,
    deleted_at DATETIME NULL,
    deleted_reason VARCHAR(255) NULL,

    -- snapshot de tratamento/produto (timeline rápida)
    produto_id BIGINT NULL,
    tratamento_id BIGINT NULL,
    round_atual INT NULL,
    rounds_total INT NULL,
    descanso_dias INT NULL,
    proxima_aplicacao_em DATETIME NULL,
    fim_tratamento_em DATETIME NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_eventos_planta
        FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE CASCADE,
    CONSTRAINT fk_evento_produto
        FOREIGN KEY (produto_id) REFERENCES aditivos(id),
    CONSTRAINT fk_evento_tratamento
        FOREIGN KEY (tratamento_id) REFERENCES planta_tratamentos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_planta_data ON planta_eventos (planta_id, data_evento);
CREATE INDEX idx_event_correlation ON planta_eventos (planta_id, correlation_id);
CREATE UNIQUE INDEX uk_event_idempotency ON planta_eventos (planta_id, idempotency_key);
CREATE INDEX idx_eventos_produto ON planta_eventos (produto_id);
CREATE INDEX idx_eventos_tratamento ON planta_eventos (tratamento_id);

CREATE TABLE planta_aditivos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    aditivo_id BIGINT NOT NULL,
    dose_em_ml DOUBLE PRECISION,
    PRIMARY KEY (id),
    CONSTRAINT fk_planta_aditivos_planta
        FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE CASCADE,
    CONSTRAINT fk_planta_aditivos_aditivo
        FOREIGN KEY (aditivo_id) REFERENCES aditivos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_planta_aditivo (planta_id, aditivo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE planta_fotos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    imagem LONGBLOB NOT NULL,
    content_type VARCHAR(100),
    data_upload DATETIME NOT NULL,
    descricao VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_planta_fotos_planta
        FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE CASCADE,
    INDEX idx_planta_id (planta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE planta_equipamentos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    slot VARCHAR(30) NOT NULL,
    aditivo_id BIGINT NOT NULL,
    cor_hex VARCHAR(16) NULL,
    skin_id VARCHAR(60) NULL,
    apelido VARCHAR(60) NULL,
    equipado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_planta_equipamentos_planta
        FOREIGN KEY (planta_id) REFERENCES plantas (id),
    CONSTRAINT fk_planta_equipamentos_aditivo
        FOREIGN KEY (aditivo_id) REFERENCES aditivos (id),
    CONSTRAINT uk_planta_slot UNIQUE (planta_id, slot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
