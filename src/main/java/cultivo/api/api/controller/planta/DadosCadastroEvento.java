package cultivo.api.api.controller.planta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record DadosCadastroEvento(
        @NotBlank(message = "Tipo do evento é obrigatório")
        String tipo,

        String descricao,

        @Positive(message = "Dose deve ser maior que zero")
        Double doseEmML
) {
}
