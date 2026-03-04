package cultivo.api.api.controller.planta;

import java.time.LocalDateTime;

public record DadosDetalheEquipamento(
        Long id,
        String slot,
        Long produtoId,
        String produtoNome,
        String produtoTipo,
        Integer capacidadeLitros,
        String corHex,
        String skinId,
        String apelido,
        LocalDateTime equipadoEm
) {
}
