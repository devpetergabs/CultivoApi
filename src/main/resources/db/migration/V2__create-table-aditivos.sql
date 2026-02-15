CREATE TABLE aditivos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    marca VARCHAR(255) NOT NULL,
    descricao TEXT,
    dose_padrao_em_ml DOUBLE PRECISION,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
);

-- Advanced Nutrients - pH Perfect Base Nutrients
INSERT INTO aditivos (nome, marca, descricao, dose_padrao_em_ml, ativo) VALUES 
('pH Perfect Grow', 'Advanced Nutrients', 'Base nutriente para fase de crescimento', 5.0, TRUE),
('pH Perfect Micro', 'Advanced Nutrients', 'Micronutrientes pH Perfect', 5.0, TRUE),
('pH Perfect Bloom', 'Advanced Nutrients', 'Base nutriente para fase de floração', 5.0, TRUE),
('Big Bud', 'Advanced Nutrients', 'Bloom booster para desenvolvimento de flores', 2.0, TRUE),
('Bud Ignitor', 'Advanced Nutrients', 'Iniciador de botões para fase de floração', 1.5, TRUE),
('Overdrive', 'Advanced Nutrients', 'Endurecedor de flores na reta final', 2.0, TRUE),
('Hammerhead', 'Advanced Nutrients', 'Potenciador de floração com PK elevado', 1.5, TRUE),
('Voodoo Juice', 'Advanced Nutrients', 'Bactérias benéficas para expansão de raízes', 2.0, TRUE),
('Piranha', 'Advanced Nutrients', 'Fungos benéficos para zona raiz', 2.0, TRUE),
('Tarantula', 'Advanced Nutrients', 'Bactérias selecionadas para raízes', 2.0, TRUE),
('Rhino Skin', 'Advanced Nutrients', 'Silicato para resistência estrutural', 2.0, TRUE),
('Tasty Terpenes', 'Advanced Nutrients', 'Potenciador de terpenos e rigidez de caule', 2.0, TRUE),
('B-52', 'Advanced Nutrients', 'Complexo de vitaminas B para vigor', 1.5, TRUE),
('Bud Factor X', 'Advanced Nutrients', 'Potenciador de tricomas e compostos', 2.0, TRUE),
('Sensi Cal-Mag Xtra', 'Advanced Nutrients', 'Suplemento de cálcio e magnésio', 2.0, TRUE),
('Revive', 'Advanced Nutrients', 'Recuperação de plantas estressadas', 2.0, TRUE),
('Bud Candy', 'Advanced Nutrients', 'Açúcares para aroma e sabor', 3.0, TRUE),
('Flawless Finish', 'Advanced Nutrients', 'Flush final para limpeza', 2.0, TRUE),
('Sensizym', 'Advanced Nutrients', 'Enzimas para conversão de material morto', 2.0, TRUE),
('Flo & Gro', 'Advanced Nutrients', 'Ácido hipocloroso para limpeza de sistema', 1.0, TRUE);
