package cultivo.api.api.controller.planta;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record DadosConsumoProduto(
        @NotNull
        Long produtoId,

        @Min(value = 0, message = "consumoEmML deve ser >= 0")
        Double consumoEmML
) {
}
