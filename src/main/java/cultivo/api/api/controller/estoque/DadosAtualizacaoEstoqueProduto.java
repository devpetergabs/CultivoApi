package cultivo.api.api.controller.estoque;

import jakarta.validation.constraints.Min;

public record DadosAtualizacaoEstoqueProduto(
        @Min(value = 0, message = "stockMlAtual deve ser >= 0")
        Double stockMlAtual,

        @Min(value = 0, message = "unidades deve ser >= 0")
        Integer unidades,

        @Min(value = 0, message = "mlFrasco deve ser >= 0")
        Integer mlFrasco
) {
}
