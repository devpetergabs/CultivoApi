package cultivo.api.domain.aditivo;

public enum EstagioAditivo {
    VEGETATIVA("Vegetativa"),
    FLORACAO("Floração"),
    FINALIZACAO("Finalização");

    private final String descricao;

    EstagioAditivo(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
