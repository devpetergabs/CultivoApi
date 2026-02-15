package cultivo.api.api.controller.planta;

public record DadosCadastroPlantaFoto(
        String imagemBase64,
        String contentType,
        String descricao
) {
}
