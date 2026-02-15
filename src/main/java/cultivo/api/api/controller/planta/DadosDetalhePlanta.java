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
        Boolean ativo,
        LocalDate dataGerminacao,
        LocalDate dataCriacao
) {
}
