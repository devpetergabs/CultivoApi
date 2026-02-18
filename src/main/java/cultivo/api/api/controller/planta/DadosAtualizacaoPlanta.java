package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.EstagioPlanta;
import cultivo.api.domain.planta.SexoPlanta;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record DadosAtualizacaoPlanta(
        @NotBlank(message = "Nome da planta é obrigatório")
        String nome,

        String strain,

        LocalDate dataGerminacao,

        @Positive(message = "Altura deve ser maior que zero")
        Double altura,

        @Positive(message = "Largura deve ser maior que zero")
        Double largura,

        @Positive(message = "Largura do caule deve ser maior que zero")
        Double larguraCaule,

        @NotBlank(message = "Tamanho do vaso é obrigatório")
        String tamanhoVaso,

        EstagioPlanta estagio,

        SexoPlanta sexo,

        LocalDate dataSexagem,

        LocalDate dataFloracao
) {
}
