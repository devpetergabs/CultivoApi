package cultivo.api.api.controller.planta;

public record DadosDetalhePlantaAditivo(
        Long id,
        String plantaNome,
        String aditivoNome,
        String aditivoMarca,
        String aditivoDescricao,
        String estagio,
        Double doseEmML
) {
}
