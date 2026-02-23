package cultivo.api.api.controller.planta;

public record DadosCrescimentoPlanta(
    Double altura,
    Double largura,
    Double larguraCaule,
    String descricao,
    String obs
) {}
