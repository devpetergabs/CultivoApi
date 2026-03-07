package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.EstagioPlanta;
import cultivo.api.domain.planta.EspeciePlanta;
import cultivo.api.domain.planta.GeneticaPlanta;
import cultivo.api.domain.planta.SexoPlanta;
import cultivo.api.domain.planta.TipoCicloPlanta;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

public record DadosAtualizacaoPlanta(
        @NotBlank(message = "Nome da planta é obrigatório")
        String nome,

        String strain,

        EspeciePlanta especie,

        TipoCicloPlanta tipoCiclo,

        GeneticaPlanta genetica,

        LocalDate dataGerminacao,

        @Min(value = 0, message = "Altura deve ser zero ou maior")
        Double altura,

        @Min(value = 0, message = "Largura deve ser zero ou maior")
        Double largura,

        @Min(value = 0, message = "Largura do caule deve ser zero ou maior")
        Double larguraCaule,

        @NotBlank(message = "Tamanho do vaso é obrigatório")
        String tamanhoVaso,

        EstagioPlanta estagio,

        SexoPlanta sexo,

        LocalDate dataSexagem,

        LocalDate dataFloracao
) { }