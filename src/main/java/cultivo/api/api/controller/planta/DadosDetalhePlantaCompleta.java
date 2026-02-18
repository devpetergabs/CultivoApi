package cultivo.api.api.controller.planta;

import java.time.LocalDate;
import java.util.List;

public record DadosDetalhePlantaCompleta(
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
        LocalDate dataCriacao,
        Long cultivadorId,
        String cultivadorNome,
        String cultivadorLogin,
        String cultivadorTelefone,
        Boolean cultivadorAtivo,
        List<DadosDetalhePlantaAditivo> aditivos
) {
}
