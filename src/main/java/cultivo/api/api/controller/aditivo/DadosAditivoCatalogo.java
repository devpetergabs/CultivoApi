package cultivo.api.api.controller.aditivo;

import cultivo.api.domain.aditivo.ClasseAditivo;
import cultivo.api.domain.aditivo.EstagioAditivo;

public record DadosAditivoCatalogo(
        Long id,
        String nome,
        String marca,
        String descricao,
        EstagioAditivo estagio,
        ClasseAditivo classe,
        Double dosePadraoEmML,
        Boolean ativo,

        // --- produto ---
        String tipo,
        Integer capacidadeLitros,
        Integer roundsRecomendados,
        Integer descansoDiasRecomendados,
        Double doseMinEmML,
        Double doseMaxEmML,
        String pragasEfetivas,

        // --- estoque por cultivador ---
        DadosEstoqueProduto estoque
) {
}
