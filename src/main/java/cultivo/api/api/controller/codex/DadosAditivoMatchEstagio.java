package cultivo.api.api.controller.codex;

public record DadosAditivoMatchEstagio(
        Long id,
        String nome,
        String marca,
        String tipo,
        String descricao,
        Double dosePadraoEmML
) {
}
