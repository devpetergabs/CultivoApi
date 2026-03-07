package cultivo.api.api.controller.planta;

import java.time.LocalDateTime;

public record DadosDoctorChatMensagem(
        Long id,
        String role,
        String content,
        LocalDateTime createdAt,
        String metadataJson
) {
}