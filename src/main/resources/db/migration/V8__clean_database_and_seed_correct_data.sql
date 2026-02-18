-- Limpeza completa do banco de dados e recriação com dados corretos

-- Desabilitar FK temporariamente
SET FOREIGN_KEY_CHECKS=0;

-- Truncate de todas as tabelas
TRUNCATE TABLE planta_aditivos;
TRUNCATE TABLE plantas;
TRUNCATE TABLE aditivos;
TRUNCATE TABLE cultivadores;
TRUNCATE TABLE usuarios;

-- Reabilitar FK
SET FOREIGN_KEY_CHECKS=1;

-- Inserir usuário Gabriel (ROLE_ADMIN)
-- Senha: gabriel123 (BCrypt hash)
INSERT INTO usuarios (id, nome, login, senha, role) VALUES 
(1, 'Gabriel', 'gabriel', '$2a$10$ejc8Y3EZMJYqWcNGF3f0nOCwQpO5FnkPDfVk7sL69yJxF2gZquQ3K', 'ROLE_ADMIN');

-- Inserir aditivos
INSERT INTO aditivos (id, nome, marca, descricao, ativo) VALUES 
(1, 'pH Perfect Bloom', 'Advanced Nutrients', 'Sistema de pH Perfect da Advanced Nutrients para fase de floração', TRUE),
(2, 'Big Bud', 'Advanced Nutrients', 'Estimulador de flores - aumenta peso e tamanho dos buds', TRUE),
(3, 'Bud Ignitor', 'Advanced Nutrients', 'Iniciador de floração - maximiza quantidade de flores', TRUE),
(4, 'Overdrive', 'Advanced Nutrients', 'Acelerador de maturação - garante acabamento fino', TRUE),
(5, 'Hammerhead', 'Advanced Nutrients', 'Boosters de flores - reforça estrutura e tamanho', TRUE),
(6, 'Tasty Terpenes', 'Advanced Nutrients', 'Realça sabor e aroma', TRUE),
(7, 'Bud Factor X', 'Advanced Nutrients', 'Aumenta densidade e reina com terpenos', TRUE),
(8, 'Bud Candy', 'Advanced Nutrients', 'Açúcar para flores - melhora sabor', TRUE),
(9, 'Flawless Finish', 'Advanced Nutrients', 'Flush final - limpa resíduos de nutrientes', TRUE);

-- Inserir cultivador Gabriel
INSERT INTO cultivadores (id, usuario_id, telefone, ativo) VALUES 
(1, 1, '11999999999', true);

-- Inserir planta 1 com Gabriel como cultivador
INSERT INTO plantas (id, cultivador_id, nome, strain, altura, largura, largura_caule, tamanho_vaso, ativo, data_germinacao, data_criacao) VALUES 
(1, 1, 'Planta Principal', 'Northern Lights', 50.0, 45.0, 2.5, 'VINTE_E_UM_L', true, '2026-01-15', NOW());

-- Inserir relações planta-aditivo (planta 1 com principais aditivos)
INSERT INTO planta_aditivos (id, planta_id, aditivo_id, dose_em_ml) VALUES 
(1, 1, 1, 10.0),   -- pH Perfect Bloom
(2, 1, 2, 5.0),    -- Big Bud
(3, 1, 3, 5.0),    -- Bud Ignitor
(4, 1, 4, 3.0),    -- Overdrive
(5, 1, 5, 2.5);    -- Hammerhead
