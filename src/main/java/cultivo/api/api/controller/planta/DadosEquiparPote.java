package cultivo.api.api.controller.planta;

import jakarta.validation.constraints.NotNull;

public record DadosEquiparPote(
        @NotNull Long produtoId,
        String corHex,
        String skinId,
        String apelido
) {
}
