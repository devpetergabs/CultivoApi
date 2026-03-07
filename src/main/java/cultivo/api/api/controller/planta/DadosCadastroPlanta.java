package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.EstagioPlanta;
import cultivo.api.domain.planta.EspeciePlanta;
import cultivo.api.domain.planta.GeneticaPlanta;
import cultivo.api.domain.planta.SexoPlanta;
import cultivo.api.domain.planta.TipoCicloPlanta;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record DadosCadastroPlanta(
        @NotNull(message = "ID do cultivador é obrigatório")
        Long cultivadorId,

        @NotBlank(message = "Nome da planta é obrigatório")
        String nome,

        String strain,

        // opcional (default: CANNABIS)
        EspeciePlanta especie,

        TipoCicloPlanta tipoCiclo,

        GeneticaPlanta genetica,

        LocalDate dataGerminacao,

        @NotNull(message = "Altura é obrigatória")
        @Min(value = 0, message = "Altura deve ser zero ou maior")
        Double altura,

        @NotNull(message = "Largura é obrigatória")
        @Min(value = 0, message = "Largura deve ser zero ou maior")
        Double largura,

        @NotNull(message = "Largura do caule é obrigatória")
        @Min(value = 0, message = "Largura do caule deve ser zero ou maior")
        Double larguraCaule,

        @NotBlank(message = "Tamanho do vaso é obrigatório")
        String tamanhoVaso,

        @NotNull(message = "Estágio da planta é obrigatório")
        EstagioPlanta estagio,

        SexoPlanta sexo,

        LocalDate dataSexagem,

        LocalDate dataFloracao
) { }