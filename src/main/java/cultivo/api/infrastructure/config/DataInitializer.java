package cultivo.api.infrastructure.config;

import cultivo.api.domain.cultivador.Cultivador;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import cultivo.api.infrastructure.persistence.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.data-initializer", name = "enabled", havingValue = "true")
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CultivadorRepository cultivadorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        Usuario usuario = garantirUsuarioDev();
        Cultivador cultivador = garantirCultivador(usuario);
    }

    private Usuario garantirUsuarioDev() {
        // Mantém alinhado com o seed do Flyway (V2__seeds_usuarios_cultivadores.sql)
        // OBS: por padrão o initializer fica DESLIGADO (app.data-initializer.enabled=false)
        final String login = "gabriel.dev420@gmail.com";
        final String senha = "Tonton1107@";

        Usuario usuario = usuarioRepository.findByLogin(login);
        if (usuario == null) {
            usuario = new Usuario("Gabriel P", login, passwordEncoder.encode(senha), "ROLE_USER");
            usuarioRepository.save(usuario);
            System.out.println("✅ Usuário user criado: " + login);
            return usuario;
        }

        boolean alterou = false;
        if (usuario.getRole() == null || usuario.getRole().isBlank() || !usuario.getRole().equals("ROLE_USER")) {
            usuario.atualizarRole("ROLE_USER");
            alterou = true;
        }
        if (usuario.getNome() == null || usuario.getNome().isBlank()) {
            usuario.atualizarNome("Gabriel");
            alterou = true;
        }

        // Não sobrescreve senha automaticamente (evita "doideira" de login e seed)

        if (alterou) {
            usuarioRepository.save(usuario);
            System.out.println("✅ Usuário atualizado para user: " + login);
        } else {
            System.out.println("✅ Usuário user já existe: " + login);
        }
        return usuario;
    }

    private Cultivador garantirCultivador(Usuario usuario) {
        Cultivador cultivador = cultivadorRepository.findByUsuarioId(usuario.getId());
        if (cultivador != null) {
            System.out.println("✅ Cultivador já existe para o usuário: ID " + cultivador.getId());
            return cultivador;
        }

        cultivador = new Cultivador(usuario, "(11) 94543-3507");
        cultivadorRepository.save(cultivador);
        System.out.println("✅ Cultivador criado para o usuário user: ID " + cultivador.getId() + ", Usuário ID " + usuario.getId() + ", Telefone " + cultivador.getTelefone());
        return cultivador;
    }

    // Método garantirPlantaDemo removido: não criar planta demo
}
