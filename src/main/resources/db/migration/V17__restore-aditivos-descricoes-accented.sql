-- Restore canonical catalog descriptions with proper accents.
-- Some earlier migrations may have stored '?' placeholders depending on connection/session encoding at the time.
-- This migration is idempotent and simply re-applies the expected descriptions.

UPDATE aditivos SET descricao = 'Base completa de floração' WHERE nome = 'pH Perfect Bloom';
UPDATE aditivos SET descricao = 'Base nutricional de floração' WHERE nome = 'FLOWER Coco';

UPDATE aditivos SET descricao = 'Arranque de floração' WHERE nome = 'Bud Ignitor';
UPDATE aditivos SET descricao = 'Booster genérico' WHERE nome = 'Bloom Booster';
UPDATE aditivos SET descricao = 'Booster de engorda' WHERE nome = 'Big Bud';
UPDATE aditivos SET descricao = 'Booster final' WHERE nome = 'Overdrive';
UPDATE aditivos SET descricao = 'Booster estrutural' WHERE nome = 'Hammerhead';

UPDATE aditivos SET descricao = 'Estímulo metabólico' WHERE nome = 'Bud Factor X';
UPDATE aditivos SET descricao = 'Estimulante energético' WHERE nome = 'Bud Candy';
UPDATE aditivos SET descricao = 'Aroma e perfil' WHERE nome = 'Tasty Terpenes';
UPDATE aditivos SET descricao = 'Estímulo geral' WHERE nome = 'B-52';

UPDATE aditivos SET descricao = 'Base A da floração' WHERE nome = 'Sensi Bloom Part A';
UPDATE aditivos SET descricao = 'Base B da floração' WHERE nome = 'Sensi Bloom Part B';
UPDATE aditivos SET descricao = 'Base A do vegetativo' WHERE nome = 'Sensi Grow Part A';
UPDATE aditivos SET descricao = 'Base B do vegetativo' WHERE nome = 'Sensi Grow Part B';
UPDATE aditivos SET descricao = 'Base nutricional vegetativa' WHERE nome = 'VEG Coco';

UPDATE aditivos SET descricao = 'Fortalece estrutura' WHERE nome = 'Rhino Skin';
UPDATE aditivos SET descricao = 'Flush final' WHERE nome = 'Flawless Finish';

UPDATE aditivos
SET descricao = 'Potencializador de densidade de flores na finalização'
WHERE nome = 'Benzinga';
