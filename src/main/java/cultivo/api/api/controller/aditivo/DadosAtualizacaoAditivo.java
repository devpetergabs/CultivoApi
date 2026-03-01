package cultivo.api.api.controller.aditivo;

import cultivo.api.domain.aditivo.ClasseAditivo;
import cultivo.api.domain.aditivo.EstagioAditivo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record DadosAtualizacaoAditivo(
        @NotBlank(message = "Nome é obrigatório")
        String nome,

        @NotBlank(message = "Marca é obrigatória")
        String marca,

        @NotBlank(message = "Descrição é obrigatória")
        String descricao,

        EstagioAditivo estagio,

        @Positive(message = "Dose padrão deve ser maior que zero")
        Double dosePadraoEmML,

        ClasseAditivo classe,

        // --- produto ---
        String tipo,

        Integer capacidadeLitros,

        Integer roundsRecomendados,

        Integer descansoDiasRecomendados,

        Double doseMinEmML,

        Double doseMaxEmML,

        String pragasEfetivas
) {
}
