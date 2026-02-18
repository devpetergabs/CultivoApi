package cultivo.api.domain.planta;

public enum EstagioPlanta {
    GERMINACAO("Germinação"),
    VEGETATIVO("Vegetativo"),
    FLORACAO_INICIAL("Floração Inicial"),
    FLORACAO_MEDIA("Floração Média"),
    FLORACAO_AVANCADA("Floração Avançada"),
    FINALIZACAO("Finalização");

    private final String descricao;

    EstagioPlanta(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
