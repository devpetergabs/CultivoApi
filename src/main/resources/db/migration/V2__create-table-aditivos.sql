CREATE TABLE aditivos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    marca VARCHAR(255) NOT NULL,
    descricao TEXT,
    dose_padrao_em_ml DOUBLE PRECISION,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
);
 
