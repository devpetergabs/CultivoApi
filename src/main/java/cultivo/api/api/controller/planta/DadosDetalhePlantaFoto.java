package cultivo.api.api.controller.planta;

import java.time.LocalDateTime;

public record DadosDetalhePlantaFoto(
        Long id,
        String plantaNome,
        String contentType,
        String descricao,
        LocalDateTime dataUpload
) {
}
