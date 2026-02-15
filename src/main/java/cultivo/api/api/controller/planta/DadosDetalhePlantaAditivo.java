package cultivo.api.api.controller.planta;

public record DadosDetalhePlantaAditivo(
        Long id,
        String plantaNome,
        String aditivoNome,
        Double doseEmML
) {
}
