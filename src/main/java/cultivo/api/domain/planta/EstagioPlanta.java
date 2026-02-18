package cultivo.api.domain.planta;

public enum EstagioPlanta {
    GERMINACAO("Germinação"),
    VEGETATIVO("Vegetativo"),
    FLORACAO_INICIAL("Floração Inicial"),
    FLORACAO_AVANCADA("Floração Avançada");

    private final String descricao;

    EstagioPlanta(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
