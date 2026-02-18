package cultivo.api.infrastructure.config;

import cultivo.api.domain.cultivador.Cultivador;
import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.planta.PlantaFoto;
import cultivo.api.domain.planta.TamanhVaso;
import cultivo.api.domain.planta.EstagioPlanta;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaFotoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import cultivo.api.infrastructure.persistence.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Base64;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CultivadorRepository cultivadorRepository;

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private PlantaFotoRepository plantaFotoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        Usuario usuario = garantirUsuarioAdmin();
        Cultivador cultivador = garantirCultivador(usuario);
        garantirPlantaDemo(cultivador);
    }

    private Usuario garantirUsuarioAdmin() {
        final String login = "devpetergabs@gmail.com";
        final String senha = "Tonton1107@";

        Usuario usuario = usuarioRepository.findByLogin(login);
        if (usuario == null) {
            usuario = new Usuario("Gabriel", login, passwordEncoder.encode(senha), "ROLE_ADMIN");
            usuarioRepository.save(usuario);
            System.out.println("✅ Usuário admin criado: " + login);
            return usuario;
        }

        boolean alterou = false;
        if (usuario.getRole() == null || usuario.getRole().isBlank() || !usuario.getRole().equals("ROLE_ADMIN")) {
            usuario.atualizarRole("ROLE_ADMIN");
            alterou = true;
        }
        if (usuario.getNome() == null || usuario.getNome().isBlank()) {
            usuario.atualizarNome("Gabriel");
            alterou = true;
        }

        // Ambiente de dev: garantir que a senha informada sempre funcione
        usuario.atualizarSenha(passwordEncoder.encode(senha));
        alterou = true;

        if (alterou) {
            usuarioRepository.save(usuario);
            System.out.println("✅ Usuário atualizado para admin: " + login);
        } else {
            System.out.println("✅ Usuário admin já existe: " + login);
        }
        return usuario;
    }

    private Cultivador garantirCultivador(Usuario usuario) {
        Cultivador cultivador = cultivadorRepository.findByUsuarioId(usuario.getId());
        if (cultivador != null) {
            System.out.println("✅ Cultivador já existe para o usuário: ID " + cultivador.getId());
            return cultivador;
        }

        cultivador = new Cultivador(usuario, "(11) 99999-9999");
        cultivadorRepository.save(cultivador);
        System.out.println("✅ Cultivador criado para o usuário admin");
        return cultivador;
    }

    private void garantirPlantaDemo(Cultivador cultivador) {
        boolean demoExiste = plantaRepository.findAll().stream().anyMatch(p -> p.getNome().equals("Gorilla Glue #4"));
        if (demoExiste) {
            System.out.println("⚠️  Planta demo já existe, pulando seed da planta.");
            return;
        }

        var planta = new Planta(
                "Gorilla Glue #4",
                "Cannabis Sativa - Gorilla Glue",
                LocalDate.now().minusDays(30),
                45.5,
                35.0,
                2.5,
                TamanhVaso.VINTE_E_UM_L,
                EstagioPlanta.VEGETATIVO,
                cultivador
        );
        plantaRepository.save(planta);

        String imagemBase64Exemplo = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        byte[] imagemBytes = Base64.getDecoder().decode(imagemBase64Exemplo);
        var foto = new PlantaFoto(
                planta,
                imagemBytes,
                "image/jpeg",
                "Foto inicial da Gorilla Glue - Clone vegetativo em desenvolvimento"
        );
        plantaFotoRepository.save(foto);

        System.out.println("✅ Planta demo criada: Gorilla Glue #4");
    }
}
