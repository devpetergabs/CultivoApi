package cultivo.api.application.ai;

public enum DoctorChatIntent {
    DEFINICAO,
    DIAGNOSTICO_GERAL,
    DIAGNOSTICO_ESPECIALIZADO,
    RECOMENDACAO_MANEJO,
    LEITURA_ESTAGIO,
    TRIAGEM_AMBIGUA;

    public static DoctorChatIntent fromValue(String value) {
        if (value == null || value.isBlank()) {
            return TRIAGEM_AMBIGUA;
        }
        try {
            return DoctorChatIntent.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return TRIAGEM_AMBIGUA;
        }
    }

    public String label() {
        return switch (this) {
            case DEFINICAO -> "definição";
            case DIAGNOSTICO_GERAL -> "diagnóstico geral";
            case DIAGNOSTICO_ESPECIALIZADO -> "diagnóstico especializado";
            case RECOMENDACAO_MANEJO -> "recomendação de manejo";
            case LEITURA_ESTAGIO -> "leitura de estágio";
            case TRIAGEM_AMBIGUA -> "triagem ambígua";
        };
    }
}
