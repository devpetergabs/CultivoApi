package cultivo.api.domain.aditivo;

public enum EstagioMacroAditivo {
    VEGETATIVO("Vegetativo"),
    FLORACAO("Floração"),
    CICLO_INTEGRADO("Ciclo integrado"),
    FINALIZACAO("Finalização");

    private final String descricao;

    EstagioMacroAditivo(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}