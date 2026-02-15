package cultivo.api.api.controller.planta;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DadosCadastroPlantaAditivo(
        @NotNull(message = "ID do aditivo é obrigatório")
        Long aditivoId,

        @NotNull(message = "Dose é obrigatória")
        @Positive(message = "Dose deve ser maior que zero")
        Double doseEmML
) {
}
