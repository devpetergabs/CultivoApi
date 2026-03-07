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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DoctorChatService {

    private final DoctorChatSessionRepository sessionRepository;
    private final DoctorChatMessageRepository messageRepository;
    private final PlantaRepository plantaRepository;
    private final PlantaImagemAnaliseService analiseService;
    private final DoctorPlantContextBuilder contextBuilder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DoctorChatService(
            DoctorChatSessionRepository sessionRepository,
            DoctorChatMessageRepository messageRepository,
            PlantaRepository plantaRepository,
            PlantaImagemAnaliseService analiseService,
            DoctorPlantContextBuilder contextBuilder
    ) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.plantaRepository = plantaRepository;
        this.analiseService = analiseService;
        this.contextBuilder = contextBuilder;
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

        DoctorPlantAnalysisContext contexto = contextBuilder.build(planta);
        DoctorConversationMemory memory = parseConversationMemory(session.getConversationSummary());
        DoctorChatMode modo = analiseService.resolverModoResposta(mensagem.trim(), DoctorChatMode.fromValue(modoSolicitado), memory);

        List<DoctorChatMessage> latestHistoryDesc = messageRepository.findTop12BySessionIdOrderByCreatedAtDesc(session.getId());
        List<DoctorChatMessage> latestHistory = latestHistoryDesc.stream()
            .sorted(java.util.Comparator.comparing(DoctorChatMessage::getCreatedAt))
            .toList();
        if (modo == DoctorChatMode.CONHECIMENTO_GERAL && !analiseService.isFollowUpReferencial(mensagem.trim(), memory)) {
            latestHistory = latestHistory.stream()
                    .skip(Math.max(0, latestHistory.size() - 2L))
                    .collect(Collectors.toList());
        }

        DoctorChatMessage userMessage = new DoctorChatMessage(session, DoctorChatMessageRole.USER, mensagem.trim(), null);
        userMessage = messageRepository.save(userMessage);

        DoctorAnalysisOutcome analysis = analiseService.analisarConversaDetalhada(planta, mensagem.trim(), contexto, memory, memory != null ? memory.resumoCurto() : session.getConversationSummary(), latestHistory, modo);
        String resposta = analysis.response().resposta();

        DoctorChatMessage assistantMessage = new DoctorChatMessage(
                session,
                DoctorChatMessageRole.ASSISTANT,
                resposta,
            buildAssistantMetadata(contexto, modo, analysis.diagnostics())
        );
        assistantMessage = messageRepository.save(assistantMessage);

        DoctorConversationMemory updatedMemory = updateConversationMemory(memory, mensagem.trim(), resposta, modo);
        session.atualizarResumo(writeConversationMemory(updatedMemory));
        sessionRepository.save(session);

        return new DadosDoctorChatRespostaEnvio(session.getId(), modo.name(), toDto(userMessage), toDto(assistantMessage));
    }

    private String buildAssistantMetadata(DoctorPlantAnalysisContext contexto, DoctorChatMode modo, DoctorAnalysisDiagnostics diagnostics) {
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("contextoBusca", contexto.toSearchText());
            metadata.put("lacunasCriticas", contexto.lacunasCriticas());
            metadata.put("modoUsado", modo.name());
            metadata.put("queryRecuperacao", diagnostics != null ? diagnostics.retrievalQuery() : null);
            metadata.put("fontesRecuperadas", diagnostics != null ? diagnostics.referenceSources() : List.of());
            metadata.put("fontesDetalhadas", diagnostics != null ? diagnostics.referenceSourceDetails() : List.of());
            metadata.put("debugRecuperacao", diagnostics != null ? diagnostics.referenceDebug() : List.of());
            metadata.put("groundingLocalForte", diagnostics != null && diagnostics.strongLocalGrounding());
            metadata.put("rotaTema", diagnostics != null ? diagnostics.routeTopic() : null);
            metadata.put("rotaTopicos", diagnostics != null ? diagnostics.routeTopics() : List.of());
            metadata.put("idiomasPreferidos", diagnostics != null ? diagnostics.preferredLanguages() : List.of());
            metadata.put("bibleObrigatoria", diagnostics != null && diagnostics.mandatoryBible());
            metadata.put("relacoesCruzadas", diagnostics != null ? diagnostics.crossSourceSynthesis() : null);
            metadata.put("usouCodex", diagnostics != null && diagnostics.usedCodex());
            metadata.put("estagioCodex", diagnostics != null ? diagnostics.codexStage() : null);
            metadata.put("usouEspecialistaPraga", diagnostics != null && diagnostics.usedPestSpecialist());
            metadata.put("hipotesesConsideradas", diagnostics != null ? diagnostics.hypothesesConsidered() : List.of());
            metadata.put("dadosCriticosFaltantes", diagnostics != null ? diagnostics.criticalMissingData() : List.of());
            metadata.put("bloqueadaPorEvidencia", diagnostics != null && diagnostics.blockedByEvidenceGate());
            metadata.put("apoioDecisao", diagnostics != null ? diagnostics.decisionSupport() : null);
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception ex) {
            return null;
        }
    }

    private DoctorConversationMemory parseConversationMemory(String raw) {
        if (raw == null || raw.isBlank()) {
            return new DoctorConversationMemory(null, null, null, null, null, null);
        }
        try {
            return objectMapper.readValue(raw, DoctorConversationMemory.class);
        } catch (Exception ex) {
            return new DoctorConversationMemory(null, null, raw, null, null, null);
        }
    }

    private String writeConversationMemory(DoctorConversationMemory memory) {
        try {
            return objectMapper.writeValueAsString(memory);
        } catch (Exception ex) {
            return memory != null ? memory.resumoCurto() : null;
        }
    }

    private DoctorConversationMemory updateConversationMemory(DoctorConversationMemory previous, String userMessage, String assistantReply, DoctorChatMode mode) {
        String topic = resolveTopic(previous, userMessage, assistantReply, mode);
        String entity = resolveEntity(previous, userMessage, assistantReply);
        String resumo = buildShortSummary(topic, userMessage, assistantReply, mode);

        return new DoctorConversationMemory(
                topic,
                entity,
                resumo,
                truncate(userMessage, 180),
                truncate(assistantReply, 220),
                mode.name()
        );
    }

    private String resolveTopic(DoctorConversationMemory previous, String userMessage, String assistantReply, DoctorChatMode mode) {
        String lower = userMessage.toLowerCase();
        if (mode == DoctorChatMode.CONHECIMENTO_GERAL && previous != null && previous.hasTopic() && analiseService.isFollowUpReferencial(userMessage, previous)) {
            return previous.topicoAtual();
        }
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

    private String resolveEntity(DoctorConversationMemory previous, String userMessage, String assistantReply) {
        String lower = userMessage.toLowerCase();
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

    private String buildShortSummary(String topic, String userMessage, String assistantReply, DoctorChatMode mode) {
        return "Tópico atual: " + firstNonBlank(topic, "sem tópico")
                + ". Última pergunta: " + truncate(userMessage, 120)
                + ". Último modo: " + mode.name()
                + ". Última resposta: " + truncate(assistantReply, 140);
    }

    private String truncate(String value, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max) + "...";
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