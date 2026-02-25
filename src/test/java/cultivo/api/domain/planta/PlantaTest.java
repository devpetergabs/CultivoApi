package cultivo.api.domain.planta;

import cultivo.api.domain.cultivador.Cultivador;
import cultivo.api.domain.usuario.Usuario;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class PlantaTest {

    @Test
    void shouldSetDataFloracaoToTodayWhenEvolvingFromVegetativoToPreFloracao() {
        Usuario usuario = new Usuario("u", "u", "pw");
        Cultivador cultivador = new Cultivador(usuario);

        Planta planta = new Planta(
            "Planta",
            null,
            null,
            null,
            null,
            null,
            TamanhVaso.VINTE_E_UM_L,
            EstagioPlanta.VEGETATIVO,
            cultivador
        );

        LocalDate hoje = LocalDate.now();

        planta.atualizarDados(
            "Planta",
            null,
            null,
            null,
            null,
            null,
            TamanhVaso.VINTE_E_UM_L,
            EstagioPlanta.FLORACAO_INICIAL,
            null,
            null,
            null
        );

        assertThat(planta.getDataFloracao()).isEqualTo(hoje);
    }

    @Test
    void shouldIgnoreProvidedDataFloracaoOnVegetativoToPreFloracaoTransition() {
        Usuario usuario = new Usuario("u", "u", "pw");
        Cultivador cultivador = new Cultivador(usuario);

        Planta planta = new Planta(
            "Plant",
            null,
            null,
            null,
            null,
            null,
            TamanhVaso.VINTE_E_UM_L,
            EstagioPlanta.VEGETATIVO,
            cultivador
        );

        LocalDate hoje = LocalDate.now();
        LocalDate dataEnviadaPeloCliente = LocalDate.of(2000, 1, 1);

        planta.atualizarDados(
            "Planta",
            null,
            null,
            null,
            null,
            null,
            TamanhVaso.VINTE_E_UM_L,
            EstagioPlanta.FLORACAO_INICIAL,
            null,
            null,
            dataEnviadaPeloCliente
        );

        assertThat(planta.getDataFloracao()).isEqualTo(hoje);
    }
}
