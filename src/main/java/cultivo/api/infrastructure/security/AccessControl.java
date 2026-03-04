package cultivo.api.infrastructure.security;

import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.usuario.Usuario;

/**
 * Regras de acesso (MVP):
 * - ADMIN: pode visualizar (read) tudo, mas só interage (write) com as próprias plantas.
 * - USER: read/write apenas das próprias plantas.
 */
public final class AccessControl {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private AccessControl() {}

    public static boolean isAdmin(Usuario usuario) {
        if (usuario == null) return false;
        try {
            if (ROLE_ADMIN.equals(usuario.getRole())) return true;
        } catch (Exception ignored) {}

        try {
            return usuario.getAuthorities() != null
                    && usuario.getAuthorities().stream()
                    .anyMatch(a -> ROLE_ADMIN.equals(a.getAuthority()));
        } catch (Exception ignored) {
            return false;
        }
    }

    public static boolean isOwner(Usuario usuario, Planta planta) {
        if (usuario == null || planta == null) return false;
        if (planta.getCultivador() == null) return false;
        if (planta.getCultivador().getUsuario() == null) return false;
        if (planta.getCultivador().getUsuario().getId() == null) return false;
        if (usuario.getId() == null) return false;
        return planta.getCultivador().getUsuario().getId().equals(usuario.getId());
    }

    public static boolean canReadPlanta(Usuario usuario, Planta planta) {
        return isAdmin(usuario) || isOwner(usuario, planta);
    }

    public static boolean canWritePlanta(Usuario usuario, Planta planta) {
        // Admin NÃO ganha write global.
        return isOwner(usuario, planta);
    }
}
