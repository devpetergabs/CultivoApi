package cultivo.api.application.ai;

import cultivo.api.api.controller.codex.DadosCodexEstagio;
import cultivo.api.application.planta.CodexEstagioService;
import cultivo.api.domain.planta.Planta;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.StringJoiner;

@Service
public class DoctorPlantCodexContextBuilder {

    private final CodexEstagioService codexEstagioService;

    public DoctorPlantCodexContextBuilder(CodexEstagioService codexEstagioService) {
        this.codexEstagioService = codexEstagioService;
    }

    public DoctorPlantCodexContext build(Planta planta) {
        if (planta == null || planta.getEstagio() == null) {
            return DoctorPlantCodexContext.empty();
        }

        try {
            DadosCodexEstagio codex = codexEstagioService.detalharEstagio(planta.getEstagio());
            return new DoctorPlantCodexContext(
                    codex.estagio(),
                    codex.slug(),
                    codex.temaVisual(),
                    toPromptBlock(codex),
                    toSearchText(codex)
            );
        } catch (Exception ex) {
            return DoctorPlantCodexContext.empty();
        }
    }

    private String toPromptBlock(DadosCodexEstagio codex) {
        StringBuilder sb = new StringBuilder();
        appendField(sb, "estagio", codex.estagio());
        appendField(sb, "slug", codex.slug());
        appendField(sb, "nome_exibicao", codex.nomeExibicao());
        appendField(sb, "subtitulo", codex.subtitulo());
        appendField(sb, "tema_visual", codex.temaVisual());
        appendField(sb, "descricao_breve", codex.descricaoBreve());
        appendField(sb, "descricao_lore", codex.descricaoLore());
        appendField(sb, "resistencia", codex.resistencia());
        appendBullets(sb, "cuidados_principais", codex.cuidadosPrincipais(), 4);
        appendBullets(sb, "alertas", codex.alertas(), 4);
        appendBullets(sb, "pontos_fortes", codex.pontosFortes(), 3);
        appendBullets(sb, "pontos_fracos", codex.pontosFracos(), 3);
        appendBullets(sb, "curiosidades_relevantes", codex.curiosidades(), 3);
        return sb.toString().trim();
    }

    private String toSearchText(DadosCodexEstagio codex) {
        StringJoiner joiner = new StringJoiner(" ");
        add(joiner, codex.estagio());
        add(joiner, codex.slug());
        add(joiner, codex.nomeExibicao());
        add(joiner, codex.subtitulo());
        add(joiner, codex.descricaoBreve());
        add(joiner, codex.temaVisual());
        add(joiner, codex.resistencia());
        add(joiner, String.join(" ", limit(codex.cuidadosPrincipais(), 4)));
        add(joiner, String.join(" ", limit(codex.alertas(), 4)));
        add(joiner, String.join(" ", limit(codex.pontosFortes(), 3)));
        add(joiner, String.join(" ", limit(codex.pontosFracos(), 3)));
        return joiner.toString().trim();
    }

    private void appendField(StringBuilder sb, String label, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        sb.append(label).append(": ").append(value.trim()).append("\n");
    }

    private void appendBullets(StringBuilder sb, String label, List<String> values, int maxItems) {
        List<String> limited = limit(values, maxItems);
        if (limited.isEmpty()) {
            return;
        }
        sb.append(label).append(":\n");
        for (String value : limited) {
            sb.append("- ").append(value).append("\n");
        }
    }

    private List<String> limit(List<String> values, int maxItems) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        return values.stream()
                .filter(item -> item != null && !item.isBlank())
                .limit(maxItems)
                .toList();
    }

    private void add(StringJoiner joiner, String value) {
        if (value != null && !value.isBlank()) {
            joiner.add(value.trim());
        }
    }
}