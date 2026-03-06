package cultivo.api.api.controller.aditivo;

import cultivo.api.domain.aditivo.ClasseAditivo;
import cultivo.api.domain.aditivo.EstagioAditivo;
import cultivo.api.domain.aditivo.EstagioMacroAditivo;

public record DadosAditivoCatalogo(
        Long id,
        String nome,
        String marca,
        String descricao,
        String descricaoTecnica,
        EstagioAditivo estagio,
        EstagioMacroAditivo estagiosMacro,
        String estagiosLista,
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
