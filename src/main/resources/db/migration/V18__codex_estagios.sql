CREATE TABLE codex_estagios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    estagio VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(80) NOT NULL UNIQUE,
    nome_exibicao VARCHAR(120) NOT NULL,
    subtitulo VARCHAR(160) NOT NULL,
    descricao_breve TEXT NOT NULL,
    descricao_lore TEXT NOT NULL,
    cuidados_texto TEXT NULL,
    curiosidades_texto TEXT NULL,
    pontos_fortes_texto TEXT NULL,
    pontos_fracos_texto TEXT NULL,
    alertas_texto TEXT NULL,
    resistencia_label VARCHAR(120) NULL,
    observacao_legal TEXT NULL,
    mensagem_aditivos_vazia TEXT NULL,
    nenhum_aditivo_recomendado BOOLEAN NOT NULL DEFAULT FALSE,
    ordem_desbloqueio INT NOT NULL,
    art_asset_key VARCHAR(120) NULL,
    tema_visual VARCHAR(80) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE planta_estagios_desbloqueados (
    id BIGINT NOT NULL AUTO_INCREMENT,
    planta_id BIGINT NOT NULL,
    estagio VARCHAR(50) NOT NULL,
    origem VARCHAR(60) NOT NULL,
    desbloqueado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_planta_estagio_desbloqueado_planta FOREIGN KEY (planta_id) REFERENCES plantas(id) ON DELETE CASCADE,
    CONSTRAINT uk_planta_estagio_desbloqueado UNIQUE (planta_id, estagio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_planta_estagios_desbloqueados_planta ON planta_estagios_desbloqueados (planta_id, desbloqueado_em);

INSERT INTO codex_estagios (
    estagio, slug, nome_exibicao, subtitulo, descricao_breve, descricao_lore,
    cuidados_texto, curiosidades_texto, pontos_fortes_texto, pontos_fracos_texto,
    alertas_texto, resistencia_label, observacao_legal, mensagem_aditivos_vazia,
    nenhum_aditivo_recomendado, ordem_desbloqueio, art_asset_key, tema_visual, ativo
)
SELECT
    'GERMINACAO',
    'germinacao',
    'Germinação',
    'Despertar silencioso',
    'Fase de abertura, enraizamento inicial e observação constante. Todo avanço aqui nasce de estabilidade, paciência e cuidado fino.',
    'A Germinação é o primeiro personagem desbloqueado da jornada: pequena por fora, enorme em potencial. É a fase em que a semente troca inércia por vida visível, exigindo ambiente equilibrado, umidade controlada, delicadeza no manejo e disciplina de observação. Inspirada no referencial teórico de cultivo do projeto, esta etapa ensina que crescimento real começa em silêncio: sem pressa, sem excesso e sem ruído operacional. O usuário deve encarar esse estágio como tutorial vivo de responsabilidade, constância e leitura de sinais sutis.',
    'pH: 7.0 | UR: 60.0% | TEMP: 24.0° | EC: 0.0 - 0.4 mS/cm | LUZ: 18/6 ou 24/0||Mantenha umidade estável sem encharcar||Evite manuseio excessivo ou curiosidade física em excesso||Priorize higiene, substrato limpo e rotina simples||Observe luz, temperatura e ventilação com suavidade||Registre mudanças pequenas: nesta fase o detalhe importa',
    'Cotilédones (primeiras folhas redondas) totalmente abertos e paralelos ao solo, com um caule curto e firme a sustentar a base.||A semente não precisa de ajuda mecânica para abrir. O excesso de atenção (mexer, regar em demasia, escavar a terra) é a principal causa de mortalidade.||Nem toda semente desperta no mesmo ritmo: comparação apressada atrapalha a leitura correta||Crescimento invisível também é progresso: a raiz costuma "trabalhar" antes da parte aérea impressionar||Excesso de zelo costuma ser mais perigoso que cuidado paciente',
    'Alto potencial de adaptação se o ambiente estiver estável||Boa resposta a rotina simples e previsível||Aprendizado rápido para o cultivador sobre leitura fina de sinais',
    'Baixa tolerância a excesso de água||Sensível a calor, frio e manipulação brusca||Pode perder vigor rápido se o ambiente oscilar demais',
    'Não use força para "ajudar" a semente a abrir||Evite iniciar esta fase sem rotina mínima de observação||Sinais discretos de estresse merecem resposta calma, não intervenção impulsiva',
    'Baixa resistência física, alta exigência de precisão ambiental',
    'Conteúdo informativo, educativo e de responsabilidade. O contexto jurídico citado no produto serve como referência geral de debate público e não substitui orientação profissional. Verifique sempre a legislação, decisões aplicáveis e o enquadramento do seu contexto concreto.',
    'Para esta fase não é recomendado nenhum aditivo.',
    TRUE,
    1,
    'GERMINACAO_STEALTH',
    'tutorial-vivo',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM codex_estagios WHERE estagio = 'GERMINACAO');

INSERT INTO codex_estagios (
    estagio, slug, nome_exibicao, subtitulo, descricao_breve, descricao_lore,
    cuidados_texto, curiosidades_texto, pontos_fortes_texto, pontos_fracos_texto,
    alertas_texto, resistencia_label, observacao_legal, mensagem_aditivos_vazia,
    nenhum_aditivo_recomendado, ordem_desbloqueio, art_asset_key, tema_visual, ativo
)
SELECT
    'VEGETATIVO_INICIAL',
    'vegetativo-inicial',
    'Vegetativo Inicial',
    'O motor verde é ligado',
    'Fase de expansão do sistema radicular e formação dos primeiros nós e folhas verdadeiras serrilhadas.',
    'A planta deixa o berço e começa a construir seu "motor" de fotossíntese. É aqui que os cotilédones cedem espaço para a folhagem real e a demanda por Nitrogênio começa. Exige leitura afiada: excesso de água sufoca as raízes que tentam se expandir (risco de Pythium), enquanto a luz molda a estrutura. Um manejo preciso agora define a espessura do caule e a saúde para o futuro.',
    'pH: 7.0 | UR: 60.0% | TEMP: 24.0° | EC: 0.6 - 1.0 mS/cm | LUZ: 18/6||Alterne ciclos de umidade e seca para estimular a busca das raízes por oxigênio e água||Mantenha a luz na distância correta para evitar estiramento (nós muito distantes)||Inicie uma ventilação indireta e suave para fortalecer o caule principal',
    'As novas folhas serrilhadas apontam ligeiramente para cima em direção à luz (aspeto de "rezar"), exibindo um tom verde vibrante e turgidez evidente.||O peso do vaso é o melhor medidor de necessidade hídrica. Levante o vaso após a rega para memorizar o peso máximo, e só volte a aplicar água quando este estiver estruturalmente leve.||O crescimento subterrâneo (raízes) é mais intenso que o aéreo nesta fase||As primeiras folhas de 1 ou 3 pontas logo darão lugar ao padrão clássico de 5 a 7 pontas',
    'Alta taxa de replicação celular se o ambiente estiver favorável||Recupera-se bem de pequenos estresses hídricos (falta de água leve)',
    'Altamente suscetível ao apodrecimento de raízes (Damping off) por solo encharcado||Pode "estilar" (ficar fina e tombar) se a luz for insuficiente',
    'Não inicie fertilização pesada; os cotilédones e um solo base ainda fornecem o essencial||Não regue a planta diretamente, regue o substrato ao redor dela para forçar a raiz a espalhar',
    'Caule em fortalecimento, extrema sensibilidade a encharcamento',
    'Conteúdo informativo, educativo e de responsabilidade. O contexto jurídico citado no produto serve como referência geral de debate público e não substitui orientação profissional.',
    'Para esta fase não é recomendado nenhum aditivo pesado.',
    TRUE,
    2,
    'VEGETATIVO_INICIAL_STEALTH',
    'crescimento-base',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM codex_estagios WHERE estagio = 'VEGETATIVO_INICIAL');

INSERT INTO codex_estagios (
    estagio, slug, nome_exibicao, subtitulo, descricao_breve, descricao_lore,
    cuidados_texto, curiosidades_texto, pontos_fortes_texto, pontos_fracos_texto,
    alertas_texto, resistencia_label, observacao_legal, mensagem_aditivos_vazia,
    nenhum_aditivo_recomendado, ordem_desbloqueio, art_asset_key, tema_visual, ativo
)
SELECT
    'VEGETATIVO_MEDIO',
    'vegetativo-medio',
    'Vegetativo Médio',
    'Explosão foliar e treinamento estratégico',
    'Fase de ganho acelerado de massa verde e janela ideal para técnicas de poda e treinamento de baixo estresse (LST).',
    'O avatar ganha corpo e atitude. O crescimento acelera exponencialmente, exigindo uma dieta rica em Nitrogênio. É o momento de o cultivador atuar como "estrategista": podas (Topping/FIM) ou amarras feitas agora multiplicam os topos futuros, transformando uma estrutura de pinheiro em um arbusto de alto rendimento. Erros no pH ou pragas começam a mostrar sinais agressivos nas folhas.',
    'pH: 7.0 | UR: 60.0% | TEMP: 24.0° | EC: 1.0 - 1.4 mS/cm | LUZ: 18/6||Aumente gradativamente o aporte de Nitrogênio conforme a resposta da planta||Acompanhe o pH da rega rigorosamente para evitar o bloqueio de nutrientes (Lockout)||Momento ideal para iniciar amarras (LST) e nivelar a copa (Canopy)',
    'Folhas largas e planas a atuar como painéis solares impecáveis. O caule principal e os ramos lateral apresentam um engrossamento visível e rápido de dia para dia.||A planta possui a energia metabólica máxima para recuperar de intervenções. Esta é a janela temporal perfeita para moldar a estrutura da copa através de podas e amarras, antes que os caules fiquem demasiado lenhosos.||Sob genética e luz ideais, a planta pode crescer vários centímetros por dia nesta fase||A umidade relativa pode começar a cair lentamente (50-60%) preparando a estrutura',
    'Metabolismo voraz: altíssima capacidade de consumir água e nutrientes||Recuperação extremamente rápida a danos físicos estruturais (podas intencionais)',
    'Desequilíbrios de pH causam amarelecimento rápido e travamento do ritmo||Pragas (ácaros e tripes) têm preferência pela folhagem nova e macia desta fase',
    'Não confunda folhas caídas por sede (murchas flexíveis) com folhas caídas por excesso de água (gordas e curvadas)||Não faça podas de alto estresse se a planta já estiver sofrendo com pragas ou calor',
    'Alta resiliência estrutural, recuperação ágil a cortes',
    'Conteúdo informativo, educativo e de responsabilidade. O contexto jurídico citado no produto serve como referência geral de debate público e não substitui orientação profissional.',
    'Apenas enraizadores ou aditivos base foliar se necessário.',
    FALSE,
    3,
    'VEGETATIVO_MEDIO_STEALTH',
    'expansao-controlada',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM codex_estagios WHERE estagio = 'VEGETATIVO_MEDIO');

INSERT INTO codex_estagios (
    estagio, slug, nome_exibicao, subtitulo, descricao_breve, descricao_lore,
    cuidados_texto, curiosidades_texto, pontos_fortes_texto, pontos_fracos_texto,
    alertas_texto, resistencia_label, observacao_legal, mensagem_aditivos_vazia,
    nenhum_aditivo_recomendado, ordem_desbloqueio, art_asset_key, tema_visual, ativo
)
SELECT
    'VEGETATIVO_AVANCADO',
    'vegetativo-avancado',
    'Vegetativo Avançado',
    'O pico antes da virada',
    'Máximo desenvolvimento de biomassa, consolidação do sistema radicular e preparação estrutural para a alteração do fotoperíodo.',
    'A guerreira madura atinge seu ápice em 18/6. A estrutura lenhosa dos galhos está formada e a densidade da copa pode exigir desfolha (Lollipopping) para garantir a circulação de ar. O improviso aqui custa caro: a planta está prestes a mudar seu relógio interno. O objetivo é garantir que ela entre na fase de floração com 100% de saúde, sem estresse hídrico, sem pragas e com o tanque de nutrientes equilibrado.',
    'pH: 7.0 | UR: 60.0% | TEMP: 24.0° | EC: 1.4 - 1.8 mS/cm | LUZ: 18/6||Faça podas de limpeza nas partes inferiores (canelas limpas) para focar a energia nos topos superiores||Garanta que as raízes têm espaço no vaso; transplantes atrasados podem causar estrangulamento (Rootbound)||Ajuste o espaço vertical contando que ela ainda dobrará de tamanho',
    'Copa incrivelmente densa e robusta. A planta demonstra uma rápida recuperação e as folhas empinam-se poucas horas após receberem água ou ao acenderem as luzes.||A preparação para o ciclo seguinte é a prioridade. Nunca altere o ciclo de luz para iniciar a floração se a planta apresentar qualquer deficiência, praga ou stress. A floração não corrige erros, apenas os amplifica.||Pequenas pré-flores (pistilos ou sacos polínicos) podem aparecer nos nós, indicando maturidade sexual precoce||A fotossíntese opera em capacidade máxima devido à extensa área foliar (Fan leaves)',
    'Caule grosso capaz de suportar o futuro peso floral||Raízes profundamente estabelecidas garantem absorção eficiente',
    'Copas densas demais criam microclimas abafados, um convite para oídio e mofo||Estresses acumulados nesta fase limitam o tamanho final da floração',
    'Corrija qualquer deficiência visível (ex: Magnésio/Cálcio) antes de mudar o ciclo de luz para 12/12||Evite transplantes drásticos a partir deste ponto da jornada',
    'Máxima resistência vegetativa, alta demanda metabólica',
    'Conteúdo informativo, educativo e de responsabilidade. O contexto jurídico citado no produto serve como referência geral de debate público e não substitui orientação profissional.',
    'Fase de transição; prepare a base para aditivos de floração.',
    FALSE,
    4,
    'VEGETATIVO_AVANCADO_STEALTH',
    'pre-transicao',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM codex_estagios WHERE estagio = 'VEGETATIVO_AVANCADO');

INSERT INTO codex_estagios (
    estagio, slug, nome_exibicao, subtitulo, descricao_breve, descricao_lore,
    cuidados_texto, curiosidades_texto, pontos_fortes_texto, pontos_fracos_texto,
    alertas_texto, resistencia_label, observacao_legal, mensagem_aditivos_vazia,
    nenhum_aditivo_recomendado, ordem_desbloqueio, art_asset_key, tema_visual, ativo
)
SELECT
    'FLORACAO_INICIAL',
    'floracao-inicial',
    'Floração Inicial',
    'O salto vertical (The Stretch)',
    'O fotoperíodo cai para 12/12. Inicia-se um estiramento vertical agressivo e a transição da dieta focada em massa para a focada em flora.',
    'O gatilho do outono foi puxado. Com as noites mais longas, a planta entende que seu tempo é limitado e inicia uma corrida alucinada (O ''Stretch''), podendo dobrar ou triplicar de altura em três semanas. A dieta entra em transição: a necessidade de Nitrogênio continua para sustentar o estiramento, mas o Fósforo e Potássio (PK) começam a ser cobrados. Frieza e organização de espaço são fundamentais.',
    'pH: 7.0 | UR: 50.0% | TEMP: 24.0° | EC: 1.6 - 2.0 mS/cm | LUZ: 12/12||Mantenha a escuridão absoluta no ciclo noturno; qualquer luz externa pode estressar e causar hermafroditismo||Não corte o Nitrogênio abruptamente; ela ainda precisa dele para crescer||Vigie diariamente a distância da luz para não queimar os topos em ascensão rápida',
    'Notório estiramento vertical (Stretch). O topo dos ramos adquire um tom de verde mais claro e os primeiros pistilos (pelos brancos) começam a agrupar-se nas pontas.||O estiramento inicial será explosivo, podendo a planta duplicar de tamanho. A escuridão durante o período noturno (12h) tem de ser absoluta e ininterrupta para não causar confusão hormonal e hermafroditismo.||Algumas linhagens puramente Sativas podem triplicar de tamanho nesta fase||Pequenos aglomerados de "pelinhos" brancos (pistilos) começam a dominar os topos dos galhos',
    'Vigor extremo e crescimento visível diário||Início sutil da produção de resina no formato de pré-flores',
    'Altamente vulnerável a vazamentos de luz na tenda (Light Leaks)||O crescimento vertical fora de controle pode encostar nos painéis de LED (Light Burn)',
    'Não confunda essa fase de transição estrutural com a fase de engorda real; não sobrecarregue com PK ainda||Mantenha ventilação contínua para desestimular fungos no meio da copa densa',
    'Alta energia em movimento, mas refém da organização de espaço',
    'Conteúdo informativo, educativo e de responsabilidade. O contexto jurídico citado no produto serve como referência geral de debate público e não substitui orientação profissional.',
    'Nenhum aditivo registrado.',
    TRUE,
    5,
    'FLORACAO_INICIAL_STEALTH',
    'transicao-viva',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM codex_estagios WHERE estagio = 'FLORACAO_INICIAL');

INSERT INTO codex_estagios (
    estagio, slug, nome_exibicao, subtitulo, descricao_breve, descricao_lore,
    cuidados_texto, curiosidades_texto, pontos_fortes_texto, pontos_fracos_texto,
    alertas_texto, resistencia_label, observacao_legal, mensagem_aditivos_vazia,
    nenhum_aditivo_recomendado, ordem_desbloqueio, art_asset_key, tema_visual, ativo
)
SELECT
    'FLORACAO_MEDIA',
    'floracao-media',
    'Floração Média',
    'Engorda botânica e resina pesada',
    'Fim do crescimento vertical. A energia migra inteiramente para o inchaço dos cálices e intensa produção de tricomas e terpenos.',
    'O espetáculo químico começa. O crescimento em altura cessa e a planta passa a engordar agressivamente. O cheiro domina a atmosfera. O cultivador deixa de ser um moldador de estrutura e vira um gerente de dieta e clima: umidade alta agora é letal, e a planta grita por Fósforo e Potássio. Erros na dose de nutrientes (Nutrient Burn) deixam cicatrizes irreparáveis nas folhas. É o teste final do seu balanço de NPK.',
    'pH: 7.0 | UR: 45.0% | TEMP: 24.0° | EC: 1.8 - 2.2 mS/cm | LUZ: 12/12||Reduza a umidade do ar para a casa dos 40-50% para proteger as flores densas contra a Botrytis (Mofo Cinzento)||Aumente as doses de PK progressivamente, acompanhando sempre as pontas das folhas||Garanta que o ar movimente-se livremente por baixo e entre as flores',
    'Os cálices começam a inchar formando os botões florais (buds). Uma camada de tricomas (resina) começa a espalhar-se pelas folhas circundantes, enquanto os pistilos se mantêm predominantemente brancos e esticados.||O controlo climático dita a colheita. Uma humidade relativa elevada no interior de uma copa densa é um convite irreversível para a podridão cinzenta (Bud Rot). A circulação de ar é tão importante quanto a fertilização.||A produção excessiva de resina (tricomas glandulares) é uma defesa evolutiva da planta contra luz UV e insetos||Os pistilos, antes brancos e espetados, começam lentamente a escurecer e murchar',
    'Ganho diário na densidade e peso das flores||Expressão máxima do perfil de terpenos (sabor e aroma) da genética',
    'Tolerância zero a alta umidade no interior da copa (Bud Rot)||Folhas queimadas por excesso de fertilizante perdem eficiência e não se recuperam',
    'Sob hipótese alguma borrife água, inseticidas foliares ou óleos (como Neem) em cima das flores||Excesso de calor volatiza e destrói os terpenos, resultando em colheitas sem cheiro',
    'Estrutura inabalável, extrema fragilidade imunológica contra fungos',
    'Conteúdo informativo, educativo e de responsabilidade. O contexto jurídico citado no produto serve como referência geral de debate público e não substitui orientação profissional.',
    'Nenhum estimulador de floração ativo.',
    TRUE,
    6,
    'FLORACAO_MEDIA_STEALTH',
    'densidade-e-leitura',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM codex_estagios WHERE estagio = 'FLORACAO_MEDIA');

INSERT INTO codex_estagios (
    estagio, slug, nome_exibicao, subtitulo, descricao_breve, descricao_lore,
    cuidados_texto, curiosidades_texto, pontos_fortes_texto, pontos_fracos_texto,
    alertas_texto, resistencia_label, observacao_legal, mensagem_aditivos_vazia,
    nenhum_aditivo_recomendado, ordem_desbloqueio, art_asset_key, tema_visual, ativo
)
SELECT
    'FLORACAO_AVANCADA',
    'floracao-avancada',
    'Floração Avançada',
    'Maturação e amadurecimento',
    'Os botões florais atingem seu pico de densidade e peso. A resina torna-se viscosa e os terpenos atingem sua concentração máxima.',
    'A planta está no auge da sua produtividade. Os botões florais (buds) estão densos e pesados, cobertos por uma camada espessa de tricomas. O cheiro é intenso e o sabor começa a se definir. É hora de ajustar o clima para preservar os terpenos e evitar a degradação. O cultivador agora é um guardião da qualidade: qualquer erro climático pode volatizar os compostos aromáticos e reduzir o valor da colheita.',
    'pH: 7.0 | UR: 40.0% | TEMP: 24.0° | EC: 1.6 - 2.0 mS/cm | LUZ: 12/12||Reduza ainda mais a umidade para 35-40% e a temperatura para 20-22°C para preservar os terpenos||Diminua as doses de fertilizantes PK, evitando o Nutrient Burn nas folhas velhas||Mantenha a circulação de ar constante, mas suave, para não secar excessivamente as flores',
    'Os tricomas passam de transparentes/claros para leitosos/âmbar, indicando maturação. Os pistilos escurecem e enrolam-se sobre si mesmos.||A maturação dos tricomas é o sinal para a colheita. Tricomas leitosos indicam pico de potência psicoativa, enquanto âmbar sinaliza maior produção de CBD.||Os terpenos (óleos essenciais) são responsáveis pelo aroma e sabor, e também têm propriedades medicinais||A planta deixa de crescer em altura e largura, focando toda energia na produção de flores',
    'Pico de produção de resina e terpenos||Botões florais densos e pesados',
    'Perda de terpenos por calor excessivo||Degradação da qualidade por umidade residual',
    'Não adicione mais fertilizantes nas últimas 2 semanas||Evite mudanças bruscas de temperatura ou umidade',
    'Fragilidade extrema contra fungos e bactérias',
    'Conteúdo informativo, educativo e de responsabilidade. O contexto jurídico citado no produto serve como referência geral de debate público e não substitui orientação profissional.',
    'Nenhum estimulador de floração ativo.',
    TRUE,
    7,
    'FLORACAO_AVANCADA_STEALTH',
    'maturacao-densa',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM codex_estagios WHERE estagio = 'FLORACAO_AVANCADA');

INSERT INTO codex_estagios (
    estagio, slug, nome_exibicao, subtitulo, descricao_breve, descricao_lore,
    cuidados_texto, curiosidades_texto, pontos_fortes_texto, pontos_fracos_texto,
    alertas_texto, resistencia_label, observacao_legal, mensagem_aditivos_vazia,
    nenhum_aditivo_recomendado, ordem_desbloqueio, art_asset_key, tema_visual, ativo
)
SELECT
    'FINALIZACAO',
    'finalizacao',
    'Finalização',
    'Flush, colheita e cura',
    'O encerramento técnico: lavagem do solo (Flush), secagem ambiente e cura paciente da resina.',
    'O ciclo biológico termina, mas a alquimia exige frieza até o fim. Inicia-se o ''Flush'', regando apenas com água pura para forçar a planta a consumir as reservas das folhas, garantindo uma fumaça limpa. Após o corte (Harvest), o controle do ambiente de secagem (escuro absoluto, ventilação indireta e umidade travada perto de 60%) é o que sela o sucesso. Errar o timing agora é transformar meses de trabalho minucioso em feno sem gosto.',
    'pH: 7.0 | UR: 60.0% | TEMP: 20.0° | EC: 0.5 - 1.0 mS/cm | LUZ: 12/12||Realize as regas apenas com água pura (pH ajustado) na janela dos últimos 7 a 14 dias para limpar acúmulos de sais||Seque a planta de cabeça para baixo em escuridão completa, com ar em movimento indireto||Realize a ''cura'' (Curing) em potes herméticos de vidro, abrindo-os diariamente (Burping) para trocar o ar e estabilizar a umidade interna',
    'A secagem rápida demais não dá tempo de a clorofila quebrar, resultando em cheiro e sabor de grama cortada||Muitos mestres do cultivo deixam a planta 48h em completa escuridão antes do corte para forçar um último estresse de produção de resina||A cura em potes herméticos permite que a resina continue maturando lentamente, melhorando o sabor e a potência||O flush remove sais minerais acumulados, resultando em uma fumaça mais suave e limpa',
    'A revelação do perfil real de terpenos guardados nos tricomas durante a cura em potes||O entendimento e documentação profunda dos acertos para o próximo ciclo (Level Up)',
    'Calor excessivo no ambiente de secagem evapora os terpenos mais voláteis para sempre||Colocar nos potes antes da umidade baixar a 65% gerará amônia e mofo irreversível',
    'A secagem lenta (entre 10 a 14 dias) é a regra de ouro do cultivo premium; não use aquecedores ou ventiladores diretos||Cortar o ciclo da cura prejudica diretamente a densidade da fumaça e o sabor real da genética',
    'Planta sem vida orgânica; a qualidade final depende 100% da climatologia do secador',
    'Conteúdo informativo, educativo e de responsabilidade. O contexto jurídico citado no produto serve como referência geral de debate público e não substitui orientação profissional.',
    'Aditivos estritamente suspensos. Apenas água para a lavagem do solo.',
    TRUE,
    8,
    'FINALIZACAO_STEALTH',
    'encerramento-tecnico',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM codex_estagios WHERE estagio = 'FINALIZACAO');
