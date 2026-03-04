package cultivo.api.api.controller.estoque;

public record DadosEstoqueProdutoView(
        boolean tracked,
        String tipoProduto,
        Double stockMlAtual,
        Integer unidades,
        Integer mlFrasco
) {
}
