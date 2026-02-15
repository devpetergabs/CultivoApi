package cultivo.api.api.controller.cultivador;

import jakarta.validation.constraints.Pattern;

public record DadosAtualizacaoCultivador(
        @Pattern(regexp = "^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$", message = "Telefone inválido")
        String telefone
) {
}
