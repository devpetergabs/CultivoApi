package cultivo.api.api.controller.planta;

import jakarta.validation.constraints.NotBlank;

public record DadosCadastroPlantaFoto(
        @NotBlank(message = "Imagem em base64 é obrigatória")
        String imagemBase64,

        @NotBlank(message = "Content type é obrigatório (ex: image/jpeg)")
        String contentType,

        String descricao
) {
}
