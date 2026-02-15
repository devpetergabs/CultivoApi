package cultivo.api.api.controller.planta;

import java.time.LocalDate;

public record DadosCadastroPlanta(
        Long cultivadorId,
        String nome,
        String strain,
        LocalDate dataGerminacao,
        Double altura,
        Double largura,
        Double larguraCaule,
        String tamanhoVaso
) {
}
