package cultivo.api.application.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import cultivo.api.api.controller.planta.DadosDoctorChatMensagem;
import cultivo.api.api.controller.planta.DadosDoctorChatRespostaEnvio;
import cultivo.api.api.controller.planta.DadosDoctorChatSessao;
import cultivo.api.domain.doctor.DoctorChatMessage;
import cultivo.api.domain.doctor.DoctorChatMessageRole;
import cultivo.api.domain.doctor.DoctorChatSession;
import cultivo.api.domain.doctor.DoctorChatSessionStatus;
import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.doctor.DoctorChatMessageRepository;
import cultivo.api.infrastructure.persistence.doctor.DoctorChatSessionRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import cultivo.api.infrastructure.security.AccessControl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DoctorChatService {

    private static final int MAX_ASSISTANT_CONTENT = 32000;
    private static final int MAX_METADATA_CONTENT = 12000;

    private final DoctorChatSessionRepository sessionRepository;
    private final DoctorChatMessageRepository messageRepository;
    private final PlantaRepository plantaRepository;
    private final PlantaImagemAnaliseService analiseService;
    private final DoctorPlantContextBuilder contextBuilder;
    private final DoctorChatIntentClassifier intentClassifier;
    private final DoctorResponseValidator responseValidator;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DoctorChatService(
            DoctorChatSessionRepository sessionRepository,
            DoctorChatMessageRepository messageRepository,
            PlantaRepository plantaRepository,
            PlantaImagemAnaliseService analiseService,
            DoctorPlantContextBuilder contextBuilder,
            DoctorChatIntentClassifier intentClassifier,
            DoctorResponseValidator responseValidator
    ) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.plantaRepository = plantaRepository;
        this.analiseService = analiseService;
        this.contextBuilder = contextBuilder;
        this.intentClassifier = intentClassifier;
        this.responseValidator = responseValidator;
    }

    @Transactional
    public DadosDoctorChatSessao obterSessaoAtiva(Long plantaId, Usuario usuario) {
        Planta planta = validarAcesso(plantaId, usuario);
        DoctorChatSession session = sessionRepository
                .findFirstByUsuarioIdAndPlantaIdAndStatusOrderByUpdatedAtDesc(usuario.getId(), plantaId, DoctorChatSessionStatus.ATIVA)
                .orElseGet(() -> criarSessao(planta, usuario));

        List<DoctorChatMessage> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId());
        return toDto(session, messages);
    }

    @Transactional
    public DadosDoctorChatSessao criarOuReutilizarSessao(Long plantaId, Usuario usuario) {
        Planta planta = validarAcesso(plantaId, usuario);
        DoctorChatSession session = sessionRepository
                .findFirstByUsuarioIdAndPlantaIdAndStatusOrderByUpdatedAtDesc(usuario.getId(), plantaId, DoctorChatSessionStatus.ATIVA)
                .orElseGet(() -> criarSessao(planta, usuario));
        List<DoctorChatMessage> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId());
        return toDto(session, messages);
    }

    @Transactional
    public DadosDoctorChatSessao reiniciarSessao(Long plantaId, Usuario usuario) {
        Planta planta = validarAcesso(plantaId, usuario);

        sessionRepository
                .findFirstByUsuarioIdAndPlantaIdAndStatusOrderByUpdatedAtDesc(usuario.getId(), plantaId, DoctorChatSessionStatus.ATIVA)
                .ifPresent(session -> {
                    session.encerrar();
                    sessionRepository.save(session);
                });

        DoctorChatSession novaSessao = criarSessao(planta, usuario);
        return toDto(novaSessao, List.of());
    }

    @Transactional
    public DadosDoctorChatRespostaEnvio enviarMensagem(Long plantaId, String mensagem, String modoSolicitado, Usuario usuario) {
        Planta planta = validarAcesso(plantaId, usuario);
        DoctorChatSession session = sessionRepository
                .findFirstByUsuarioIdAndPlantaIdAndStatusOrderByUpdatedAtDesc(usuario.getId(), plantaId, DoctorChatSessionStatus.ATIVA)
                .orElseGet(() -> criarSessao(planta, usuario));

        String userInput = sanitizeText(mensagem, 1200);
        if (userInput == null) {
            throw new IllegalArgumentException("Mensagem é obrigatória.");
        }

        DoctorPlantAnalysisContext contexto = contextBuilder.build(planta);
        DoctorConversationMemory memory = parseConversationMemory(session.getConversationSummary());
        DoctorChatMode modoSolicitadoEnum = DoctorChatMode.fromValue(modoSolicitado);
        DoctorChatIntentClassification intentClassification = intentClassifier.classify(userInput, modoSolicitadoEnum, memory);
        DoctorChatMode modo = analiseService.resolverModoResposta(userInput, modoSolicitadoEnum, memory, intentClassification);

        List<DoctorChatMessage> latestHistory = messageRepository.findTop12BySessionIdOrderByCreatedAtDesc(session.getId()).stream()
                .sorted(Comparator.comparing(DoctorChatMessage::getCreatedAt))
                .collect(Collectors.toList());
        if (modo == DoctorChatMode.CONHECIMENTO_GERAL && !analiseService.isFollowUpReferencial(userInput, memory)) {
            latestHistory = latestHistory.stream()
                    .skip(Math.max(0, latestHistory.size() - 2L))
                    .collect(Collectors.toList());
        }

        DoctorChatMessage userMessage = messageRepository.save(new DoctorChatMessage(session, DoctorChatMessageRole.USER, userInput, null));

        DoctorAnalysisOutcome analysis = analiseService.analisarConversaDetalhada(
                planta,
                userInput,
                contexto,
                memory,
                memory != null ? memory.resumoCurto() : session.getConversationSummary(),
                latestHistory,
                modo,
                intentClassification
        );

        DoctorResponseValidator.ValidationResult validation = responseValidator.review(
                userInput,
                analysis.response().resposta(),
                modo,
                intentClassification,
                analysis.diagnostics(),
                memory
        );
        String resposta = sanitizeText(validation.content(), MAX_ASSISTANT_CONTENT);

        DoctorChatMessage assistantMessage = messageRepository.save(new DoctorChatMessage(
                session,
                DoctorChatMessageRole.ASSISTANT,
                resposta,
                buildAssistantMetadata(contexto, modo, intentClassification, analysis.diagnostics(), validation)
        ));

        DoctorConversationMemory updatedMemory = updateConversationMemory(memory, userInput, resposta, modo, intentClassification);
        session.atualizarResumo(writeConversationMemory(updatedMemory));
        sessionRepository.save(session);

        return new DadosDoctorChatRespostaEnvio(session.getId(), modo.name(), toDto(userMessage), toDto(assistantMessage));
    }

    private String buildAssistantMetadata(
            DoctorPlantAnalysisContext contexto,
            DoctorChatMode modo,
            DoctorChatIntentClassification intentClassification,
            DoctorAnalysisDiagnostics diagnostics,
            DoctorResponseValidator.ValidationResult validation
    ) {
        try {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("modoUsado", modo.name());
            metadata.put("intencaoDetectada", diagnostics != null && diagnostics.detectedIntent() != null
                    ? diagnostics.detectedIntent().name()
                    : intentClassification.safeIntent().name());
            metadata.put("confiancaRoteamento", diagnostics != null ? diagnostics.routingConfidence() : intentClassification.confidence());
            metadata.put("motivoRoteamento", diagnostics != null ? diagnostics.routingReason() : intentClassification.reason());
            metadata.put("sinaisDisparadores", limitList(diagnostics != null ? diagnostics.routingSignals() : intentClassification.triggerSignals(), 6));
            metadata.put("escopoContexto", diagnostics != null ? diagnostics.contextScope() : intentClassification.contextScope());
            metadata.put("queryRecuperacao", truncate(diagnostics != null ? diagnostics.retrievalQuery() : null, 220));
            metadata.put("fontesRecuperadas", limitList(diagnostics != null ? diagnostics.referenceSources() : List.of(), 5));
            metadata.put("groundingLocalForte", diagnostics != null && diagnostics.strongLocalGrounding());
            metadata.put("rotaTema", diagnostics != null ? diagnostics.routeTopic() : null);
            metadata.put("rotaTopicos", limitList(diagnostics != null ? diagnostics.routeTopics() : List.of(), 4));
            metadata.put("idiomasPreferidos", limitList(diagnostics != null ? diagnostics.preferredLanguages() : List.of(), 3));
            metadata.put("bibleObrigatoria", diagnostics != null && diagnostics.mandatoryBible());
            metadata.put("usouCodex", diagnostics != null && diagnostics.usedCodex());
            metadata.put("estagioCodex", diagnostics != null ? diagnostics.codexStage() : null);
            metadata.put("usouEspecialistaPraga", diagnostics != null && diagnostics.usedPestSpecialist());
            metadata.put("hipotesesConsideradas", limitList(diagnostics != null ? diagnostics.hypothesesConsidered() : List.of(), 4));
            metadata.put("dadosCriticosFaltantes", limitList(diagnostics != null ? diagnostics.criticalMissingData() : contexto.lacunasCriticas(), 4));
            metadata.put("bloqueadaPorEvidencia", diagnostics != null && diagnostics.blockedByEvidenceGate());
            metadata.put("validacaoResposta", Map.of(
                    "status", validation.status(),
                    "fallbackUsado", validation.fallbackUsed(),
                    "motivos", limitList(validation.reasons(), 4)
            ));
            return truncate(objectMapper.writeValueAsString(metadata), MAX_METADATA_CONTENT);
        } catch (Exception ex) {
            return null;
        }
    }

    private DoctorConversationMemory parseConversationMemory(String raw) {
        if (raw == null || raw.isBlank()) {
            return new DoctorConversationMemory(null, null, null, null, null, null, null);
        }
        try {
            return objectMapper.readValue(raw, DoctorConversationMemory.class);
        } catch (Exception ex) {
            return new DoctorConversationMemory(null, null, truncate(raw, 240), null, null, null, null);
        }
    }

    private String writeConversationMemory(DoctorConversationMemory memory) {
        try {
            return truncate(objectMapper.writeValueAsString(memory), MAX_ASSISTANT_CONTENT);
        } catch (Exception ex) {
            return memory != null ? memory.resumoCurto() : null;
        }
    }

    private DoctorConversationMemory updateConversationMemory(
            DoctorConversationMemory previous,
            String userMessage,
            String assistantReply,
            DoctorChatMode mode,
            DoctorChatIntentClassification intentClassification
    ) {
        String entity = resolveEntity(previous, userMessage, assistantReply, mode, intentClassification.safeIntent());
        String topic = resolveTopic(previous, userMessage, assistantReply, mode, intentClassification.safeIntent(), entity);
        String resumo = buildShortSummary(topic, entity, userMessage, assistantReply, mode, intentClassification.safeIntent());

        return new DoctorConversationMemory(
                topic,
                entity,
                resumo,
                truncate(userMessage, 180),
                truncate(assistantReply, 120),
                mode.name(),
                intentClassification.safeIntent().name()
        );
    }

    private String resolveTopic(DoctorConversationMemory previous, String userMessage, String assistantReply, DoctorChatMode mode, DoctorChatIntent intent, String resolvedEntity) {
        String lower = userMessage.toLowerCase();
        if (previous != null && analiseService.isFollowUpReferencial(userMessage, previous)) {
            if (previous.hasTopic()) {
                return previous.topicoAtual();
            }
            if (previous.hasEntity()) {
                return previous.entidadeAtual();
            }
        }
        if (resolvedEntity != null && !resolvedEntity.isBlank() && (intent == DoctorChatIntent.DEFINICAO || mode == DoctorChatMode.PRAGA)) {
            return resolvedEntity;
        }
        if (intent == DoctorChatIntent.DEFINICAO && lower.contains("tripe")) return "tripes";
        if (intent == DoctorChatIntent.LEITURA_ESTAGIO) return "leitura de estágio";
        if (intent == DoctorChatIntent.RECOMENDACAO_MANEJO) return firstNonBlank(previous != null ? previous.topicoAtual() : null, "recomendação de manejo");
        if (lower.contains("tripe")) return "tripes";
        if (lower.contains("praga")) return "pragas";
        if (lower.contains("amarel") || lower.contains("clorose")) return "amarelamento foliar";
        if (lower.contains("murch") || lower.contains("caid") || lower.contains("mole") || lower.contains("tomb")) return "murcha ou queda foliar";
        if (lower.contains("mancha") || lower.contains("queimad") || lower.contains("ponta")) return "manchas ou queimadura foliar";
        if (lower.contains("ph") || lower.contains("ec") || lower.contains("ppm") || lower.contains("runoff")) return "medições e nutrição";
        if (lower.contains("floração") || lower.contains("floracao") || lower.contains("tricoma") || lower.contains("pistilo")) return "avaliação visual da floração";
        if (mode == DoctorChatMode.CONHECIMENTO_GERAL) return firstNonBlank(previous != null ? previous.topicoAtual() : null, "conhecimento geral sobre cannabis");
        if (mode == DoctorChatMode.AVALIACAO_TECNICA) return firstNonBlank(previous != null ? previous.topicoAtual() : null, "avaliação técnica da planta");
        if (mode == DoctorChatMode.PRAGA) return firstNonBlank(previous != null ? previous.topicoAtual() : null, "pragas e sinais de infestação");
        return firstNonBlank(previous != null ? previous.topicoAtual() : null, "avaliação básica da planta");
    }

    private String resolveEntity(DoctorConversationMemory previous, String userMessage, String assistantReply, DoctorChatMode mode, DoctorChatIntent intent) {
        String lower = userMessage.toLowerCase();
        if (previous != null && analiseService.isFollowUpReferencial(userMessage, previous) && previous.hasEntity()) {
            return previous.entidadeAtual();
        }
        if (lower.contains("tripe")) return "tripes";
        if (lower.contains("ácar") || lower.contains("acaro") || lower.contains("ácaro")) return "ácaros";
        if (lower.contains("mosca branca")) return "mosca branca";
        if (lower.contains("pulg")) return "pulgões";
        if (lower.contains("cochonilha")) return "cochonilhas";
        if (lower.contains("folha") || lower.contains("folhas")) return "folhas";
        if (lower.contains("pistilo")) return "pistilos";
        if (lower.contains("tricoma")) return "tricomas";
        if (lower.contains("ph")) return "pH";
        if (lower.contains("ec")) return "EC";
        return previous != null ? previous.entidadeAtual() : null;
    }

    private String buildShortSummary(String topic, String entity, String userMessage, String assistantReply, DoctorChatMode mode, DoctorChatIntent intent) {
        return "Tópico atual: " + firstNonBlank(topic, "sem tópico")
                + ". Entidade ativa: " + firstNonBlank(entity, "não definida")
                + ". Última pergunta: " + truncate(userMessage, 110)
                + ". Último modo: " + mode.name()
                + ". Última intenção: " + intent.name()
                + ". Última resposta validada: " + truncate(assistantReply, 100);
    }

    private List<String> limitList(List<String> values, int max) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .limit(max)
                .map(value -> truncate(value, 180))
                .toList();
    }

    private String sanitizeText(String value, int max) {
        return truncate(value, max);
    }

    private String truncate(String value, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        if (trimmed.length() <= max) {
            return trimmed;
        }
        return trimmed.substring(0, Math.max(0, max - 3)) + "...";
    }

    private String firstNonBlank(String first, String fallback) {
        return first != null && !first.isBlank() ? first : fallback;
    }

    private DoctorChatSession criarSessao(Planta planta, Usuario usuario) {
        DoctorChatSession session = new DoctorChatSession(usuario, planta, "Doctor P. - " + planta.getNome());
        return sessionRepository.save(session);
    }

    private Planta validarAcesso(Long plantaId, Usuario usuario) {
        if (usuario == null) {
            throw new IllegalArgumentException("Usuário não autenticado");
        }

        Planta planta = plantaRepository.findById(plantaId)
                .orElseThrow(() -> new IllegalArgumentException("Planta não encontrada"));

        if (!AccessControl.canReadPlanta(usuario, planta)) {
            throw new IllegalArgumentException("Acesso negado à planta");
        }
        return planta;
    }

    private DadosDoctorChatSessao toDto(DoctorChatSession session, List<DoctorChatMessage> messages) {
        return new DadosDoctorChatSessao(
                session.getId(),
                session.getStatus().name(),
                session.getTitulo(),
                session.getConversationSummary(),
                session.getCreatedAt(),
                session.getUpdatedAt(),
                messages.stream().map(this::toDto).toList()
        );
    }

    private DadosDoctorChatMensagem toDto(DoctorChatMessage message) {
        return new DadosDoctorChatMensagem(
                message.getId(),
                message.getRole().name(),
                message.getContent(),
                message.getCreatedAt(),
                message.getMetadataJson()
        );
    }
}
