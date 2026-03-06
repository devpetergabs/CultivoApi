-- V20__aditivos_macro_e_descricao_tecnica.sql
-- Introduz estagiosMacro + estagiosLista + descricaoTecnica e atualiza catálogo refinado.

SET @ddl := (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'aditivos'
              AND COLUMN_NAME = 'descricao_tecnica'
        ),
        'SELECT 1',
        'ALTER TABLE aditivos ADD COLUMN descricao_tecnica TEXT NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'aditivos'
              AND COLUMN_NAME = 'estagios_macro'
        ),
        'SELECT 1',
        'ALTER TABLE aditivos ADD COLUMN estagios_macro VARCHAR(50) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'aditivos'
              AND COLUMN_NAME = 'estagios_lista'
        ),
        'SELECT 1',
        'ALTER TABLE aditivos ADD COLUMN estagios_lista TEXT NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill base para itens legados
UPDATE aditivos
SET estagios_macro = CASE
    WHEN estagio = 'VEGETATIVA' THEN 'VEGETATIVO'
    WHEN estagio = 'FLORACAO' THEN 'FLORACAO'
    WHEN estagio = 'FINALIZACAO' THEN 'FINALIZACAO'
    ELSE estagios_macro
END
WHERE estagios_macro IS NULL;

UPDATE aditivos
SET estagios_lista = CASE
    WHEN estagios_macro = 'VEGETATIVO' THEN 'VEGETATIVO_INICIAL, VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO'
    WHEN estagios_macro = 'FLORACAO' THEN 'FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA'
    WHEN estagios_macro = 'FINALIZACAO' THEN 'FINALIZACAO'
    ELSE estagios_lista
END
WHERE estagios_lista IS NULL OR TRIM(estagios_lista) = '';

UPDATE aditivos
SET descricao_tecnica = COALESCE(descricao_tecnica, descricao)
WHERE descricao_tecnica IS NULL;

-- ========= BLOCO REFINADO =========

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base de floração para inchaço e densidade botânica.',
    descricao_tecnica = 'Fertilizante base de espectro completo para a fase reprodutiva. Fornece proporções exatas de Fósforo (P) e Potássio (K) exigidas durante o estiramento (Stretch) e a engorda. A tecnologia pH Perfect mantém a solução na faixa ideal de absorção (5.5-6.3), evitando o bloqueio de nutrientes (Lockout), um pilar recomendado pela literatura técnica para manter o metabolismo radicular no máximo durante a floração.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 5.0,
    dose_min_em_ml = 3.0,
    dose_max_em_ml = 7.0
WHERE nome = 'pH Perfect Bloom';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base vegetativa hiperativa para substratos inertes.',
    descricao_tecnica = 'Formulação rica em Nitrogênio (N) e suplementada com Cálcio e Magnésio, ideal para suportar a rápida replicação celular na fase vegetativa em fibra de coco. A Grow Bible enfatiza que a fibra de coco tende a reter íons de Ca e Mg, exigindo esta compensação exata e contínua para evitar deficiências foliares de rápido desenvolvimento e garantir o vigor estrutural da copa.',
    estagio = 'VEGETATIVA',
    estagios_macro = 'VEGETATIVO',
    estagios_lista = 'VEGETATIVO_INICIAL, VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 1.0,
    dose_min_em_ml = 0.5,
    dose_max_em_ml = 2.0
WHERE nome = 'Veg Coco Grow';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Motor vegetativo de liberação de Nitrogênio (Parte A).',
    descricao_tecnica = 'Primeira fase do sistema bifásico vegetativo. Fornece os blocos construtores de Nitrogênio e cálcio quelatado. A divisão em partes A e B impede que os nutrientes reajam no frasco, garantindo a formação rápida das folhas largas (Fan leaves) e o engrossamento agressivo do caule primário, preparando a arquitetura da planta para sustentar as flores futuras.',
    estagio = 'VEGETATIVA',
    estagios_macro = 'VEGETATIVO',
    estagios_lista = 'VEGETATIVO_INICIAL, VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 2.0,
    dose_min_em_ml = 1.0,
    dose_max_em_ml = 4.0
WHERE nome = 'Sensi Grow Part A';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Motor vegetativo de micronutrientes (Parte B).',
    descricao_tecnica = 'Complemento obrigatório da Parte A, introduzindo Magnésio, Enxofre e um leque de micronutrientes que sustentam a fotossíntese explosiva. O balanço perfeito garante que as estômatas das folhas fiquem ativas, regulando a transpiração e prevenindo carências subclínicas invisíveis nos primeiros estágios vegetativos.',
    estagio = 'VEGETATIVA',
    estagios_macro = 'VEGETATIVO',
    estagios_lista = 'VEGETATIVO_INICIAL, VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 2.0,
    dose_min_em_ml = 1.0,
    dose_max_em_ml = 4.0
WHERE nome = 'Sensi Grow Part B';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Ativador reprodutivo e balanço floral (Parte A).',
    descricao_tecnica = 'Substitui o excesso de Nitrogênio vegetativo pela base primária da floração. Entrega a fração nitrogenada exata para manter a planta verde durante o Stretch, acompanhada de precursores enzimáticos que acionam os processos biológicos de maturação e inchaço rápido dos primeiros cálices florais.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 2.0,
    dose_min_em_ml = 1.0,
    dose_max_em_ml = 4.0
WHERE nome = 'Sensi Bloom Part A';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Fósforo e Potássio puros para matriz floral (Parte B).',
    descricao_tecnica = 'A fonte definitiva de PK equilibrado no sistema bifásico. A entrega isolada de quelatos garante alta solubilidade no reservatório, protegendo as raízes do apodrecimento (Damping off) enquanto satura os tecidos com a energia necessária para criar flores densas, úmidas e resinadas.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 2.0,
    dose_min_em_ml = 1.0,
    dose_max_em_ml = 4.0
WHERE nome = 'Sensi Bloom Part B';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base vegetativa ultra-premium para recuperação rápida.',
    descricao_tecnica = 'Desenvolvido para máxima taxa de absorção e eficiência metabólica. Os quelatos moleculares garantem que o Nitrogênio atinja as vias celulares rapidamente. Isso suporta treinamentos de alto estresse mecânico (Topping/FIM) e amarras intensas (LST) permitindo que a planta se cicatrize e ramifique a copa (Canopy) quase da noite para o dia.',
    estagio = 'VEGETATIVA',
    estagios_macro = 'VEGETATIVO',
    estagios_lista = 'VEGETATIVO_INICIAL, VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 4.0,
    dose_min_em_ml = 2.0,
    dose_max_em_ml = 6.0
WHERE nome = 'Connoisseur Grow A';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Complemento estrutural de luxo para troncos e ramos.',
    descricao_tecnica = 'Fornece as correções finas de micronutrientes, PK residual e enzimas em formato ultrassolúvel. Trabalha acoplado à Parte A para assegurar que a planta não se ''estiole'' (espigue e enfraqueça buscando luz), entregando um metabolismo blindado capaz de tolerar flutuações severas de luz e temperatura sem desacelerar.',
    estagio = 'VEGETATIVA',
    estagios_macro = 'VEGETATIVO',
    estagios_lista = 'VEGETATIVO_INICIAL, VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 1.0,
    dose_min_em_ml = 0.5,
    dose_max_em_ml = 2.0
WHERE nome = 'Connoisseur Grow B';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Base de floração de elite (Parte A) para limite genético.',
    descricao_tecnica = 'A formulação mais complexa e agressiva para a fase reprodutiva. Desenvolvida para empurrar os limiares genéticos da planta, entregando aminoácidos em forma-L e promotores que induzem a produção ininterrupta de fito-hormônios responsáveis por multiplicar locais florais e intensificar a atividade de tricomas glandulares.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 4.0,
    dose_min_em_ml = 2.0,
    dose_max_em_ml = 6.0
WHERE nome = 'Connoisseur Bloom A';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Engorda máxima e maturação (Parte B).',
    descricao_tecnica = 'Completa o ciclo de elite com PK supercarregado. Ao acionar o inchaço explosivo dos cálices, suporta quimicamente a degradação foliar natural do final do ciclo (senescência), assegurando que o peso da colheita não seja roubado por desequilíbrios nutricionais mesmo nas semanas de floração mais exigentes.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'BASE_NUTRICIONAL',
    dose_padrao_em_ml = 1.0,
    dose_min_em_ml = 0.5,
    dose_max_em_ml = 2.0
WHERE nome = 'Connoisseur Bloom B';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'O titã do inchaço de cálices do meio da floração.',
    descricao_tecnica = 'Entra cirurgicamente no estágio em que a altura estabiliza. Fornece o rácio exato de P, K, magnésio e aminoácidos (como triptofano) necessários para que a energia direcione o inchaço dos locais florais preexistentes. A literatura aponta que a Floração Média é refém da nutrição exata, e o Big Bud engorda estruturalmente a flor sem a intoxicação celular comum nos PK pesados.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_MEDIA',
    classe = 'BOOSTER',
    dose_padrao_em_ml = 2.0,
    dose_min_em_ml = 1.0,
    dose_max_em_ml = 3.0
WHERE nome = 'Big Bud';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Gatilho hormonal de transição para estiramento e brotos.',
    descricao_tecnica = 'Aplicado estritamente na janela crítica da alteração do fotoperíodo. Carrega frações altamente disponíveis de fósforo e kelp orgânico para forçar a comunicação celular precoce, transformando energia apical em múltiplos sítios de floração. Ele encurta ativamente os internódios, criando pilares contínuos de flor em vez de ramos espaçados (pipocas).',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_INICIAL',
    classe = 'BOOSTER',
    dose_padrao_em_ml = 1.2,
    dose_min_em_ml = 0.5,
    dose_max_em_ml = 2.0
WHERE nome = 'Bud Ignitor';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Reativador do fôlego de maturação na reta final.',
    descricao_tecnica = 'Utilizado na Floração Avançada quando o relógio biológico dita desaceleração. Este booster reinicia a fotossíntese final, empurrando as enzimas dormentes para forçar uma segunda leva de resina defensiva e o ganho de peso tardio antes do flush. Ele compensa genéticas preguiçosas que estagnam nas últimas semanas.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_AVANCADA',
    classe = 'BOOSTER',
    dose_padrao_em_ml = 1.5,
    dose_min_em_ml = 0.8,
    dose_max_em_ml = 2.5
WHERE nome = 'Overdrive';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'PK focado e modelador estrutural avançado.',
    descricao_tecnica = 'Com um rácio específico, este booster permite ao cultivador aplicar densidade extrema sobre a planta sem comprometer o delicado perfil de sabor (lockout). Ao focar na maturidade celular sólida, garante que os grandes aglomerados florais da fase final fiquem rígidos e espessos em vez de arejados.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_AVANCADA',
    classe = 'BOOSTER',
    dose_padrao_em_ml = 1.5,
    dose_min_em_ml = 0.8,
    dose_max_em_ml = 2.5
WHERE nome = 'Hammerhead';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Acelerador de vigor reprodutivo.',
    descricao_tecnica = 'Suplemento abrangente que auxilia no suporte contínuo da estamina de floração. Trabalha sinergicamente com o solo para redirecionar a seiva elaborada e os carboidratos ociosos das folhas satélites diretamente para os nós florais, assegurando a formação contínua de massa botânica.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'BOOSTER',
    dose_padrao_em_ml = 1.0,
    dose_min_em_ml = 0.5,
    dose_max_em_ml = 2.0
WHERE nome = 'Bloom Booster';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Melaço premium microbial e intensificador de terpeno.',
    descricao_tecnica = 'Composto de açúcares de quebra rápida que não alimentam a planta, mas o solo. A inserção precoce (no Vegetativo Médio) coloniza o vaso com microrganismos benéficos. Na floração, esse "exército do solo" atua na simbiose de enzimas, garantindo uma explosão absurda de compostos de terpenos (aromas puros) e óleos essenciais glandulares antes do corte.',
    estagio = 'FLORACAO',
    estagios_macro = 'CICLO_INTEGRADO',
    estagios_lista = 'VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO, FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'ESTIMULANTE',
    dose_padrao_em_ml = 3.0,
    dose_min_em_ml = 1.5,
    dose_max_em_ml = 4.0
WHERE nome = 'Bud Candy';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Bio-hacker de resina defensiva e proteção sistêmica.',
    descricao_tecnica = 'Ativa agressivamente as defesas de Resposta Sistêmica Adquirida (SAR). A botânica comprova que a resina espessa é um escudo contra raios UV e ataques de pragas. Este estimulante cria um "estresse fantasma", induzindo as células de proteção à hiperatividade glandular, resultando num revestimento completo de cristais e resina sem expor a planta a ameaças reais.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'ESTIMULANTE',
    dose_padrao_em_ml = 2.0,
    dose_min_em_ml = 1.0,
    dose_max_em_ml = 3.0
WHERE nome = 'Bud Factor X';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Engrossador de canelas e refinador de óleos aromáticos.',
    descricao_tecnica = 'Carga intensa de kelp e potássio de rápida absorção direcionado para a turgidez celular. Na engorda, assegura que a arquitetura dos galhos não ceda ou rache sob o peso floral absurdo. Adicionalmente, intensifica e expande o mapa genético de sabores, purificando a resposta aromática e deixando a matéria botânica mais densa e suculenta.',
    estagio = 'FLORACAO',
    estagios_macro = 'FLORACAO',
    estagios_lista = 'FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'ESTIMULANTE',
    dose_padrao_em_ml = 2.0,
    dose_min_em_ml = 1.0,
    dose_max_em_ml = 3.0
WHERE nome = 'Tasty Terpenes';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Complexo vitamínico e resgate de estresse (Ambulância verde).',
    descricao_tecnica = 'Soro concentrado de vitaminas do complexo B, extrato de algas marinhas e minerais. Age suprimindo a perda de energia quando a planta sofre estresse (calor, cortes, secas ou excessos de luz). Presente em quase todo o ciclo, impede que os choques interrompam a replicação celular celular, permitindo uma rotina operacional contínua sem que a planta precise "pausar" para curar feridas.',
    estagio = 'VEGETATIVA',
    estagios_macro = 'CICLO_INTEGRADO',
    estagios_lista = 'VEGETATIVO_INICIAL, VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO, FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'ESTIMULANTE',
    dose_padrao_em_ml = 0.5,
    dose_min_em_ml = 0.2,
    dose_max_em_ml = 1.0
WHERE nome = 'B-52';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Armadura de Silicato de Potássio contra pragas e peso.',
    descricao_tecnica = 'A sílica atua como o ''cimento'' blindando a parede celular vegetal. Iniciado cedo, incorpora o silicato ativamente nos troncos e galhos em crescimento. A matriz se torna lenhosa, inquebrável por peso e impenetrável por insetos sugadores como ácaros. Um pilar de defesa física essencial referenciado pela literatura para ciclos de alto rendimento.',
    estagio = 'VEGETATIVA',
    estagios_macro = 'CICLO_INTEGRADO',
    estagios_lista = 'VEGETATIVO_INICIAL, VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO, FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA',
    classe = 'FORTIFICANTE',
    dose_padrao_em_ml = 0.8,
    dose_min_em_ml = 0.4,
    dose_max_em_ml = 1.5
WHERE nome = 'Rhino Skin';

UPDATE aditivos
SET marca = 'Advanced Nutrients',
    descricao = 'Agente quelatante para lavagem purificadora (Flush).',
    descricao_tecnica = 'O encerramento técnico que separa iniciantes de especialistas. Contém quelatos esvaziados de nutrientes que funcionam como ímãs na rizosfera. Eles capturam agressivamente acúmulos de minerais em excesso, sais tóxicos e metais pesados da fibra da planta e do solo. Impõe o estresse catabólico final sem intoxicação, forçando senescência limpa que garante fumaça macia de cinza branca.',
    estagio = 'FINALIZACAO',
    estagios_macro = 'FINALIZACAO',
    estagios_lista = 'FINALIZACAO',
    classe = 'FINALIZADOR',
    dose_padrao_em_ml = 2.0,
    dose_min_em_ml = 1.0,
    dose_max_em_ml = 3.0
WHERE nome = 'Flawless Finish';
