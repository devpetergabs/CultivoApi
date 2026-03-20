package cultivo.api.api.controller.planta;

import jakarta.validation.constraints.NotBlank;

public record DadosDoctorChatMensagemEnvio(
        @NotBlank String mensagem,
        String modo
) {
}