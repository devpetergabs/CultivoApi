package cultivo.api.infrastructure.security;

import cultivo.api.infrastructure.persistence.usuario.UsuarioRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public class AutenticacaoService implements UserDetailsService {

    private final UsuarioRepository repository;

    public AutenticacaoService(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var usuario = repository.findByLogin(username);
        if (usuario == null) {
            throw new UsernameNotFoundException("Usuario nao encontrado");
        }
        return usuario;
    }
}
