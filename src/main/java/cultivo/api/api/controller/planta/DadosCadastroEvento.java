package cultivo.api.api.controller.planta;

import java.time.LocalDateTime;

public record DadosCadastroEvento(
        String tipo,
        String descricao,
        Double doseEmML
) {
}
