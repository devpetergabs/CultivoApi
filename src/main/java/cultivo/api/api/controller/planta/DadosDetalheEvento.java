package cultivo.api.api.controller.planta;

import java.time.LocalDateTime;

public record DadosDetalheEvento(
        Long id,
        String plantaNome,
        String tipo,
        LocalDateTime dataEvento,
        String descricao,
        Double doseEmML
) {
}
