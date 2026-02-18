-- Inserir aditivos Advanced Nutrients para cada estágio
-- VEGETATIVA
INSERT INTO aditivos (nome, marca, descricao, estagio, dose_padrao_em_ml, ativo) VALUES 
('VEG Coco', 'Advanced Nutrients', 'Base de nutrientes para fase vegetativa em substrato de coco', 'VEGETATIVA', 1.0, true),
('Rhino Skin', 'Advanced Nutrients', 'Fortalece parede celular e aumenta a resistência', 'VEGETATIVA', 0.8, true),
('B-52', 'Advanced Nutrients', 'Complexo vitamínico para crescimento robusto', 'VEGETATIVA', 0.5, true),
('Sensi Grow Part A', 'Advanced Nutrients', 'Nutriente base parte A para crescimento vegetativo', 'VEGETATIVA', 2.0, true),
('Sensi Grow Part B', 'Advanced Nutrients', 'Nutriente base parte B para crescimento vegetativo', 'VEGETATIVA', 2.0, true);

-- FLORAÇÃO
INSERT INTO aditivos (nome, marca, descricao, estagio, dose_padrao_em_ml, ativo) VALUES 
('FLOWER Coco', 'Advanced Nutrients', 'Base de nutrientes para fase de floração em substrato de coco', 'FLORACAO', 1.5, true),
('Bloom Booster', 'Advanced Nutrients', 'Estimulador de floração para maior produção', 'FLORACAO', 1.0, true),
('Sensi Bloom Part A', 'Advanced Nutrients', 'Nutriente base parte A para floração', 'FLORACAO', 2.0, true),
('Sensi Bloom Part B', 'Advanced Nutrients', 'Nutriente base parte B para floração', 'FLORACAO', 2.0, true),
('Bud Ignitor', 'Advanced Nutrients', 'Disparador de desenvolvimento de flores', 'FLORACAO', 1.2, true);

-- FINALIZAÇÃO
INSERT INTO aditivos (nome, marca, descricao, estagio, dose_padrao_em_ml, ativo) VALUES 
('Overdrive', 'Advanced Nutrients', 'Finalizador para máximo rendimento nos últimos dias', 'FINALIZACAO', 1.5, true),
('Flawless Finish', 'Advanced Nutrients', 'Limpeza de nutrientes acumulados para maturação', 'FINALIZACAO', 2.0, true),
('Benzinga', 'Advanced Nutrients', 'Potencializador de densidade de flores na finalização', 'FINALIZACAO', 1.0, true);
