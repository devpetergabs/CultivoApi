package cultivo.api.api.controller.aditivo;

public record DadosEstoqueProduto(
        boolean tracked,
        String tipoProduto,
        Double stockMlAtual,
        Integer unidades,
        Integer mlFrasco
) {
}
