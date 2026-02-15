package cultivo.api.api.controller.planta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record DadosAtualizacaoPlanta(
        @NotBlank(message = "Nome da planta é obrigatório")
        String nome,

        @Positive(message = "Altura deve ser maior que zero")
        Double altura,

        @Positive(message = "Largura deve ser maior que zero")
        Double largura,

        @Positive(message = "Largura do caule deve ser maior que zero")
        Double larguraCaule,

        @NotBlank(message = "Tamanho do vaso é obrigatório")
        String tamanhoVaso
) {
}
