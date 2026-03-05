package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.cultivador.Cultivador;
import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.planta.TamanhVaso;
import cultivo.api.domain.planta.EstagioPlanta;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import cultivo.api.infrastructure.persistence.usuario.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PlantaRepositoryTest {

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CultivadorRepository cultivadorRepository;

    @Test
    void shouldPersistPlantaWithProvidedData() {
        Usuario usuario = usuarioRepository.save(new Usuario("Cultivador 1", "cultivador1", "senha"));
        Cultivador cultivador = cultivadorRepository.save(new Cultivador(usuario));

        Planta planta = new Planta(
            "Cannabis",
            null,
            null,
            2.0,
            90.0,
            9.5,
            TamanhVaso.VINTE_E_UM_L,
            EstagioPlanta.VEGETATIVO_MEDIO,
            cultivador
        );

        Planta persisted = plantaRepository.save(planta);

        assertThat(persisted.getId()).isNotNull();
        assertThat(persisted.getNome()).isEqualTo("Cannabis");
        assertThat(persisted.getAltura()).isEqualTo(2.0);
        assertThat(persisted.getLargura()).isEqualTo(90.0);
        assertThat(persisted.getLarguraCaule()).isEqualTo(9.5);
        assertThat(persisted.getDataGerminacao()).isNull();
        assertThat(persisted.getTamanhoVaso()).isEqualTo(TamanhVaso.VINTE_E_UM_L);
    }
}
