package cultivo.api.application.ai;

import java.util.Locale;

public enum DoctorChatMode {
    AUTO,
    CONHECIMENTO_GERAL,
    AVALIACAO_BASICA,
    AVALIACAO_TECNICA,
    PRAGA;

    public static DoctorChatMode fromValue(String valor) {
        if (valor == null || valor.isBlank()) {
            return AUTO;
        }

        String normalizado = valor.trim().toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');

        try {
            return DoctorChatMode.valueOf(normalizado);
        } catch (IllegalArgumentException ex) {
            return AUTO;
        }
    }
}