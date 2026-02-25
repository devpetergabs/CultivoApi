-- Atualiza/insere Spinosad com informações reais (sem instrução de dose de rótulo),
-- mas com dose padrão do sistema = 3 mL e estoque inicial = 90 mL.
-- OBS: "Spinosad" aqui é o ingrediente ativo; o sistema usa como item de inventário.

UPDATE aditivos
SET marca = 'Corteva Agriscience',
    descricao = 'Inseticida (classe PROTECAO) à base de Spinosad (spinosyns A + D), derivado de fermentação de Saccharopolyspora spinosa. IRAC Group 5 (Spinosyns). Use conforme rótulo do fabricante e boas práticas de segurança.',
    classe = 'PROTECAO',
    ativo = TRUE,
    dose_padrao_em_ml = 3.0,
    estoque_ml = 90.0
WHERE nome = 'Spinosad';

INSERT INTO aditivos (nome, marca, descricao, classe, dose_padrao_em_ml, estoque_ml, ativo)
SELECT
    'Spinosad',
    'Corteva Agriscience',
    'Inseticida (classe PROTECAO) à base de Spinosad (spinosyns A + D), derivado de fermentação de Saccharopolyspora spinosa. IRAC Group 5 (Spinosyns). Use conforme rótulo do fabricante e boas práticas de segurança.',
    'PROTECAO',
    3.0,
    90.0,
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM aditivos WHERE nome = 'Spinosad');