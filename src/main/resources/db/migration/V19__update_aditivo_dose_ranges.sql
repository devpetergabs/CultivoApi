-- V19__update_aditivo_dose_ranges.sql
-- Atualiza os ranges de dose (min/max) para aditivos nutricionais conforme Bíblia do Cultivo
-- Valores em ml por litro de água pura

-- GERMINACAO: Nenhum aditivo recomendado
-- Todos já estão corretos (sem doses)

-- VEGETATIVO_INICIAL
UPDATE aditivos SET dose_min_em_ml = 0.2, dose_max_em_ml = 1.0 WHERE nome = 'Veg Coco Grow';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Sensi Grow Part A';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Sensi Grow Part B';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 3.0 WHERE nome = 'Connoisseur Grow A';
UPDATE aditivos SET dose_min_em_ml = 0.2, dose_max_em_ml = 1.0 WHERE nome = 'Connoisseur Grow B';
UPDATE aditivos SET dose_min_em_ml = 0.2, dose_max_em_ml = 0.5 WHERE nome = 'B-52';
UPDATE aditivos SET dose_min_em_ml = 0.2, dose_max_em_ml = 0.5 WHERE nome = 'Rhino Skin';

-- VEGETATIVO_MEDIO
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Veg Coco Grow';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Grow Part A';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Grow Part B';
UPDATE aditivos SET dose_min_em_ml = 2.0, dose_max_em_ml = 6.0 WHERE nome = 'Connoisseur Grow A';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Connoisseur Grow B';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 1.0 WHERE nome = 'Bud Candy';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 1.5 WHERE nome = 'B-52';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 1.0 WHERE nome = 'Rhino Skin';

-- VEGETATIVO_AVANCADO
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Veg Coco Grow';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Grow Part A';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Grow Part B';
UPDATE aditivos SET dose_min_em_ml = 2.0, dose_max_em_ml = 6.0 WHERE nome = 'Connoisseur Grow A';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Connoisseur Grow B';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 2.0 WHERE nome = 'Bud Candy';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'B-52';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 1.5 WHERE nome = 'Rhino Skin';

-- FLORACAO_INICIAL
UPDATE aditivos SET dose_min_em_ml = 2.0, dose_max_em_ml = 5.0 WHERE nome = 'pH Perfect Bloom';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Bloom Part A';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Bloom Part B';
UPDATE aditivos SET dose_min_em_ml = 2.0, dose_max_em_ml = 6.0 WHERE nome = 'Connoisseur Bloom A';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Connoisseur Bloom B';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Bud Ignitor';
UPDATE aditivos SET dose_min_em_ml = 1.5, dose_max_em_ml = 3.0 WHERE nome = 'Bud Candy';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 2.0 WHERE nome = 'B-52';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 2.0 WHERE nome = 'Rhino Skin';

-- FLORACAO_MEDIA
UPDATE aditivos SET dose_min_em_ml = 3.0, dose_max_em_ml = 7.0 WHERE nome = 'pH Perfect Bloom';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Bloom Part A';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Bloom Part B';
UPDATE aditivos SET dose_min_em_ml = 2.0, dose_max_em_ml = 6.0 WHERE nome = 'Connoisseur Bloom A';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Connoisseur Bloom B';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 3.0 WHERE nome = 'Big Bud';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Bloom Booster';
UPDATE aditivos SET dose_min_em_ml = 2.0, dose_max_em_ml = 4.0 WHERE nome = 'Bud Candy';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 3.0 WHERE nome = 'Bud Factor X';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 3.0 WHERE nome = 'Tasty Terpenes';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 2.0 WHERE nome = 'B-52';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 2.0 WHERE nome = 'Rhino Skin';

-- FLORACAO_AVANCADA
UPDATE aditivos SET dose_min_em_ml = 3.0, dose_max_em_ml = 7.0 WHERE nome = 'pH Perfect Bloom';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Bloom Part A';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 4.0 WHERE nome = 'Sensi Bloom Part B';
UPDATE aditivos SET dose_min_em_ml = 2.0, dose_max_em_ml = 6.0 WHERE nome = 'Connoisseur Bloom A';
UPDATE aditivos SET dose_min_em_ml = 0.5, dose_max_em_ml = 2.0 WHERE nome = 'Connoisseur Bloom B';
UPDATE aditivos SET dose_min_em_ml = 0.8, dose_max_em_ml = 2.5 WHERE nome = 'Overdrive';
UPDATE aditivos SET dose_min_em_ml = 0.8, dose_max_em_ml = 2.5 WHERE nome = 'Hammerhead';
UPDATE aditivos SET dose_min_em_ml = 2.0, dose_max_em_ml = 4.0 WHERE nome = 'Bud Candy';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 3.0 WHERE nome = 'Bud Factor X';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 3.0 WHERE nome = 'Tasty Terpenes';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 2.0 WHERE nome = 'B-52';
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 2.0 WHERE nome = 'Rhino Skin';

-- FINALIZACAO
UPDATE aditivos SET dose_min_em_ml = 1.0, dose_max_em_ml = 3.0 WHERE nome = 'Flawless Finish';
-- Todos os outros nutrientes: 0.0 (já padrão ou não aplicável)