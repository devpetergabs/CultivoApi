package cultivo.api.application.ai;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class DoctorChatIntentClassifier {

    private static final Pattern METRIC_PATTERN = Pattern.compile("\\b(?:ph|ec|ppm|rh|umidade|temperatura|vpd|runoff)\\b|\\b\\d+(?:[\\.,]\\d+)?\\s*(?:%|ppm|ppfd|ec|ph|c|°c|graus|ml|l)\\b", Pattern.CASE_INSENSITIVE);

    private static final List<String> DEFINICAO_TOKENS = List.of(
            "o que é", "oq é", "qual a diferença", "qual a diferenca", "como funciona", "o que significa", "significa", "conceito", "explique", "curiosidade"
    );
    private static final List<String> DIAGNOSTICO_TOKENS = List.of(
            "minha planta", "essa planta", "esta planta", "folhas", "folha", "mancha", "amarel", "queimad", "murch", "caida", "travada", "pontinhos", "teia", "parece"
    );
    private static final List<String> RECOMENDACAO_TOKENS = List.of(
            "como tratar", "o que fazer", "oq fazer", "qual a dose", "qual a dosagem", "posso aplicar", "posso usar", "como corrigir", "como podar", "como resolver"
    );
    private static final List<String> ESTAGIO_TOKENS = List.of(
            "quantas semanas", "hora de colher", "ja posso virar", "já posso virar", "tricomas", "tricoma", "pistilos", "pré-flora", "pre-flora", "maturação", "maturacao", "floração", "floracao", "vegetativo", "germinação", "germinacao"
    );
    private static final List<String> AMBIGUOUS_TOKENS = List.of(
            "isso", "e isso", "minha planta ta ruim", "minha planta tá ruim", "o que acha", "oq acha"
    );

    public DoctorChatIntentClassification classify(String message, DoctorChatMode requestedMode, DoctorConversationMemory memory) {
        String text = normalize(message);
        if (text.isBlank()) {
            return DoctorChatIntentClassification.fallback();
        }

        if (shouldCarryFromMemory(text, memory)) {
            DoctorChatIntent carried = memory != null ? memory.lastIntentOr(DoctorChatIntent.TRIAGEM_AMBIGUA) : DoctorChatIntent.TRIAGEM_AMBIGUA;
            return new DoctorChatIntentClassification(
                    carried,
                    "média",
                    "a mensagem parece continuação curta do tópico anterior, então a intenção foi preservada pela memória recente",
                    List.of("continuidade do assunto anterior"),
                    defaultContextScope(carried),
                    true
            );
        }

        LinkedHashSet<String> triggers = new LinkedHashSet<>();
        int definicao = score(text, DEFINICAO_TOKENS, triggers, "definição");
        int diagnostico = score(text, DIAGNOSTICO_TOKENS, triggers, "sintoma");
        int recomendacao = score(text, RECOMENDACAO_TOKENS, triggers, "ação");
        int estagio = score(text, ESTAGIO_TOKENS, triggers, "estágio");
        int tecnico = METRIC_PATTERN.matcher(text).find() ? 4 : 0;
        if (tecnico > 0) {
            triggers.add("telemetria/medição");
        }
        if (containsAny(text, AMBIGUOUS_TOKENS)) {
            triggers.add("entrada curta/ambígua");
        }

        if (requestedMode != null && requestedMode != DoctorChatMode.AUTO) {
            switch (requestedMode) {
                case CONHECIMENTO_GERAL -> definicao += 2;
                case AVALIACAO_BASICA -> diagnostico += 1;
                case AVALIACAO_TECNICA -> tecnico += 2;
                case PRAGA -> diagnostico += 2;
                case AUTO -> {
                }
            }
        }

        DoctorChatIntent intent = DoctorChatIntent.TRIAGEM_AMBIGUA;
        int topScore = 0;
        int secondScore = 0;

        int leituraScore = estagio;
        int recomendacaoScore = recomendacao + (estagio > 0 ? 1 : 0);
        int tecnicoScore = tecnico + (diagnostico > 0 ? 1 : 0);
        int definicaoScore = definicao + (estagio > 0 && diagnostico == 0 && recomendacao == 0 ? 1 : 0);
        int diagnosticoScore = diagnostico + (containsAny(text, List.of("praga", "tripes", "thrips", "ácaro", "acaro", "deficien", "fungo")) ? 1 : 0);

        intent = pickHigher(intent, DoctorChatIntent.LEITURA_ESTAGIO, leituraScore, topScore);
        topScore = Math.max(topScore, leituraScore);
        intent = pickHigher(intent, DoctorChatIntent.RECOMENDACAO_MANEJO, recomendacaoScore, topScore);
        topScore = Math.max(topScore, recomendacaoScore);
        intent = pickHigher(intent, DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO, tecnicoScore, topScore);
        topScore = Math.max(topScore, tecnicoScore);
        intent = pickHigher(intent, DoctorChatIntent.DEFINICAO, definicaoScore, topScore);
        topScore = Math.max(topScore, definicaoScore);
        intent = pickHigher(intent, DoctorChatIntent.DIAGNOSTICO_GERAL, diagnosticoScore, topScore);
        topScore = Math.max(topScore, diagnosticoScore);

        secondScore = secondHighest(List.of(leituraScore, recomendacaoScore, tecnicoScore, definicaoScore, diagnosticoScore));

        if (topScore < 2 || topScore - secondScore <= 0 || containsAny(text, AMBIGUOUS_TOKENS) && topScore < 4) {
            intent = DoctorChatIntent.TRIAGEM_AMBIGUA;
        }

        String confidence = inferConfidence(intent, topScore, secondScore);
        String reason = inferReason(intent, requestedMode, topScore, secondScore, text);

        return new DoctorChatIntentClassification(
                intent,
                confidence,
                reason,
                List.copyOf(triggers),
                defaultContextScope(intent),
                false
        );
    }

    private DoctorChatIntent pickHigher(DoctorChatIntent current, DoctorChatIntent candidate, int score, int currentScore) {
        if (score > currentScore) {
            return candidate;
        }
        return current;
    }

    private int secondHighest(List<Integer> scores) {
        int top = 0;
        int second = 0;
        for (int score : scores) {
            if (score > top) {
                second = top;
                top = score;
            } else if (score > second) {
                second = score;
            }
        }
        return second;
    }

    private int score(String text, List<String> tokens, Set<String> triggers, String tag) {
        int score = 0;
        for (String token : tokens) {
            if (text.contains(token)) {
                score += token.split(" ").length > 1 ? 2 : 1;
                triggers.add(tag + ": " + token);
            }
        }
        return score;
    }

    private boolean containsAny(String text, List<String> values) {
        for (String value : values) {
            if (text.contains(value)) {
                return true;
            }
        }
        return false;
    }

    private boolean shouldCarryFromMemory(String text, DoctorConversationMemory memory) {
        if (memory == null || memory.lastIntentOr(DoctorChatIntent.TRIAGEM_AMBIGUA) == DoctorChatIntent.TRIAGEM_AMBIGUA) {
            return false;
        }
        if (text.length() > 48) {
            return false;
        }
        return text.contains("como assim")
                || text.equals("isso")
                || text.equals("isso?")
                || text.contains("e isso")
                || text.contains("por quê")
                || text.contains("porque")
                || text.contains("causado")
                || text.contains("ele")
                || text.contains("ela");
    }

    private String inferConfidence(DoctorChatIntent intent, int topScore, int secondScore) {
        if (intent == DoctorChatIntent.TRIAGEM_AMBIGUA) {
            return "baixa";
        }
        if (topScore >= 5 && topScore - secondScore >= 2) {
            return "alta";
        }
        if (topScore >= 3) {
            return "média";
        }
        return "baixa";
    }

    private String inferReason(DoctorChatIntent intent, DoctorChatMode requestedMode, int topScore, int secondScore, String text) {
        List<String> reasons = new ArrayList<>();
        reasons.add("topScore=" + topScore + ", margem=" + Math.max(0, topScore - secondScore));
        if (requestedMode != null && requestedMode != DoctorChatMode.AUTO) {
            reasons.add("modo solicitado=" + requestedMode.name());
        }
        reasons.add("classe final=" + intent.label());
        if (intent == DoctorChatIntent.TRIAGEM_AMBIGUA) {
            reasons.add("a frase veio curta, híbrida ou com sinais competitivos");
        } else if (intent == DoctorChatIntent.DEFINICAO) {
            reasons.add("a pergunta é conceitual e não exige contexto operacional da planta");
        } else if (intent == DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO) {
            reasons.add("a mensagem trouxe telemetria ou medições que justificam leitura técnica");
        } else if (intent == DoctorChatIntent.RECOMENDACAO_MANEJO) {
            reasons.add("o usuário pediu ação prática em vez de definição ou laudo puro");
        } else if (intent == DoctorChatIntent.LEITURA_ESTAGIO) {
            reasons.add("o núcleo da decisão depende da fase fenológica ou da janela de colheita");
        } else {
            reasons.add("há descrição de sintoma, mas sem telemetria suficiente para diagnóstico especializado");
        }
        if (text.contains("tripes") || text.contains("thrips")) {
            reasons.add("entidade tripes/thrips apareceu explicitamente");
        }
        return String.join("; ", reasons);
    }

    private String defaultContextScope(DoctorChatIntent intent) {
        return switch (intent) {
            case DEFINICAO -> "NENHUM";
            case DIAGNOSTICO_GERAL, RECOMENDACAO_MANEJO, LEITURA_ESTAGIO, TRIAGEM_AMBIGUA -> "LEVE";
            case DIAGNOSTICO_ESPECIALIZADO -> "COMPLETO";
        };
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }
}
