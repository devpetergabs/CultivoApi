package cultivo.api.api.controller.planta;

import java.time.LocalDateTime;
import java.util.List;

public record DadosDoctorChatSessao(
        Long sessionId,
        String status,
        String titulo,
        String summary,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<DadosDoctorChatMensagem> messages
) {
}