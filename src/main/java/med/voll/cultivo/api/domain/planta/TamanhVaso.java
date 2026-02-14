package med.voll.cultivo.api.domain.planta;

public enum TamanhVaso {
    CINCO_L("5L"),
    VINTE_E_UM_L("21L"),
    TRINTA_L("30L");

    private String valor;

    TamanhVaso(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }
}
