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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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
    private BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Verifica se a planta demo já existe para não duplicar
        if (plantaRepository.findAll().stream().anyMatch(p -> p.getNome().equals("Gorilla Glue #4"))) {
            System.out.println("⚠️  Planta demo já existe, pulando inicialização.");
            return;
        }

        // Buscar ou criar usuário
        Usuario usuario;
        if (usuarioRepository.count() == 0) {
            usuario = new Usuario("Cultivador Demo", "cultivador_demo", passwordEncoder.encode("senha123"));
            usuarioRepository.save(usuario);
            System.out.println("✅ Usuário criado: cultivador_demo");
        } else {
            usuario = usuarioRepository.findAll().get(0);
            System.out.println("✅ Usando usuário existente: " + usuario.getLogin());
        }

        // Buscar ou criar cultivador
        Cultivador cultivador;
        if (cultivadorRepository.count() == 0) {
            cultivador = new Cultivador(usuario, "(11) 98765-4321");
            cultivadorRepository.save(cultivador);
            System.out.println("✅ Cultivador criado");
        } else {
            cultivador = cultivadorRepository.findAll().get(0);
            System.out.println("✅ Usando cultivador existente: ID " + cultivador.getId());
        }

        // Criar planta Gorilla Glue (Cannabis Sativa)
        var planta = new Planta(
                "Gorilla Glue #4",
                "Cannabis Sativa - Gorilla Glue",
                LocalDate.now().minusDays(30), // Germinada há 30 dias
                45.5,  // altura em cm
                35.0,  // largura em cm
                2.5,   // largura do caule em cm
                TamanhVaso.VINTE_E_UM_L,
                EstagioPlanta.VEGETATIVO,
                cultivador
        );
        plantaRepository.save(planta);

        // Adicionar foto à planta
        // IMPORTANTE: Substitua a string abaixo pela imagem real em Base64
        // Para converter: $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("caminho/da/imagem.jpg"))
        String imagemBase64Exemplo = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; 
        
        // Se você quiser usar a foto real do attachment, execute este comando no PowerShell:
        // $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("caminho/para/foto.jpg"))
        // E substitua a string acima
        
        byte[] imagemBytes = Base64.getDecoder().decode(imagemBase64Exemplo);
        var foto = new PlantaFoto(
                planta,
                imagemBytes,
                "image/jpeg",
                "Foto inicial da Gorilla Glue - Clone vegetativo em desenvolvimento"
        );
        plantaFotoRepository.save(foto);

        System.out.println("✅ Dados iniciais criados com sucesso!");
        System.out.println("📝 Usuário: cultivador_demo / senha123");
        System.out.println("🌱 Planta: Gorilla Glue #4 (Cannabis Sativa)");
        System.out.println("📸 Foto adicionada à planta");
    }
}
