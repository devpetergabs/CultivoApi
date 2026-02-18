package cultivo.api.api.controller.planta;

import java.time.LocalDate;

public record DadosDetalhePlanta(
        Long id,
        String nome,
        String strain,
        Double altura,
        Double largura,
        Double larguraCaule,
        String tamanhoVaso,
        String estagio,
        String sexo,
        LocalDate dataSexagem,
        LocalDate dataFloracao,
        Boolean ativo,
        LocalDate dataGerminacao,
        LocalDate dataCriacao
) {
}
