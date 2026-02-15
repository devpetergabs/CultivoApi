package cultivo.api.infrastructure.exception;

import java.time.LocalDateTime;
import java.util.Map;

public record ErrorResponse(
        int status,
        String mensagem,
        LocalDateTime timestamp,
        Map<String, String> detalhes
) {
}
