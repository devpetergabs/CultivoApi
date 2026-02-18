package cultivo.api.application.aditivo;

import cultivo.api.domain.aditivo.ClasseAditivo;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ClassificadorAditivoServiceTest {

    private final ClassificadorAditivoService service = new ClassificadorAditivoService();

    @Test
    void shouldInferBaseNutricional() {
        assertThat(service.inferirClasse("Base A+B", "")).isEqualTo(ClasseAditivo.BASE_NUTRICIONAL);
        assertThat(service.inferirClasse("Part A", "")).isEqualTo(ClasseAditivo.BASE_NUTRICIONAL);
        assertThat(service.inferirClasse("Part B", "")).isEqualTo(ClasseAditivo.BASE_NUTRICIONAL);
    }

    @Test
    void shouldInferFortificante() {
        assertThat(service.inferirClasse("Silício", "fortificante"))
            .isEqualTo(ClasseAditivo.FORTIFICANTE);
    }

    @Test
    void shouldInferEstimulante() {
        assertThat(service.inferirClasse("Bud Candy", "carbo / melassa"))
            .isEqualTo(ClasseAditivo.ESTIMULANTE);
    }

    @Test
    void shouldInferBooster() {
        assertThat(service.inferirClasse("Big Bud", "PK booster"))
            .isEqualTo(ClasseAditivo.BOOSTER);
    }

    @Test
    void shouldInferProtecao() {
        assertThat(service.inferirClasse("Neem oil", "inseticida"))
            .isEqualTo(ClasseAditivo.PROTECAO);
    }

    @Test
    void shouldInferFinalizador() {
        assertThat(service.inferirClasse("Flawless Finish", "Flush final"))
            .isEqualTo(ClasseAditivo.FINALIZADOR);
    }

    @Test
    void shouldFallbackToOutros() {
        assertThat(service.inferirClasse("", ""))
            .isEqualTo(ClasseAditivo.OUTROS);
        assertThat(service.inferirClasse("Micorriza", "fungo benéfico"))
            .isEqualTo(ClasseAditivo.OUTROS);
    }
}
