package cultivo.api.api.controller.auth;

import java.time.Instant;

public record DadosTokenJWT(
        String token,
        String tipo,
        Instant expiraEm,
        Long usuarioId,
        String usuarioNome,
        String usuarioLogin,
        String role
) {
}
