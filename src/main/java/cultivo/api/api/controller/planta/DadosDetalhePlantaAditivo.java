package cultivo.api.api.controller.planta;

import cultivo.api.domain.aditivo.ClasseAditivo;

public record DadosDetalhePlantaAditivo(
        Long id,
        String plantaNome,
        String aditivoNome,
        String aditivoMarca,
        String aditivoDescricao,
        String estagio,
        Double doseEmML,
        ClasseAditivo classe
) {
}
