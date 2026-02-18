package cultivo.api.domain.planta;

public enum SexoPlanta {
    FEMEA("Fêmea"),
    MACHO("Macho"),
    HERMAFRODITA("Hermafrodita");

    private final String descricao;

    SexoPlanta(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
