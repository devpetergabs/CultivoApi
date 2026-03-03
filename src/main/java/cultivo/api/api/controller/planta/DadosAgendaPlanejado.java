package cultivo.api.api.controller.planta;

import java.time.LocalDateTime;

public record DadosAgendaPlanejado(
        Long id,
        Integer roundIndex,
        LocalDateTime scheduledAt,
        String status,
        LocalDateTime executedAt,
        Long eventoExecucaoId,
        Double doseEmML
) {
}
