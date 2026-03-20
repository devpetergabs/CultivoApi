package cultivo.api.application.ai;

import cultivo.api.api.controller.planta.DadosResultadoAnalisePlantaFoto;
import cultivo.api.application.ai.DoctorPlantKnowledgeBase.ReferenceContextResult;
import cultivo.api.application.weather.WeatherService;
import cultivo.api.domain.planta.Planta;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import cultivo.api.domain.doctor.DoctorChatMessage;
import cultivo.api.domain.doctor.DoctorChatMessageRole;

@Service
public class PlantaImagemAnaliseService {

    private static final String OBSERVACAO_PADRAO_TEXTO = "Leitura textual guiada pelo prompt-base do Doctor P. e por trechos locais das fontes de referência. Sem foto, a confiança continua dependente da qualidade do relato.";
    private static final DateTimeFormatter CHAT_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final List<String> KEYWORDS_AVALIACAO = List.of(
            "minha planta", "minha folhas", "minhas folhas", "essa planta", "esta planta",
            "avaliar", "analisa", "analise", "diagnost", "deficien", "praga", "fungo",
            "amarel", "queimad", "murch", "mancha", "ponta", "seca", "caida", "travada",
            "substrato", "rega", "folha", "folhas", "caule", "raiz", "clima", "calor", "umidade"
    );
    private static final List<String> KEYWORDS_TECNICA = List.of(
            "ph", "ec", "ppm", "runoff", "drenagem", "salin", "vpd", "condutividade",
            "medição", "medicao", "instrumental", "tecnica", "técnica", "flush", "nutriente"
    );
        private static final List<String> KEYWORDS_PRAGA = List.of(
            "praga", "tripe", "tripes", "ácar", "acaro", "ácaro", "mosca branca", "pulg", "cochonilha",
            "gnat", "fungus gnat", "larva", "ovos", "teia", "teias", "picada", "pontinhos", "inseto", "infesta"
        );
    private static final List<String> KEYWORDS_CONHECIMENTO = List.of(
            "curiosidade", "me fale", "me diga", "o que é", "oq é", "como funciona",
            "explique", "qual a diferença", "diferenca", "história", "historia",
            "origem", "conceito", "fato", "interessante", "sabia que", "por que"
    );
    private static final List<String> KEYWORDS_IDENTIFICACAO_VISUAL = List.of(
            "quais são os sinais", "quais sao os sinais", "sinais de", "como identificar",
            "identificar", "na folha", "olhando a folha", "via folha", "o que observar",
            "no verso da folha", "sinais na planta"
    );

    private final RestTemplate restTemplate;
    private final DoctorPlantContextBuilder contextBuilder;
    private final DoctorPlantCodexContextBuilder codexContextBuilder;
    private final DoctorPlantKnowledgeBase knowledgeBase;
    private final DoctorPromptManager promptManager;
    private final cultivo.api.application.ai.DoctorMentalMapEngine mentalMapEngine;
    private final WeatherService weatherService;
    private final String ollamaBaseUrl;
    private final String modeloTexto;

    public PlantaImagemAnaliseService(
            @Qualifier("aiRestTemplate") RestTemplate restTemplate,
            DoctorPlantContextBuilder contextBuilder,
            DoctorPlantCodexContextBuilder codexContextBuilder,
            DoctorPlantKnowledgeBase knowledgeBase,
            DoctorPromptManager promptManager,
            cultivo.api.application.ai.DoctorMentalMapEngine mentalMapEngine,
            WeatherService weatherService,
            @Value("${app.ai.ollama.base-url}") String ollamaBaseUrl,
            @Value("${app.ai.ollama.text-model}") String modeloTexto
    ) {
        this.restTemplate = restTemplate;
        this.contextBuilder = contextBuilder;
        this.codexContextBuilder = codexContextBuilder;
        this.knowledgeBase = knowledgeBase;
        this.promptManager = promptManager;
        this.mentalMapEngine = mentalMapEngine;
        this.weatherService = weatherService;
        this.ollamaBaseUrl = ollamaBaseUrl;
        this.modeloTexto = modeloTexto;
    }

    public DadosResultadoAnalisePlantaFoto analisar(Planta planta, String descricao) {
        validarEntrada(descricao);

        DoctorPlantAnalysisContext context = contextBuilder.build(planta);
        DoctorChatIntentClassification intentClassification = inferirIntentLocal(descricao, DoctorChatMode.AVALIACAO_BASICA, null);
        PromptAssembly assembly = montarPrompt(planta, descricao, context, null, null, List.of(), DoctorChatMode.AVALIACAO_BASICA, intentClassification);

        return executarPrompt(assembly.prompt());
    }

    public DadosResultadoAnalisePlantaFoto analisarConversa(
            Planta planta,
            String descricao,
            DoctorPlantAnalysisContext context,
            DoctorConversationMemory memory,
            String resumoConversa,
            List<DoctorChatMessage> historico,
            DoctorChatMode modo
    ) {
        return analisarConversa(planta, descricao, context, memory, resumoConversa, historico, modo, inferirIntentLocal(descricao, modo, memory));
    }

    public DadosResultadoAnalisePlantaFoto analisarConversa(
            Planta planta,
            String descricao,
            DoctorPlantAnalysisContext context,
            DoctorConversationMemory memory,
            String resumoConversa,
            List<DoctorChatMessage> historico,
            DoctorChatMode modo,
            DoctorChatIntentClassification intentClassification
    ) {
        validarEntrada(descricao);
        return analisarConversaDetalhada(planta, descricao, context, memory, resumoConversa, historico, modo, intentClassification).response();
    }

    public DoctorAnalysisOutcome analisarConversaDetalhada(
            Planta planta,
            String descricao,
            DoctorPlantAnalysisContext context,
            DoctorConversationMemory memory,
            String resumoConversa,
            List<DoctorChatMessage> historico,
            DoctorChatMode modo
    ) {
        return analisarConversaDetalhada(planta, descricao, context, memory, resumoConversa, historico, modo, inferirIntentLocal(descricao, modo, memory));
    }

    public DoctorAnalysisOutcome analisarConversaDetalhada(
            Planta planta,
            String descricao,
            DoctorPlantAnalysisContext context,
            DoctorConversationMemory memory,
            String resumoConversa,
            List<DoctorChatMessage> historico,
            DoctorChatMode modo,
            DoctorChatIntentClassification intentClassification
    ) {
        validarEntrada(descricao);
        DoctorChatIntentClassification resolvedIntent = intentClassification == null ? inferirIntentLocal(descricao, modo, memory) : intentClassification;
        PromptAssembly assembly = montarPrompt(planta, descricao, context, memory, resumoConversa, historico, modo, resolvedIntent);
        DadosResultadoAnalisePlantaFoto response = resolvedIntent.safeIntent() == DoctorChatIntent.TRIAGEM_AMBIGUA
            ? respostaTriagemAmbigua(assembly.analysisPlan())
            : assembly.analysisPlan().blockedByEvidenceGate()
                ? respostaBloqueadaPorEvidencia(assembly.analysisPlan(), modo, resolvedIntent.safeIntent())
                : executarPrompt(assembly.prompt());

        DoctorAnalysisDiagnostics diagnostics = new DoctorAnalysisDiagnostics(
                assembly.referenceResult().query(),
                assembly.referenceResult().sourceNames(),
                assembly.referenceResult().debug(),
                assembly.referenceResult().strongMatch(),
                assembly.referenceResult().routeTopic(),
                assembly.referenceResult().routeTopics(),
                assembly.referenceResult().preferredLanguages(),
                assembly.referenceResult().mandatoryBible(),
                assembly.referenceResult().sourceDetails(),
                assembly.referenceResult().crossSourceSynthesis(),
                !assembly.codexContext().isEmpty(),
                assembly.codexContext().stageName(),
                assembly.usedPestSpecialist(),
                assembly.analysisPlan().hypotheses(),
                assembly.analysisPlan().criticalMissingData(),
                assembly.analysisPlan().blockedByEvidenceGate(),
                assembly.decisionSupport(),
                resolvedIntent.safeIntent(),
                resolvedIntent.confidence(),
                resolvedIntent.reason(),
                resolvedIntent.triggerSignals(),
                resolvedIntent.contextScope()
        );

        return new DoctorAnalysisOutcome(response, diagnostics);
    }

    public DoctorChatMode resolverModoResposta(String descricao, DoctorChatMode modoSolicitado, DoctorConversationMemory memory) {
        return resolverModoResposta(descricao, modoSolicitado, memory, null);
    }

    public DoctorChatMode resolverModoResposta(
            String descricao,
            DoctorChatMode modoSolicitado,
            DoctorConversationMemory memory,
            DoctorChatIntentClassification intentClassification
    ) {
        if (modoSolicitado != null && modoSolicitado != DoctorChatMode.AUTO) {
            return modoSolicitado;
        }
        if (intentClassification != null) {
            return mapIntentToMode(intentClassification.safeIntent(), descricao, memory);
        }
        return detectarModoResposta(descricao, memory);
    }

    public boolean isFollowUpReferencial(String descricao, DoctorConversationMemory memory) {
        String texto = valor(descricao).toLowerCase(Locale.ROOT).trim();
        if (texto.isBlank() || memory == null || (!memory.hasTopic() && !memory.hasEntity())) {
            return false;
        }

        if (temSinalForteDeNovoCaso(texto)) {
            return false;
        }

        if (texto.length() <= 96 && (texto.contains("como assim") || texto.equals("isso?") || texto.equals("isso") || texto.contains("ele") || texto.contains("ela") || texto.contains("causado") || texto.contains("nasce") || texto.contains("por quê") || texto.contains("porque?") || texto.contains("como tratar") || texto.contains("como identificar") || texto.contains("quais são os sinais") || texto.contains("quais sao os sinais") || texto.contains("na folha") || texto.contains("na planta") || texto.contains("olhando") || texto.contains("via folha"))) {
            return true;
        }

        long tokens = Arrays.stream(texto.split("\\s+"))
                .filter(token -> !token.isBlank())
                .count();

        return tokens <= 8 && !KEYWORDS_CONHECIMENTO.stream().anyMatch(texto::contains) && !temMudancaClaraDeAssunto(texto);
    }

    private DadosResultadoAnalisePlantaFoto executarPrompt(String prompt) {

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", modeloTexto);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);
        requestBody.put("options", Map.of("temperature", 0.2));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            @SuppressWarnings("unchecked")
            var response = restTemplate.postForObject(
                    ollamaBaseUrl + "/api/generate",
                    new HttpEntity<>(requestBody, headers),
                    Map.class
            );

            String resposta = response != null && response.get("response") != null
                    ? String.valueOf(response.get("response")).trim()
                    : "A IA não retornou conteúdo utilizável para esta imagem.";

            if (resposta.isBlank()) {
                resposta = "A IA não retornou conteúdo utilizável para esta imagem.";
            }

            return new DadosResultadoAnalisePlantaFoto(modeloTexto, resposta, OBSERVACAO_PADRAO_TEXTO);
        } catch (RestClientException ex) {
            String mensagem = ex.getMessage() != null ? ex.getMessage() : "Falha ao consultar a IA.";
            if (mensagem.contains("model") && mensagem.contains("not found")) {
                throw new IllegalArgumentException("Modelo de texto indisponível no Ollama. Faça o pull do modelo configurado, por exemplo: docker exec cultivo_inteligente_ollama ollama pull llama3.2");
            }
            throw new IllegalArgumentException("Falha ao consultar a IA local: " + sanitizar(mensagem));
        }
    }

    private void validarEntrada(String descricao) {
        boolean possuiDescricao = descricao != null && !descricao.isBlank();

        if (!possuiDescricao) {
            throw new IllegalArgumentException("Descreva o que deseja analisar.");
        }
    }

    private PromptAssembly montarPrompt(
            Planta planta,
            String descricao,
            DoctorPlantAnalysisContext context,
            DoctorConversationMemory memory,
            String resumoConversa,
            List<DoctorChatMessage> historico,
            DoctorChatMode modo,
            DoctorChatIntentClassification intentClassification
    ) {
        String contextoUsuario = descricao == null || descricao.isBlank()
                ? "Nenhuma observação adicional foi enviada."
                : descricao.trim();
        DoctorChatIntent intent = intentClassification == null ? DoctorChatIntent.TRIAGEM_AMBIGUA : intentClassification.safeIntent();
        boolean conhecimentoGeralPuro = intent == DoctorChatIntent.DEFINICAO && !pedeContextoDeEstagio(contextoUsuario);
        boolean conhecimentoContextualAoEstagio = intent == DoctorChatIntent.LEITURA_ESTAGIO || (modo == DoctorChatMode.CONHECIMENTO_GERAL && pedeContextoDeEstagio(contextoUsuario));
        DoctorPlantCodexContext codexContext = conhecimentoContextualAoEstagio ? codexContextBuilder.build(planta) : DoctorPlantCodexContext.empty();
        String buscaPrincipal = textoBusca(planta, context, contextoUsuario, modo, intent, memory, codexContext);
        ReferenceContextResult referenceResultPrimario = knowledgeBase.buildReferenceResult(planta, buscaPrincipal, modo, intent);
        DoctorAnalysisPlan analysisPlan = construirPlanoAnalise(planta, contextoUsuario, context, codexContext, memory, modo, intent, referenceResultPrimario);
        ReferenceContextResult referenceResultDiferencial = analysisPlan.differentialQuery() == null || analysisPlan.differentialQuery().isBlank()
            ? null
            : knowledgeBase.buildReferenceResult(planta, analysisPlan.differentialQuery(), modo, intent);
        ReferenceContextResult referenceResult = combinarReferencias(referenceResultPrimario, referenceResultDiferencial);
        String referencias = referenceResult.renderedContext();
        String especialistaAuxiliar = especialistaAuxiliar(modo, intent, contextoUsuario, context, memory);
        String referenciasEspecialista = referenciasEspecialistaPraga(planta, context, contextoUsuario, modo, intent, memory, codexContext);
        boolean usouEspecialistaPraga = !especialistaAuxiliar.isBlank() || !referenciasEspecialista.isBlank();

        if (!referenciasEspecialista.isBlank()) {
            referencias = referencias + "\n\n---\n\n[CONSULTA AUXILIAR: PRAGAS]\n" + referenciasEspecialista;
        }

        DoctorDecisionSupport decisionSupport = mentalMapEngine.evaluate(
                planta,
                contextoUsuario,
                modo,
                context,
                codexContext,
                referenceResult,
                analysisPlan
        );

        String prompt = promptManager.buildPrompt(new DoctorPromptRequest(
                modo,
                intent,
                intentClassification != null ? intentClassification.promptBlock() : "",
                contextoUsuario,
                referencias,
                conhecimentoContextualAoEstagio ? codexContext.promptBlock() : "",
                deveInjetarFatosDoCaso(intent) ? analysisPlan.caseFactsBlock() : "",
                deveUsarContratoEvidencia(intent) ? analysisPlan.evidenceContractBlock() : "",
                deveUsarContratoEvidencia(intent) ? analysisPlan.differentialBlock() : "",
                deveInjetarApoioDecisao(intent) ? decisionSupport.toPromptBlock() : "",
                deveInjetarContextoEstruturado(intent) ? contextoPlanta(context, modo, intent) : "",
                deveUsarClima(intent) ? climaAtual(modo, intent) : "",
                conhecimentoGeralPuro ? "" : especialistaAuxiliar,
                deveInjetarMemoriaCurta(intent, contextoUsuario, memory) ? memoriaCurta(memory) : "",
                deveInjetarResumoConversa(intent, contextoUsuario, memory) ? resumoPrompt(memory, resumoConversa) : "",
                deveInjetarHistorico(intent, contextoUsuario, memory) ? historicoRecente(historico) : ""
        ));

        return new PromptAssembly(prompt, referenceResult, codexContext, usouEspecialistaPraga, analysisPlan, decisionSupport);
    }

    private DoctorAnalysisPlan construirPlanoAnalise(
            Planta planta,
            String contextoUsuario,
            DoctorPlantAnalysisContext context,
            DoctorPlantCodexContext codexContext,
            DoctorConversationMemory memory,
            DoctorChatMode modo,
            DoctorChatIntent intent,
            ReferenceContextResult referenceResult
    ) {
        String texto = valor(contextoUsuario).toLowerCase(Locale.ROOT);
        List<String> hypotheses = inferirHipoteses(texto, modo, intent);
        List<String> criticalMissing = inferirLacunasCriticas(texto, context, modo, intent);
        boolean blocked = deveBloquearConclusao(modo, intent, criticalMissing, referenceResult, context, texto);
        List<String> followUps = montarPerguntasFocadas(modo, intent, criticalMissing);

        String caseFactsBlock = montarFatosDoCaso(contextoUsuario, context, codexContext, memory, intent);
        String evidenceContractBlock = montarContratoEvidencia(modo, intent, blocked, criticalMissing, referenceResult);
        String differentialBlock = montarBlocoDiferencial(hypotheses, modo, intent, blocked, followUps);
        String differentialQuery = blocked || intent == DoctorChatIntent.TRIAGEM_AMBIGUA
                ? ""
                : String.join(" ", valueOrEmpty(referenceResult.query()), String.join(" ", hypotheses), String.join(" ", criticalMissing));

        return new DoctorAnalysisPlan(
                caseFactsBlock,
                evidenceContractBlock,
                differentialBlock,
                hypotheses,
                criticalMissing,
                followUps,
                referenceResult.query(),
                differentialQuery,
                blocked
        );
    }

    private List<String> inferirHipoteses(String texto, DoctorChatMode modo, DoctorChatIntent intent) {
        LinkedHashSet<String> hypotheses = new LinkedHashSet<>();

        if (intent == DoctorChatIntent.DEFINICAO) {
            hypotheses.add("consulta conceitual: responder com definição e implicação prática, sem transformar em laudo");
            return hypotheses.stream().limit(2).toList();
        }

        if (intent == DoctorChatIntent.LEITURA_ESTAGIO) {
            hypotheses.add("a decisão depende mais da fase fenológica do que de diagnóstico aberto");
            hypotheses.add("o estágio atual define o que muda em luz, maturação ou janela de manejo");
            return hypotheses.stream().limit(3).toList();
        }

        if (modo == DoctorChatMode.PRAGA || containsAny(texto, KEYWORDS_PRAGA)) {
            hypotheses.add("infestação por praga compatível com o padrão descrito");
            hypotheses.add("dano fisiológico ou deficiência confundido com praga");
            hypotheses.add("estresse ambiental ou dano mecânico com aparência parecida");
        }

        if (containsAny(texto, List.of("murch", "caid", "mole", "tomb"))) {
            hypotheses.add("excesso de água ou raiz pouco oxigenada");
            hypotheses.add("sede ou rega irregular");
            hypotheses.add("estresse térmico ou ambiental");
        }

        if (containsAny(texto, List.of("amarel", "clorose", "queimad", "ponta", "deficien", "travada"))) {
            hypotheses.add("deficiência ou bloqueio nutricional");
            hypotheses.add("excesso de sais ou concentração alta na rizosfera");
            hypotheses.add("estresse radicular ou lockout por pH");
        }

        if (containsAny(texto, List.of("floração", "floracao", "tricoma", "pistilo", "bud", "cola"))) {
            hypotheses.add("evolução normal do estágio de floração");
            hypotheses.add("estresse de floração ou maturação desuniforme");
            hypotheses.add("praga ou fungo oportunista favorecido pelo estágio");
        }

        if (intent == DoctorChatIntent.RECOMENDACAO_MANEJO) {
            hypotheses.add("a ação recomendada precisa respeitar estágio e risco antes de intervenção direta");
        }

        if (hypotheses.isEmpty()) {
            if (modo == DoctorChatMode.AVALIACAO_TECNICA || intent == DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO) {
                hypotheses.add("desequilíbrio fisiológico dependente de dados instrumentais");
                hypotheses.add("estresse ambiental sem medição suficiente para fechar causa");
            } else if (modo == DoctorChatMode.AVALIACAO_BASICA || intent == DoctorChatIntent.DIAGNOSTICO_GERAL) {
                hypotheses.add("estresse leve de manejo");
                hypotheses.add("leitura ainda inconclusiva com os dados atuais");
            } else if (modo == DoctorChatMode.PRAGA) {
                hypotheses.add("suspeita de praga sem sinal taxonômico forte");
                hypotheses.add("quadro não específico que exige confirmação visual guiada");
            }
        }

        return hypotheses.stream().limit(4).toList();
    }

    private List<String> inferirLacunasCriticas(String texto, DoctorPlantAnalysisContext context, DoctorChatMode modo, DoctorChatIntent intent) {
        List<String> missing = new ArrayList<>();
        boolean hasObservation = context != null && context.telemetria() != null && context.telemetria().ultimaObservacao() != null && !context.telemetria().ultimaObservacao().isBlank();
        boolean hasRecentWater = context != null && context.telemetria() != null && context.telemetria().ultimaRega() != null && !context.telemetria().ultimaRega().isBlank();
        boolean hasPestHistory = context != null && context.historicoSaude() != null && (
                valueOrEmpty(context.historicoSaude().ultimoSinalPraga()).length() > 8 ||
                        valueOrEmpty(context.historicoSaude().ultimoTratamento()).length() > 8
        );
        boolean hasInstrumentData = containsAny(texto, KEYWORDS_TECNICA);
        boolean hasVisualPattern = containsAny(texto, List.of("verso", "anverso", "pontinhos", "teia", "teias", "raspagem", "melada", "mordida", "ovos", "trilhas", "mancha", "padrão", "padrao"));
        boolean hasProgression = containsAny(texto, List.of("rápido", "rapido", "progress", "desde", "piorou", "aumentou", "espalhou", "voltou"));
        boolean hasSymptom = containsAny(texto, KEYWORDS_AVALIACAO) || hasVisualPattern;

        if (intent == DoctorChatIntent.DEFINICAO || intent == DoctorChatIntent.LEITURA_ESTAGIO) {
            return missing;
        }
        if (intent == DoctorChatIntent.TRIAGEM_AMBIGUA) {
            missing.add("tipo de pergunta ainda ambíguo entre definição, diagnóstico ou ação");
            return missing;
        }

        switch (intent) {
            case DIAGNOSTICO_ESPECIALIZADO -> {
                if (!hasInstrumentData) missing.add("medições instrumentais ligadas à hipótese (pH, EC, PPM, runoff ou equivalente)");
                if (!hasObservation && !hasSymptom) missing.add("descrição objetiva do sinal principal observado");
                if (!hasRecentWater) missing.add("histórico recente de rega ou alimentação");
            }
            case DIAGNOSTICO_GERAL -> {
                if (!hasObservation && !hasSymptom) missing.add("sinal principal da planta ou do manejo");
                if (!hasRecentWater) missing.add("referência recente de rega");
            }
            case RECOMENDACAO_MANEJO -> {
                if (!hasObservation && !hasSymptom && modo != DoctorChatMode.CONHECIMENTO_GERAL) missing.add("objetivo exato da ação ou problema que motivou o manejo");
                if (!hasRecentWater && containsAny(texto, List.of("corrigir", "tratar", "resolver"))) missing.add("histórico recente de manejo ou rega");
                if (containsAny(texto, KEYWORDS_PRAGA) && !hasPestHistory) missing.add("histórico de praga ou tratamento anterior");
            }
            default -> {
            }
        }

        if (modo == DoctorChatMode.PRAGA) {
            if (!hasVisualPattern) missing.add("padrão visual do dano (verso/anverso, pontilhado, teia, melada, ovos, mordidas)");
            if (!hasProgression) missing.add("progressão do quadro (quando começou e como avançou)");
        }

        return missing.stream().distinct().toList();
    }

    private boolean deveBloquearConclusao(DoctorChatMode modo, DoctorChatIntent intent, List<String> criticalMissing, ReferenceContextResult referenceResult, DoctorPlantAnalysisContext context, String texto) {
        if (intent == DoctorChatIntent.DEFINICAO || intent == DoctorChatIntent.LEITURA_ESTAGIO || modo == DoctorChatMode.CONHECIMENTO_GERAL) {
            return false;
        }
        if (intent == DoctorChatIntent.TRIAGEM_AMBIGUA) {
            return true;
        }

        boolean strongGrounding = referenceResult != null && referenceResult.strongMatch();
        boolean hasObservation = context != null && context.telemetria() != null && valueOrEmpty(context.telemetria().ultimaObservacao()).length() > 8;
        boolean hasSymptom = containsAny(texto, KEYWORDS_AVALIACAO) || containsAny(texto, KEYWORDS_PRAGA);

        return switch (intent) {
            case DIAGNOSTICO_ESPECIALIZADO -> criticalMissing.size() >= 2 && !strongGrounding;
            case RECOMENDACAO_MANEJO -> criticalMissing.size() >= 2 && !strongGrounding;
            case DIAGNOSTICO_GERAL -> criticalMissing.size() >= 2 && !hasObservation && !hasSymptom;
            case DEFINICAO, LEITURA_ESTAGIO, TRIAGEM_AMBIGUA -> false;
        };
    }

    private List<String> montarPerguntasFocadas(DoctorChatMode modo, DoctorChatIntent intent, List<String> criticalMissing) {
        List<String> perguntas = new ArrayList<>();
        if (intent == DoctorChatIntent.TRIAGEM_AMBIGUA) {
            perguntas.add("Você quer uma definição, um diagnóstico da planta ou uma recomendação de ação?");
            perguntas.add("Qual é o sinal principal ou a dúvida central em uma frase?");
            perguntas.add("Se houver medições ou estágio relevante, me diga só o essencial.");
            return perguntas;
        }
        for (String gap : criticalMissing) {
            if (gap.contains("pH") || gap.contains("EC") || gap.contains("PPM") || gap.contains("runoff")) {
                perguntas.add("Quais medições você tem agora: pH, EC, PPM ou runoff?");
            } else if (gap.contains("padrão visual")) {
                perguntas.add("O dano está no verso ou anverso da folha? Tem teia, pontilhado, melada ou ovos?");
            } else if (gap.contains("progressão")) {
                perguntas.add("Quando isso começou e está piorando rápido ou devagar?");
            } else if (gap.contains("rega") || gap.contains("histórico")) {
                perguntas.add("Quando foi a última rega/alimentação e como a planta reagiu depois?");
            } else if (gap.contains("sinal principal") || gap.contains("descrição objetiva") || gap.contains("objetivo exato")) {
                perguntas.add("Qual é exatamente o sinal principal ou a ação que você quer decidir?");
            } else if (gap.contains("tratamento")) {
                perguntas.add("Já houve praga ou tratamento antes? Qual produto e quando foi aplicado?");
            }
        }
        return perguntas.stream().distinct().limit(3).toList();
    }

    private String montarFatosDoCaso(String contextoUsuario, DoctorPlantAnalysisContext context, DoctorPlantCodexContext codexContext, DoctorConversationMemory memory, DoctorChatIntent intent) {
        StringBuilder sb = new StringBuilder();
        sb.append("- relato_usuario: ").append(contextoUsuario).append("\n");
        if (memory != null && memory.hasTopic() && isFollowUpReferencial(contextoUsuario, memory)) {
            sb.append("- topico_em_andamento: ").append(valueOrEmpty(memory.topicoAtual())).append("\n");
        }
        if (intent == DoctorChatIntent.DEFINICAO) {
            return sb.toString().trim();
        }
        if (context != null && context.metadados() != null) {
            sb.append("- estagio_atual: ").append(valueOrEmpty(context.metadados().estagio())).append("\n");
            sb.append("- strain: ").append(valueOrEmpty(context.metadados().strain())).append("\n");
            sb.append("- ciclo: ").append(valueOrEmpty(context.metadados().tipoCiclo())).append("\n");
        }
        if ((intent == DoctorChatIntent.DIAGNOSTICO_GERAL || intent == DoctorChatIntent.RECOMENDACAO_MANEJO) && context != null && context.telemetria() != null) {
            sb.append("- ultima_observacao_registrada: ").append(valueOrEmpty(context.telemetria().ultimaObservacao())).append("\n");
            sb.append("- ultima_rega_registrada: ").append(valueOrEmpty(context.telemetria().ultimaRega())).append("\n");
        }
        if (intent == DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO && context != null) {
            sb.append(context.toPromptBlock()).append("\n");
        }
        if (context != null && context.historicoSaude() != null && intent != DoctorChatIntent.LEITURA_ESTAGIO) {
            sb.append("- ultimo_sinal_praga: ").append(valueOrEmpty(context.historicoSaude().ultimoSinalPraga())).append("\n");
            sb.append("- ultimo_tratamento: ").append(valueOrEmpty(context.historicoSaude().ultimoTratamento())).append("\n");
        }
        if (codexContext != null && !codexContext.isEmpty()) {
            sb.append("- codex_estagio: ").append(valueOrEmpty(codexContext.stageName())).append("\n");
            sb.append("- codex_tema: ").append(valueOrEmpty(codexContext.theme())).append("\n");
        }
        return sb.toString().trim();
    }

    private String montarContratoEvidencia(DoctorChatMode modo, DoctorChatIntent intent, boolean blocked, List<String> criticalMissing, ReferenceContextResult referenceResult) {
        StringBuilder sb = new StringBuilder();
        sb.append("- modo_ativo: ").append(modo.name()).append("\n");
        sb.append("- intencao_ativa: ").append(intent.name()).append("\n");
        sb.append("- grounding_local_forte: ").append(referenceResult != null && referenceResult.strongMatch()).append("\n");
        sb.append("- regra: não conclua com certeza alta sem evidência local suficiente + relato compatível\n");
        sb.append("- regra: diferencie evidência local, inferência e lacuna de forma explícita\n");
        if (intent == DoctorChatIntent.DEFINICAO) {
            sb.append("- regra: pergunta conceitual não deve ser convertida em laudo clínico\n");
        }
        if (blocked) {
            sb.append("- estado: BLOQUEAR conclusão fechada e pedir apenas os dados realmente impeditivos\n");
        } else {
            sb.append("- estado: pode responder, mas precisa explicitar hipóteses rivais e confiança quando houver caso situado\n");
        }
        if (!criticalMissing.isEmpty()) {
            sb.append("- lacunas_críticas: ").append(String.join(" | ", criticalMissing)).append("\n");
        }
        return sb.toString().trim();
    }

    private String montarBlocoDiferencial(List<String> hypotheses, DoctorChatMode modo, DoctorChatIntent intent, boolean blocked, List<String> followUps) {
        StringBuilder sb = new StringBuilder();
        sb.append("- hipóteses_obrigatórias:\n");
        for (String hypothesis : hypotheses) {
            sb.append("  - ").append(hypothesis).append("\n");
        }
        if (intent != DoctorChatIntent.DEFINICAO && intent != DoctorChatIntent.LEITURA_ESTAGIO) {
            sb.append("- instrução: para cada hipótese, diga rapidamente o que favorece e o que enfraquece\n");
            sb.append("- instrução: priorize a hipótese mais consistente só depois de comparar rivais\n");
        }
        if (modo == DoctorChatMode.PRAGA) {
            sb.append("- instrução_praga: compare praga vs deficiência vs estresse ambiental vs dano mecânico antes de nomear espécie\n");
        }
        if (blocked && !followUps.isEmpty()) {
            sb.append("- perguntas_de_desbloqueio:\n");
            for (String followUp : followUps) {
                sb.append("  - ").append(followUp).append("\n");
            }
        }
        return sb.toString().trim();
    }

    private DadosResultadoAnalisePlantaFoto respostaBloqueadaPorEvidencia(DoctorAnalysisPlan plan, DoctorChatMode modo, DoctorChatIntent intent) {
        StringBuilder sb = new StringBuilder();
        sb.append("Ainda não dá para fechar essa leitura com segurança.\n\n");
        sb.append("O que está faltando de verdade para eu decidir melhor:\n");
        for (String gap : plan.criticalMissingData()) {
            sb.append("- ").append(gap).append("\n");
        }
        if (!plan.followUpQuestions().isEmpty()) {
            sb.append("\nMe manda, se possível:\n");
            for (String question : plan.followUpQuestions()) {
                sb.append("- ").append(question).append("\n");
            }
        }
        if (!plan.hypotheses().isEmpty() && intent != DoctorChatIntent.DEFINICAO) {
            sb.append("\nSem esses dados, as linhas mais prováveis ainda competem entre si:\n");
            for (String hypothesis : plan.hypotheses()) {
                sb.append("- ").append(hypothesis).append("\n");
            }
        }
        sb.append("\nSe quiser, eu continuo no modo ").append(modo.name().toLowerCase(Locale.ROOT).replace('_', ' ')).append(" assim que você mandar isso.");

        return new DadosResultadoAnalisePlantaFoto(modeloTexto, sb.toString().trim(), OBSERVACAO_PADRAO_TEXTO);
    }

    private DadosResultadoAnalisePlantaFoto respostaTriagemAmbigua(DoctorAnalysisPlan plan) {
        StringBuilder sb = new StringBuilder();
        sb.append("Ainda não classifiquei essa pergunta com segurança entre definição, diagnóstico ou ação.\n\n");
        sb.append("Para eu entrar no pipeline certo, responde só isso:\n");
        for (String question : plan.followUpQuestions()) {
            sb.append("- ").append(question).append("\n");
        }
        return new DadosResultadoAnalisePlantaFoto(modeloTexto, sb.toString().trim(), OBSERVACAO_PADRAO_TEXTO);
    }

    private ReferenceContextResult combinarReferencias(ReferenceContextResult principal, ReferenceContextResult diferencial) {
        if (diferencial == null || diferencial.renderedContext() == null || diferencial.renderedContext().isBlank()) {
            return principal;
        }

        Set<String> fontes = new LinkedHashSet<>(principal.sourceNames());
        fontes.addAll(diferencial.sourceNames());

        Set<String> debug = new LinkedHashSet<>(principal.debug());
        debug.addAll(diferencial.debug());

        StringBuilder contexto = new StringBuilder(valueOrEmpty(principal.renderedContext()));
        if (!valueOrEmpty(diferencial.renderedContext()).isBlank()) {
            if (contexto.length() > 0) {
                contexto.append("\n\n---\n\n[PASSO DIFERENCIAL]\n");
            }
            contexto.append(diferencial.renderedContext());
        }

        var sinteseCruzada = principal.crossSourceSynthesis() != null
                ? principal.crossSourceSynthesis()
                : diferencial.crossSourceSynthesis();

        return new ReferenceContextResult(
                contexto.toString().trim(),
                valueOrEmpty(principal.query()) + " || diferencial: " + valueOrEmpty(diferencial.query()),
                List.copyOf(fontes),
                List.copyOf(debug),
            principal.strongMatch() || diferencial.strongMatch(),
            valueOrEmpty(principal.routeTopic()).isBlank() ? diferencial.routeTopic() : principal.routeTopic(),
            principal.routeTopics().isEmpty() ? diferencial.routeTopics() : principal.routeTopics(),
            principal.preferredLanguages().isEmpty() ? diferencial.preferredLanguages() : principal.preferredLanguages(),
            principal.mandatoryBible() || diferencial.mandatoryBible(),
            Stream.concat(principal.sourceDetails().stream(), diferencial.sourceDetails().stream()).distinct().toList(),
            sinteseCruzada
        );
    }

    private boolean containsAny(String texto, List<String> terms) {
        String safe = valueOrEmpty(texto).toLowerCase(Locale.ROOT);
        return terms.stream().anyMatch(safe::contains);
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private DoctorChatMode mapIntentToMode(DoctorChatIntent intent, String descricao, DoctorConversationMemory memory) {
        if (intent == null || intent == DoctorChatIntent.TRIAGEM_AMBIGUA) {
            return detectarModoResposta(descricao, memory);
        }
        return switch (intent) {
            case DEFINICAO -> pedeContextoDeEstagio(descricao) ? DoctorChatMode.AVALIACAO_BASICA : DoctorChatMode.CONHECIMENTO_GERAL;
            case LEITURA_ESTAGIO, RECOMENDACAO_MANEJO, DIAGNOSTICO_GERAL -> containsAny(valor(descricao).toLowerCase(Locale.ROOT), KEYWORDS_PRAGA)
                    ? DoctorChatMode.PRAGA
                    : DoctorChatMode.AVALIACAO_BASICA;
            case DIAGNOSTICO_ESPECIALIZADO -> DoctorChatMode.AVALIACAO_TECNICA;
            case TRIAGEM_AMBIGUA -> detectarModoResposta(descricao, memory);
        };
    }

    private DoctorChatMode detectarModoResposta(String descricao, DoctorConversationMemory memory) {
        String texto = valor(descricao).toLowerCase(Locale.ROOT).trim();
        if (texto.isBlank()) {
            return memory != null ? memory.lastModeOr(DoctorChatMode.AVALIACAO_BASICA) : DoctorChatMode.AVALIACAO_BASICA;
        }

        if (isFollowUpReferencial(descricao, memory)) {
            if (memoriaIndicaPraga(memory) && (containsAny(texto, KEYWORDS_IDENTIFICACAO_VISUAL) || texto.contains("como tratar") || texto.contains("sinais"))) {
                return texto.contains("como tratar") ? DoctorChatMode.PRAGA : DoctorChatMode.CONHECIMENTO_GERAL;
            }
            return memory.lastModeOr(DoctorChatMode.AVALIACAO_BASICA);
        }

        boolean temSinalAvaliacao = KEYWORDS_AVALIACAO.stream().anyMatch(texto::contains);
        boolean temSinalTecnica = KEYWORDS_TECNICA.stream().anyMatch(texto::contains);
        boolean temSinalPraga = KEYWORDS_PRAGA.stream().anyMatch(texto::contains);
        boolean temSinalConhecimento = KEYWORDS_CONHECIMENTO.stream().anyMatch(texto::contains);

        if (temSinalTecnica) {
            return DoctorChatMode.AVALIACAO_TECNICA;
        }

        if (temSinalPraga) {
            return DoctorChatMode.PRAGA;
        }

        if (containsAny(texto, KEYWORDS_IDENTIFICACAO_VISUAL) && (temSinalPraga || memoriaIndicaPraga(memory))) {
            return DoctorChatMode.CONHECIMENTO_GERAL;
        }

        if (temSinalConhecimento && !temSinalAvaliacao) {
            return DoctorChatMode.CONHECIMENTO_GERAL;
        }

        return DoctorChatMode.AVALIACAO_BASICA;
    }

    private DoctorChatIntentClassification inferirIntentLocal(String descricao, DoctorChatMode modo, DoctorConversationMemory memory) {
        String texto = valor(descricao).toLowerCase(Locale.ROOT);
        if (texto.isBlank()) {
            return DoctorChatIntentClassification.fallback();
        }
        if (pedeContextoDeEstagio(texto) && !containsAny(texto, KEYWORDS_AVALIACAO)) {
            return new DoctorChatIntentClassification(DoctorChatIntent.LEITURA_ESTAGIO, "média", "há sinais claros de estágio/fase na pergunta", List.of("estágio/fase"), "LEVE", false);
        }
        if (modo == DoctorChatMode.CONHECIMENTO_GERAL) {
            String scope = containsAny(texto, KEYWORDS_IDENTIFICACAO_VISUAL) ? "LEVE" : "NENHUM";
            String reason = containsAny(texto, KEYWORDS_IDENTIFICACAO_VISUAL)
                    ? "modo de curiosidade com foco em identificação visual favorece resposta educativa ancorada no tópico atual"
                    : "modo de curiosidade favorece consulta conceitual";
            return new DoctorChatIntentClassification(DoctorChatIntent.DEFINICAO, "média", reason, List.of("modo curiosidade"), scope, false);
        }
        if (modo == DoctorChatMode.AVALIACAO_TECNICA) {
            return new DoctorChatIntentClassification(DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO, "média", "modo técnico favorece diagnóstico especializado", List.of("modo técnico"), "COMPLETO", false);
        }
        if (modo == DoctorChatMode.PRAGA) {
            return new DoctorChatIntentClassification(DoctorChatIntent.DIAGNOSTICO_GERAL, "média", "modo praga favorece triagem sanitária", List.of("modo praga"), "LEVE", false);
        }
        if (containsAny(texto, KEYWORDS_CONHECIMENTO) && !containsAny(texto, KEYWORDS_AVALIACAO)) {
            return new DoctorChatIntentClassification(DoctorChatIntent.DEFINICAO, "média", "a pergunta é conceitual", List.of("curiosidade/conceito"), "NENHUM", false);
        }
        if (containsAny(texto, KEYWORDS_TECNICA)) {
            return new DoctorChatIntentClassification(DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO, "média", "há termos instrumentais na pergunta", List.of("telemetria"), "COMPLETO", false);
        }
        if (containsAny(texto, List.of("como tratar", "o que fazer", "como corrigir", "posso aplicar", "como podar"))) {
            return new DoctorChatIntentClassification(DoctorChatIntent.RECOMENDACAO_MANEJO, "média", "há pedido explícito de ação", List.of("ação/manejo"), "LEVE", false);
        }
        if (containsAny(texto, KEYWORDS_IDENTIFICACAO_VISUAL) && (containsAny(texto, KEYWORDS_PRAGA) || memoriaIndicaPraga(memory))) {
            return new DoctorChatIntentClassification(DoctorChatIntent.DEFINICAO, "média", "há pedido educativo de identificação visual ligado a praga já explícita ou ativa na memória", List.of("identificação visual"), "LEVE", memory != null && memory.hasEntity());
        }
        if (containsAny(texto, KEYWORDS_AVALIACAO) || containsAny(texto, KEYWORDS_PRAGA)) {
            return new DoctorChatIntentClassification(DoctorChatIntent.DIAGNOSTICO_GERAL, "média", "há relato de sintoma ou sinal visual", List.of("sintoma visual"), "LEVE", false);
        }
        if (isFollowUpReferencial(descricao, memory) && memory != null) {
            DoctorChatIntent carry = memory.lastIntentOr(DoctorChatIntent.TRIAGEM_AMBIGUA);
            return new DoctorChatIntentClassification(carry, "média", "continuidade do tópico anterior", List.of("memória recente"), carry == DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO ? "COMPLETO" : "LEVE", true);
        }
        return DoctorChatIntentClassification.fallback();
    }

    private boolean deveInjetarApoioDecisao(DoctorChatIntent intent) {
        return intent == DoctorChatIntent.DIAGNOSTICO_GERAL
                || intent == DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO
                || intent == DoctorChatIntent.RECOMENDACAO_MANEJO;
    }

    private boolean deveInjetarMemoriaCurta(DoctorChatIntent intent, String contextoUsuario, DoctorConversationMemory memory) {
        if (memory == null || (!memory.hasTopic() && !memory.hasEntity())) {
            return false;
        }
        return intent != DoctorChatIntent.DEFINICAO || isFollowUpReferencial(contextoUsuario, memory);
    }

    private boolean deveInjetarResumoConversa(DoctorChatIntent intent, String contextoUsuario, DoctorConversationMemory memory) {
        if (memory == null || (memory.resumoCurto() == null || memory.resumoCurto().isBlank())) {
            return false;
        }
        return intent != DoctorChatIntent.DEFINICAO || isFollowUpReferencial(contextoUsuario, memory);
    }

    private boolean deveInjetarHistorico(DoctorChatIntent intent, String contextoUsuario, DoctorConversationMemory memory) {
        if (intent == DoctorChatIntent.DEFINICAO) {
            return isFollowUpReferencial(contextoUsuario, memory);
        }
        return intent == DoctorChatIntent.DIAGNOSTICO_GERAL
                || intent == DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO
                || intent == DoctorChatIntent.RECOMENDACAO_MANEJO;
    }

    private boolean deveInjetarContextoEstruturado(DoctorChatIntent intent) {
        return intent == DoctorChatIntent.DIAGNOSTICO_GERAL
                || intent == DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO
                || intent == DoctorChatIntent.RECOMENDACAO_MANEJO
                || intent == DoctorChatIntent.LEITURA_ESTAGIO;
    }

    private boolean deveInjetarFatosDoCaso(DoctorChatIntent intent) {
        return intent != DoctorChatIntent.DEFINICAO;
    }

    private boolean deveUsarContratoEvidencia(DoctorChatIntent intent) {
        return intent != DoctorChatIntent.DEFINICAO;
    }

    private boolean deveUsarClima(DoctorChatIntent intent) {
        return intent == DoctorChatIntent.DIAGNOSTICO_GERAL
                || intent == DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO
                || intent == DoctorChatIntent.RECOMENDACAO_MANEJO;
    }

    private String contextoPlanta(DoctorPlantAnalysisContext context, DoctorChatMode modo, DoctorChatIntent intent) {
        if (context == null) {
            return "";
        }
        if (intent == DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO) {
            return context.toPromptBlock();
        }
        StringBuilder sb = new StringBuilder();
        if (context.metadados() != null) {
            sb.append("estagio: ").append(valor(context.metadados().estagio())).append("\n");
            sb.append("strain: ").append(valor(context.metadados().strain())).append("\n");
            sb.append("tipo_ciclo: ").append(valor(context.metadados().tipoCiclo())).append("\n");
        }
        if ((intent == DoctorChatIntent.DIAGNOSTICO_GERAL || intent == DoctorChatIntent.RECOMENDACAO_MANEJO) && context.telemetria() != null) {
            sb.append("ultima_observacao: ").append(valor(context.telemetria().ultimaObservacao())).append("\n");
            sb.append("ultima_rega: ").append(valor(context.telemetria().ultimaRega())).append("\n");
        }
        return sb.toString().trim();
    }

    private String climaAtual(DoctorChatMode modo, DoctorChatIntent intent) {
        if (!deveUsarClima(intent) || modo == DoctorChatMode.CONHECIMENTO_GERAL) {
            return "";
        }

        try {
            weatherService.updateWeather();
            if (weatherService.getTemperature() == null && weatherService.getHumidity() == null && weatherService.getPrecipitation() == null) {
                return "";
            }

            return "local: " + valor(weatherService.getLocation()) + "\n" +
                    "temperatura_c: " + valorNumero(weatherService.getTemperature()) + "\n" +
                    "umidade_percent: " + valorNumero(weatherService.getHumidity()) + "\n" +
                    "precipitacao_mm_1h: " + valorNumero(weatherService.getPrecipitation());
        } catch (Exception ex) {
            return "";
        }
    }

    private String textoBusca(Planta planta, DoctorPlantAnalysisContext context, String contextoUsuario, DoctorChatMode modo, DoctorChatIntent intent) {
        return switch (intent) {
            case DEFINICAO -> String.join(" ", contextoUsuario, pedeContextoDeEstagio(contextoUsuario) ? valor(planta != null && planta.getEstagio() != null ? planta.getEstagio().name() : null) : "");
            case LEITURA_ESTAGIO -> String.join(" ",
                    valor(planta != null && planta.getEstagio() != null ? planta.getEstagio().name() : null),
                    contextoUsuario,
                    valor(context != null && context.metadados() != null ? context.metadados().tipoCiclo() : null)
            );
            case DIAGNOSTICO_GERAL, RECOMENDACAO_MANEJO -> String.join(" ",
                    valor(planta != null ? planta.getNome() : null),
                    valor(planta != null && planta.getEstagio() != null ? planta.getEstagio().name() : null),
                    valor(context != null && context.metadados() != null ? context.metadados().tipoCiclo() : null),
                    contextoUsuario,
                    valor(context != null && context.telemetria() != null ? context.telemetria().ultimaObservacao() : null),
                    valor(context != null && context.telemetria() != null ? context.telemetria().ultimaRega() : null)
            );
            case DIAGNOSTICO_ESPECIALIZADO -> String.join(" ",
                    valor(planta != null ? planta.getNome() : null),
                    valor(planta != null && planta.getEstagio() != null ? planta.getEstagio().name() : null),
                    valor(context != null ? context.toSearchText() : null),
                    contextoUsuario
            );
            case TRIAGEM_AMBIGUA -> contextoUsuario;
        };
    }

    public String textoBusca(Planta planta, DoctorPlantAnalysisContext context, String contextoUsuario, DoctorChatMode modo, DoctorChatIntent intent, DoctorConversationMemory memory, DoctorPlantCodexContext codexContext) {
        String base = textoBusca(planta, context, contextoUsuario, modo, intent);
        String comCodex = codexContext == null || codexContext.isEmpty()
                ? base
                : String.join(" ", base, valor(codexContext.searchText()));

        if (memory == null || !memory.hasTopic()) {
            return comCodex;
        }

        if (isFollowUpReferencial(contextoUsuario, memory)) {
            return String.join(" ", comCodex, valor(memory.topicoAtual()), valor(memory.entidadeAtual()), valor(memory.ultimaPerguntaUsuario()));
        }
        return comCodex;
    }

    public String textoBusca(Planta planta, DoctorPlantAnalysisContext context, String contextoUsuario, DoctorChatMode modo, DoctorChatIntent intent, DoctorConversationMemory memory) {
        return textoBusca(planta, context, contextoUsuario, modo, intent, memory, DoctorPlantCodexContext.empty());
    }

    private String memoriaCurta(DoctorConversationMemory memory) {
        return memory == null ? "" : memory.toPromptBlock();
    }

    private String resumoPrompt(DoctorConversationMemory memory, String resumoConversa) {
        if (memory != null && memory.resumoCurto() != null && !memory.resumoCurto().isBlank()) {
            return memory.resumoCurto();
        }
        return resumoConversa;
    }

    private String especialistaAuxiliar(DoctorChatMode modo, DoctorChatIntent intent, String contextoUsuario, DoctorPlantAnalysisContext context, DoctorConversationMemory memory) {
        if (!deveConsultarEspecialistaPraga(modo, intent, contextoUsuario, context, memory)) {
            return "";
        }
        return promptManager.buildSpecialistBlock(DoctorChatMode.PRAGA);
    }

    private String referenciasEspecialistaPraga(Planta planta, DoctorPlantAnalysisContext context, String contextoUsuario, DoctorChatMode modo, DoctorChatIntent intent, DoctorConversationMemory memory, DoctorPlantCodexContext codexContext) {
        if (!deveConsultarEspecialistaPraga(modo, intent, contextoUsuario, context, memory)) {
            return "";
        }
        return knowledgeBase.buildReferenceContext(planta, textoBusca(planta, context, contextoUsuario, DoctorChatMode.PRAGA, DoctorChatIntent.DIAGNOSTICO_GERAL, memory, codexContext), DoctorChatMode.PRAGA, DoctorChatIntent.DIAGNOSTICO_GERAL);
    }

    private boolean deveConsultarEspecialistaPraga(DoctorChatMode modo, DoctorChatIntent intent, String descricao, DoctorPlantAnalysisContext context, DoctorConversationMemory memory) {
        if (intent == DoctorChatIntent.DEFINICAO || intent == DoctorChatIntent.LEITURA_ESTAGIO || modo == DoctorChatMode.CONHECIMENTO_GERAL) {
            return false;
        }

        String texto = valor(descricao).toLowerCase(Locale.ROOT);
        if (KEYWORDS_PRAGA.stream().anyMatch(texto::contains)) {
            return true;
        }

        if (context != null && context.metadados() != null && Boolean.TRUE.equals(context.metadados().pragaAtiva())) {
            return true;
        }

        if (context != null && context.historicoSaude() != null) {
            String historicoPraga = (valor(context.historicoSaude().ultimoSinalPraga()) + " " + valor(context.historicoSaude().ultimoTratamento())).toLowerCase(Locale.ROOT);
            if (KEYWORDS_PRAGA.stream().anyMatch(historicoPraga::contains)) {
                return true;
            }
        }

        return memoriaIndicaPraga(memory);
    }

    private boolean memoriaIndicaPraga(DoctorConversationMemory memory) {
        if (memory == null) {
            return false;
        }

        String combinado = String.join(" ",
                valor(memory.topicoAtual()),
                valor(memory.entidadeAtual()),
                valor(memory.ultimaPerguntaUsuario())
        ).toLowerCase(Locale.ROOT);
        return KEYWORDS_PRAGA.stream().anyMatch(combinado::contains);
    }

    private boolean temSinalForteDeNovoCaso(String texto) {
        if (texto == null || texto.isBlank()) {
            return false;
        }

        boolean temSintomaNovo = containsAny(texto, KEYWORDS_AVALIACAO)
                || containsAny(texto, KEYWORDS_PRAGA)
                || containsAny(texto, List.of("o que fazer", "oq fazer", "como resolver", "como tratar", "como corrigir", "apareceu", "amarelou", "amarelando", "murchou", "queimou", "travou", "caiu", "manchou"));

        if (containsAny(texto, KEYWORDS_IDENTIFICACAO_VISUAL) && !texto.contains("minha planta") && !texto.contains("essa planta") && !texto.contains("esta planta")) {
            return false;
        }

        boolean ehPerguntaReferencialCurta = texto.length() <= 40 && (
                texto.contains("como assim")
                        || texto.equals("isso?")
                        || texto.equals("isso")
                        || texto.contains("ele")
                        || texto.contains("ela")
                        || texto.contains("causado")
                        || texto.contains("nasce")
                        || texto.contains("por quê")
                        || texto.contains("porque?")
        );

        return temSintomaNovo && !ehPerguntaReferencialCurta;
    }

    private boolean temMudancaClaraDeAssunto(String texto) {
        return texto.contains("agora") || texto.contains("outro assunto") || texto.contains("mudando de assunto") || texto.contains("nova pergunta") || texto.contains("sobre outra coisa") || texto.contains("terpen") || texto.contains("curiosidade") || texto.contains("história") || texto.contains("historia");
    }

    private boolean isConhecimentoGeralPuro(String texto, DoctorChatMode modo) {
        if (modo != DoctorChatMode.CONHECIMENTO_GERAL) {
            return false;
        }

        String normalizado = valor(texto).toLowerCase(Locale.ROOT);
        boolean mencionaPlanta = containsAny(normalizado, List.of("minha planta", "essa planta", "esta planta", "folha", "folhas", "amarel", "murch", "mancha", "queimad", "praga", "rega", "substrato"));
        boolean perguntaDeFonte = containsAny(normalizado, List.of("bíblia", "biblia", "bible", "guia", "livro", "fonte", "interessante", "curiosidade", "o que tem de interessante"));
        return perguntaDeFonte && !mencionaPlanta;
    }

    private boolean pedeContextoDeEstagio(String texto) {
        String normalizado = valor(texto).toLowerCase(Locale.ROOT);
        return containsAny(normalizado, List.of("estágio", "estagio", "flora", "floração", "floracao", "vegetativo", "vegetativa", "germinação", "germinacao", "finalização", "finalizacao", "na fase", "nesse estágio", "nesse estagio"));
    }

    private String historicoRecente(List<DoctorChatMessage> historico) {
        if (historico == null || historico.isEmpty()) {
            return "";
        }

        List<DoctorChatMessage> janela = historico.stream()
                .filter(message -> message != null && message.getRole() != DoctorChatMessageRole.SYSTEM)
                .skip(Math.max(0, historico.size() - 4L))
                .toList();

        StringBuilder sb = new StringBuilder();
        for (DoctorChatMessage message : janela) {
            if (message.getContent() == null || message.getContent().isBlank()) {
                continue;
            }
            String role = message.getRole() == DoctorChatMessageRole.ASSISTANT ? "ASSISTANT" : "USER";
            String conteudo = resumirHistorico(message.getContent(), message.getRole());
            if (conteudo.isBlank()) {
                continue;
            }
            LocalDateTime createdAt = message.getCreatedAt();
            String stamp = createdAt != null ? createdAt.format(CHAT_TIME_FORMAT) : "sem-data";
            sb.append("- [")
                    .append(stamp)
                    .append("] ")
                    .append(role)
                    .append(": ")
                    .append(conteudo)
                    .append("\n");
        }
        return sb.toString().trim();
    }

    private String resumirHistorico(String conteudo, DoctorChatMessageRole role) {
        String normalizado = sanitizar(conteudo);
        if (normalizado.isBlank()) {
            return "";
        }
        if (role == DoctorChatMessageRole.ASSISTANT) {
            return truncar(normalizado, 160);
        }
        return truncar(normalizado, 120);
    }

    private String truncar(String valor, int max) {
        if (valor == null || valor.isBlank()) {
            return "";
        }
        String normalizado = valor.trim().replaceAll("\\s+", " ");
        return normalizado.length() <= max ? normalizado : normalizado.substring(0, Math.max(0, max - 3)) + "...";
    }

    private String valor(String valor) {
        return valor == null || valor.isBlank() ? "não informado" : valor;
    }

    private String valorNumero(Double valor) {
        if (valor == null) {
            return "não informado";
        }
        return String.format(Locale.US, "%.2f", valor);
    }

    private String sanitizar(String valor) {
        return new String(valor.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8).replace("\n", " ").trim();
    }

    private record PromptAssembly(
            String prompt,
            ReferenceContextResult referenceResult,
            DoctorPlantCodexContext codexContext,
            boolean usedPestSpecialist,
            DoctorAnalysisPlan analysisPlan,
            DoctorDecisionSupport decisionSupport
    ) {
    }

}