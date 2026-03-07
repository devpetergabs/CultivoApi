package cultivo.api.domain.planta;

public enum GeneticaPlanta {
    SATIVA("Sativa"),
    INDICA("Índica"),
    HIBRIDA("Híbrida"),
    NAO_DEFINIDO("Não identificado");

    private final String descricao;

    GeneticaPlanta(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
