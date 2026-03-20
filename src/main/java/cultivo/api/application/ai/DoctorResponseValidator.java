package cultivo.api.application.ai;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
public class DoctorResponseValidator {

    private static final int MAX_OUTPUT_CHARS = 12000;
    private static final List<String> INTERNAL_MARKERS = List.of(
            "[identidade base]",
            "[diretrizes do modo]",
            "[contrato de intenção]",
            "[guardrails gerais]",
            "[mapa mental e regras de negócio]",
            "[trechos relevantes das fontes locais]",
            "[fatos do caso e contexto operacional]",
            "[contrato de evidência para esta análise]",
            "[diagnóstico diferencial obrigatório]",
            "[mapa mental operacional do caso]",
            "[histórico recente da conversa]",
            "formato preferido",
            "guardrails",
            "contexto operacional",
            "contrato de evidência",
            "diagnóstico diferencial",
            "json bruto"
    );
    private static final List<String> PEST_TERMS = List.of(
            "tripe", "tripes", "thrips", "ácar", "acaro", "ácaro", "mosca branca", "pulg", "cochonilha",
            "pontinhos escuros", "raspagem prateada", "fezes escuras", "verso da folha"
    );
    private static final List<String> HARVEST_TERMS = List.of(
            "tricoma", "tricomas", "âmbar", "ambar", "leitoso", "leitosos", "pistilo", "pistilos",
            "colher", "colheita", "flora avançada", "flora avancada", "maturação", "maturacao"
    );
    private static final List<String> OFF_DOMAIN_TERMS = List.of(
            "veterin", "animal", "pata", "casco", "equino", "canino", "felino", "bovino", "cavalo", "cão", "cao"
    );
    private static final List<String> STAGE_RESPONSE_TERMS = List.of(
            "tricoma", "tricomas", "âmbar", "ambar", "leitoso", "leitosos", "pistilo", "pistilos", "janela", "colheita", "maturação", "maturacao"
    );
    private static final List<String> PEST_RESPONSE_TERMS = List.of(
            "tripes", "thrips", "praga", "inseto", "sugador", "raspagem prateada", "fezes escuras", "verso da folha", "pontilhado"
    );

    public ValidationResult review(
            String userMessage,
            String rawResponse,
            DoctorChatMode mode,
            DoctorChatIntentClassification intentClassification,
            DoctorAnalysisDiagnostics diagnostics,
            DoctorConversationMemory memory
    ) {
        String sanitized = normalize(rawResponse);
        Set<String> reasons = new LinkedHashSet<>();
        boolean fallbackUsed = false;

        if (sanitized.isBlank()) {
            reasons.add("resposta vazia");
            sanitized = fallbackFor(userMessage, intentClassification, diagnostics, memory);
            fallbackUsed = true;
        }

        String lowerResponse = sanitized.toLowerCase(Locale.ROOT);
        String lowerMessage = normalize(userMessage).toLowerCase(Locale.ROOT);
        DoctorChatIntent intent = intentClassification == null ? DoctorChatIntent.TRIAGEM_AMBIGUA : intentClassification.safeIntent();
        boolean pestContext = containsAny(lowerMessage, PEST_TERMS)
                || containsAny(lowerResponse, List.of("tripes", "thrips"))
                || (memory != null && containsAny(normalize(memory.activeTopicOrEntity()).toLowerCase(Locale.ROOT), PEST_TERMS))
                || (diagnostics != null && "pragas_manejo".equalsIgnoreCase(diagnostics.routeTopic()));
        boolean harvestContext = intent == DoctorChatIntent.LEITURA_ESTAGIO
                || containsAny(lowerMessage, HARVEST_TERMS)
                || (memory != null && containsAny(normalize(memory.activeTopicOrEntity()).toLowerCase(Locale.ROOT), HARVEST_TERMS));

        if (containsAny(lowerResponse, INTERNAL_MARKERS)) {
            reasons.add("vazamento de prompt interno");
            sanitized = fallbackFor(userMessage, intentClassification, diagnostics, memory);
            lowerResponse = sanitized.toLowerCase(Locale.ROOT);
            fallbackUsed = true;
        }

        if ((pestContext || harvestContext) && containsAny(lowerResponse, OFF_DOMAIN_TERMS)) {
            reasons.add("resposta saiu do domínio do cultivo");
            sanitized = fallbackFor(userMessage, intentClassification, diagnostics, memory);
            lowerResponse = sanitized.toLowerCase(Locale.ROOT);
            fallbackUsed = true;
        }

        if (pestContext && !containsAny(lowerResponse, PEST_RESPONSE_TERMS)) {
            reasons.add("resposta sem sinais mínimos de praga");
            sanitized = fallbackFor(userMessage, intentClassification, diagnostics, memory);
            lowerResponse = sanitized.toLowerCase(Locale.ROOT);
            fallbackUsed = true;
        }

        if (harvestContext && !containsAny(lowerResponse, STAGE_RESPONSE_TERMS)) {
            reasons.add("resposta sem sinais mínimos de estágio/colheita");
            sanitized = fallbackFor(userMessage, intentClassification, diagnostics, memory);
            lowerResponse = sanitized.toLowerCase(Locale.ROOT);
            fallbackUsed = true;
        }

        sanitized = truncate(sanitized, MAX_OUTPUT_CHARS);
        return new ValidationResult(sanitized, fallbackUsed ? "fallback" : "ok", new ArrayList<>(reasons), fallbackUsed);
    }

    private String fallbackFor(
            String userMessage,
            DoctorChatIntentClassification intentClassification,
            DoctorAnalysisDiagnostics diagnostics,
            DoctorConversationMemory memory
    ) {
        String message = normalize(userMessage).toLowerCase(Locale.ROOT);
        DoctorChatIntent intent = intentClassification == null ? DoctorChatIntent.TRIAGEM_AMBIGUA : intentClassification.safeIntent();

        if (containsAny(message, List.of("o que é tripes", "o que e tripes", "o que são tripes", "o que sao tripes"))) {
            return "Tripes são insetos-praga sugadores que raspam o tecido da folha e se alimentam da seiva. No cultivo, costumam deixar aspecto prateado, pontilhado claro e pequenos pontos escuros de fezes, principalmente quando você observa o verso da folha.";
        }
        if (containsAny(message, List.of("quais são os sinais de tripes", "quais sao os sinais de tripes", "como identificar tripes", "raspagem prateada", "pontinhos escuros"))) {
            return "Os sinais mais comuns de tripes são raspagem prateada, pontilhado claro, pequenas cicatrizes e fezes escuras. O melhor ponto para conferir é o verso das folhas, onde costuma aparecer o inseto fino e rápido e onde o dano fica mais evidente em folhas novas.";
        }
        if (containsAny(message, List.of("como tratar tripes", "como tratar", "o que fazer")) && containsAny(message, PEST_TERMS)) {
            return "Para manejo inicial de tripes, vale isolar o foco, reforçar inspeção no verso das folhas, remover partes muito atacadas e revisar a estratégia de controle sem atrasar a ação. O ideal é confirmar a praga primeiro e evitar aplicação aleatória, principalmente em floração avançada.";
        }
        if (containsAny(message, List.of("pulverizar", "flora avançada", "flora avancada"))) {
            return "Na flora avançada, pulverização pede cautela extra porque aumenta o risco de umidade retida e dano em flores. Antes de aplicar qualquer produto, confirme se o benefício compensa o risco na fase atual e priorize uma ação que não agrave a qualidade final da planta.";
        }
        if (containsAny(message, HARVEST_TERMS) || intent == DoctorChatIntent.LEITURA_ESTAGIO) {
            return "Quando os tricomas estão majoritariamente leitosos e começam a aparecer alguns âmbar, a planta normalmente está entrando na janela de colheita. O ponto exato depende do perfil que você quer, mas o caminho seguro é comparar proporção de leitosos/âmbar e não decidir só pelos pistilos.";
        }
        if (intent == DoctorChatIntent.TRIAGEM_AMBIGUA) {
            return "Ainda não consegui responder com confiança usando o contexto atual. Me diga se sua dúvida é sobre definição, diagnóstico da planta ou ação de manejo, e eu entro no pipeline certo.";
        }

        String topic = memory != null ? memory.activeTopicOrEntity() : null;
        if (topic != null && !topic.isBlank()) {
            return "Não consegui montar uma resposta confiável com o contexto atual, mas mantendo o tópico ativo em " + topic + ". Se você mandar um sinal observável ou a ação que quer avaliar, eu respondo de forma objetiva.";
        }

        return "Não consegui montar uma resposta confiável com o contexto atual. Reformule a dúvida com o sintoma observado ou com a ação que você quer validar, que eu respondo de forma mais objetiva.";
    }

    private boolean containsAny(String text, List<String> terms) {
        if (text == null || text.isBlank()) {
            return false;
        }
        for (String term : terms) {
            if (text.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\s+", " ").trim();
    }

    private String truncate(String value, int max) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = normalize(value);
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, Math.max(0, max - 3)) + "...";
    }

    public record ValidationResult(
            String content,
            String status,
            List<String> reasons,
            boolean fallbackUsed
    ) {
    }
}
