package cultivo.api.application.ai;

import java.util.List;

public record DoctorChatIntentClassification(
        DoctorChatIntent intent,
        String confidence,
        String reason,
        List<String> triggerSignals,
        String contextScope,
        boolean carriedFromMemory
) {

    public static DoctorChatIntentClassification fallback() {
        return new DoctorChatIntentClassification(
                DoctorChatIntent.TRIAGEM_AMBIGUA,
                "baixa",
                "a mensagem não trouxe sinais semânticos suficientes para uma classificação segura",
                List.of(),
                "LEVE",
                false
        );
    }

    public DoctorChatIntent safeIntent() {
        return intent == null ? DoctorChatIntent.TRIAGEM_AMBIGUA : intent;
    }

    public String promptBlock() {
        StringBuilder sb = new StringBuilder();
        sb.append("- intencao_detectada: ").append(safeIntent().name()).append("\n");
        sb.append("- confianca_roteamento: ").append(confidence == null || confidence.isBlank() ? "baixa" : confidence).append("\n");
        sb.append("- escopo_de_contexto: ").append(contextScope == null || contextScope.isBlank() ? "LEVE" : contextScope).append("\n");
        if (reason != null && !reason.isBlank()) {
            sb.append("- motivo: ").append(reason.trim()).append("\n");
        }
        if (triggerSignals != null && !triggerSignals.isEmpty()) {
            sb.append("- sinais_disparadores: ").append(String.join(" | ", triggerSignals)).append("\n");
        }
        if (carriedFromMemory) {
            sb.append("- continuidade: classificação preservada pela memória recente da conversa\n");
        }
        return sb.toString().trim();
    }
}
