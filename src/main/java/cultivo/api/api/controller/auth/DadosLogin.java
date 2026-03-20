package cultivo.api.api.controller.auth;

import jakarta.validation.constraints.NotBlank;

public record DadosLogin(
        @NotBlank
        String login,
        @NotBlank
        String senha
) {
}
