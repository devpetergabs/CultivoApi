package cultivo.api.api.controller.planta;

public record DadosAtualizacaoPlanta(
        String nome,
        Double altura,
        Double largura,
        Double larguraCaule,
        String tamanhoVaso
) {
}
