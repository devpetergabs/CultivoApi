package cultivo.api.application.aditivo;

import cultivo.api.domain.aditivo.ClasseAditivo;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;

@Service
public class ClassificadorAditivoService {

    public ClasseAditivo inferirClasse(String nome, String descricao) {
        String haystack = normalizar((nome == null ? "" : nome) + " " + (descricao == null ? "" : descricao));
        if (haystack.isBlank()) {
            return ClasseAditivo.OUTROS;
        }

        // BASE_NUTRICIONAL
        String compact = haystack.replaceAll("\\s+", "");
        if (compact.contains("a+b")
            || haystack.contains("part a")
            || haystack.contains("part b")
            || haystack.contains("base")) {
            return ClasseAditivo.BASE_NUTRICIONAL;
        }

        // FORTIFICANTE
        if (haystack.contains("silica")
            || haystack.contains("silicio")
            || haystack.contains("fortificante")) {
            return ClasseAditivo.FORTIFICANTE;
        }

        // ESTIMULANTE
        if (haystack.contains("candy")
            || haystack.contains("sweet")
            || haystack.contains("carbo")
            || haystack.contains("melassa")) {
            return ClasseAditivo.ESTIMULANTE;
        }

        // BOOSTER
        if (haystack.contains("big bud")
            || haystack.contains("bloom booster")
            || haystack.contains("booster")
            || haystack.contains(" pk ")
            || haystack.endsWith(" pk")
            || haystack.startsWith("pk ")
            || haystack.equals("pk")) {
            return ClasseAditivo.BOOSTER;
        }

        // PROTECAO
        if (haystack.contains("spinosad")
            || haystack.contains("neem")
            || haystack.contains("inseticida")
            || haystack.contains("fungicida")) {
            return ClasseAditivo.PROTECAO;
        }

        // FINALIZADOR
        if (haystack.contains("flush")
            || haystack.contains("finish")
            || haystack.contains("finalizador")
            || haystack.contains("flawless finish")) {
            return ClasseAditivo.FINALIZADOR;
        }

        return ClasseAditivo.OUTROS;
    }

    private static String normalizar(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        String normalized = Normalizer.normalize(lower, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
        return normalized.replaceAll("[^a-z0-9+ ]", " ").replaceAll("\\s+", " ").trim();
    }
}
