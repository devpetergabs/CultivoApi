package cultivo.api.domain.planta;

public enum TipoCicloPlanta {
    AUTOMATICA("Automática"),
    FOTOPERIODICA("Fotoperiódica"),
    NAO_DEFINIDO("Não identificado");

    private final String descricao;

    TipoCicloPlanta(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
