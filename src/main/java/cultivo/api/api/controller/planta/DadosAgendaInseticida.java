package cultivo.api.api.controller.planta;

import java.time.LocalDateTime;
import java.util.List;

public record DadosAgendaInseticida(
        Long plantaId,
        String plantaNome,

        Long tratamentoId,
        String produtoNome,
        Integer roundsTotal,
        Integer roundAtual,
        Integer descansoDias,
        LocalDateTime inicioEm,
        LocalDateTime fimTratamentoEm,
        LocalDateTime proximaAplicacaoEm,

        List<DadosAgendaPlanejado> planejados
) {
}
