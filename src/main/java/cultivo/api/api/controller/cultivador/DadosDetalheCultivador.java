package cultivo.api.api.controller.cultivador;

public record DadosDetalheCultivador(
        Long id,
        String usuarioLogin,
        String telefone,
        Boolean ativo
) {
}
