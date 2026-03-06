package cultivo.api.api.controller.planta;

public record DadosAnalisePlantaFoto(
        String imagemBase64,
        String contentType,
        String descricao
) {
}