package cultivo.api.application.ai;

public record DoctorConversationMemory(
        String topicoAtual,
        String entidadeAtual,
        String resumoCurto,
        String ultimaPerguntaUsuario,
        String ultimaRespostaAssistente,
        String ultimoModoUsado,
        String ultimaIntencaoDetectada
) {

    public boolean hasEntity() {
        return entidadeAtual != null && !entidadeAtual.isBlank();
    }

    public String activeTopicOrEntity() {
        if (hasEntity()) {
            return entidadeAtual.trim();
        }
        if (hasTopic()) {
            return topicoAtual.trim();
        }
        return null;
    }

    public boolean hasTopic() {
        return topicoAtual != null && !topicoAtual.isBlank();
    }

    public DoctorChatMode lastModeOr(DoctorChatMode fallback) {
        DoctorChatMode mode = DoctorChatMode.fromValue(ultimoModoUsado);
        return mode == DoctorChatMode.AUTO ? fallback : mode;
    }

    public DoctorChatIntent lastIntentOr(DoctorChatIntent fallback) {
        DoctorChatIntent intent = DoctorChatIntent.fromValue(ultimaIntencaoDetectada);
        return intent == DoctorChatIntent.TRIAGEM_AMBIGUA ? fallback : intent;
    }

    public String toPromptBlock() {
        StringBuilder sb = new StringBuilder();
        append(sb, "topico_atual", topicoAtual, 80);
        append(sb, "entidade_atual", entidadeAtual, 60);
        append(sb, "resumo_curto", resumoCurto, 180);
        append(sb, "ultima_pergunta_usuario", ultimaPerguntaUsuario, 120);
        append(sb, "ultima_resposta_assistente", ultimaRespostaAssistente, 120);
        append(sb, "ultimo_modo_usado", ultimoModoUsado, 40);
        append(sb, "ultima_intencao_detectada", ultimaIntencaoDetectada, 40);
        return sb.toString().trim();
    }

    private void append(StringBuilder sb, String key, String value, int max) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (sb.length() > 0) {
            sb.append("\n");
        }
        sb.append(key).append(": ").append(truncate(value, max));
    }

    private String truncate(String value, int max) {
        String normalized = value.trim().replaceAll("\\s+", " ");
        return normalized.length() <= max ? normalized : normalized.substring(0, Math.max(0, max - 3)) + "...";
    }
}
