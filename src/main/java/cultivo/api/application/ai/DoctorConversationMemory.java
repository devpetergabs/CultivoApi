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
        append(sb, "topico_atual", topicoAtual);
        append(sb, "entidade_atual", entidadeAtual);
        append(sb, "resumo_curto", resumoCurto);
        append(sb, "ultima_pergunta_usuario", ultimaPerguntaUsuario);
        append(sb, "ultima_resposta_assistente", ultimaRespostaAssistente);
        append(sb, "ultimo_modo_usado", ultimoModoUsado);
        append(sb, "ultima_intencao_detectada", ultimaIntencaoDetectada);
        return sb.toString().trim();
    }

    private void append(StringBuilder sb, String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (sb.length() > 0) {
            sb.append("\n");
        }
        sb.append(key).append(": ").append(value.trim());
    }
}