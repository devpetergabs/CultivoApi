CREATE TABLE plantas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cultivador_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    strain VARCHAR(255),
    data_germinacao DATE,
    altura DOUBLE PRECISION,
    largura DOUBLE PRECISION,
    largura_caule DOUBLE PRECISION,
    tamanho_vaso VARCHAR(10),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao DATE NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (cultivador_id) REFERENCES cultivadores(id) ON DELETE CASCADE
);

CREATE TABLE planta_aditivos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    aditivo_id BIGINT NOT NULL,
    dose_em_ml DOUBLE PRECISION,
    PRIMARY KEY (id),
    FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE CASCADE,
    FOREIGN KEY (aditivo_id) REFERENCES aditivos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_planta_aditivo (planta_id, aditivo_id)
);

CREATE TABLE planta_fotos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    imagem LONGBLOB NOT NULL,
    content_type VARCHAR(100),
    data_upload DATETIME NOT NULL,
    descricao VARCHAR(255),
    PRIMARY KEY (id),
    FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE CASCADE,
    INDEX idx_planta_id (planta_id)
);

CREATE TABLE planta_eventos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    data_evento DATETIME NOT NULL,
    descricao TEXT,
    dose_em_ml DOUBLE PRECISION,
    PRIMARY KEY (id),
    FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE CASCADE,
    INDEX idx_planta_data (planta_id, data_evento)
);
