package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.EstagioPlanta;
import cultivo.api.domain.planta.SexoPlanta;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record DadosCadastroPlanta(
        @NotNull(message = "ID do cultivador é obrigatório")
        Long cultivadorId,

        @NotBlank(message = "Nome da planta é obrigatório")
        String nome,

        String strain,

        LocalDate dataGerminacao,

        @NotNull(message = "Altura é obrigatória")
        @Positive(message = "Altura deve ser maior que zero")
        Double altura,

        @NotNull(message = "Largura é obrigatória")
        @Positive(message = "Largura deve ser maior que zero")
        Double largura,

        @NotNull(message = "Largura do caule é obrigatória")
        @Positive(message = "Largura do caule deve ser maior que zero")
        Double larguraCaule,

        @NotBlank(message = "Tamanho do vaso é obrigatório")
        String tamanhoVaso,

        @NotNull(message = "Estágio da planta é obrigatório")
        EstagioPlanta estagio,

        SexoPlanta sexo,

        LocalDate dataSexagem,

        LocalDate dataFloracao
) {
}
