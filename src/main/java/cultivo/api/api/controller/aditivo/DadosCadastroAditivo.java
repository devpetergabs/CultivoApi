package cultivo.api.api.controller.aditivo;

import cultivo.api.domain.aditivo.ClasseAditivo;
import cultivo.api.domain.aditivo.EstagioAditivo;
import cultivo.api.domain.aditivo.EstagioMacroAditivo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DadosCadastroAditivo(
        @NotBlank(message = "Nome é obrigatório")
        String nome,

        @NotBlank(message = "Marca é obrigatória")
        String marca,

        @NotBlank(message = "Descrição é obrigatória")
        String descricao,

        String descricaoTecnica,

        @NotNull(message = "Estágio é obrigatório")
        EstagioAditivo estagio,

        @NotNull(message = "Dose padrão é obrigatória")
        @Positive(message = "Dose padrão deve ser maior que zero")
        Double dosePadraoEmML,

        EstagioMacroAditivo estagiosMacro,

        String estagiosLista,

        ClasseAditivo classe
) {
}
