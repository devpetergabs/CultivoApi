package cultivo.api.application.ai;

import java.util.ArrayList;
import java.util.List;

public record DoctorPlantAnalysisContext(
        Metadados metadados,
        Telemetria telemetria,
        HistoricoSaude historicoSaude,
        List<String> lacunasCriticas
) {

    public String toPromptBlock() {
        List<String> linhas = new ArrayList<>();
        linhas.add("{");

        appendObjeto(linhas, "metadados", metadados != null ? metadados.toPromptFields() : List.of(), true);
        appendObjeto(linhas, "telemetria", telemetria != null ? telemetria.toPromptFields() : List.of(), true);
        appendObjeto(linhas, "historico_saude", historicoSaude != null ? historicoSaude.toPromptFields() : List.of(), true);

        if (lacunasCriticas != null && !lacunasCriticas.isEmpty()) {
            linhas.add("  \"lacunas_criticas\": [");
            for (int i = 0; i < lacunasCriticas.size(); i++) {
                String sufixo = i < lacunasCriticas.size() - 1 ? "," : "";
                linhas.add("    \"" + escape(lacunasCriticas.get(i)) + "\"" + sufixo);
            }
            linhas.add("  ]");
        } else {
            removerVirgulaFinalSeNecessario(linhas);
        }

        linhas.add("}");
        return String.join("\n", linhas);
    }

    public String toSearchText() {
        List<String> partes = new ArrayList<>();
        if (metadados != null) {
            partes.addAll(metadados.toSearchParts());
        }
        if (telemetria != null) {
            partes.addAll(telemetria.toSearchParts());
        }
        if (historicoSaude != null) {
            partes.addAll(historicoSaude.toSearchParts());
        }
        if (lacunasCriticas != null) {
            partes.addAll(lacunasCriticas);
        }
        return String.join(" ", partes);
    }

    private static void appendObjeto(List<String> linhas, String nome, List<String> campos, boolean trailingComma) {
        linhas.add("  \"" + nome + "\": {");
        if (campos.isEmpty()) {
            linhas.add("  }," );
            return;
        }

        for (int i = 0; i < campos.size(); i++) {
            String sufixo = i < campos.size() - 1 ? "," : "";
            linhas.add("    " + campos.get(i) + sufixo);
        }
        linhas.add(trailingComma ? "  }," : "  }");
    }

    private static void removerVirgulaFinalSeNecessario(List<String> linhas) {
        if (linhas.isEmpty()) {
            return;
        }
        int ultimoIndice = linhas.size() - 1;
        String ultimaLinha = linhas.get(ultimoIndice);
        if (ultimaLinha.endsWith(",")) {
            linhas.set(ultimoIndice, ultimaLinha.substring(0, ultimaLinha.length() - 1));
        }
    }

    private static String escape(String valor) {
        return valor.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    public record Metadados(
            String nome,
            String especie,
            String tipoCiclo,
            String genetica,
            String strain,
            String estagio,
            String sexo,
            String tamanhoVaso,
            String dataGerminacao,
            String dataFloracao,
            Boolean pragaAtiva,
            Boolean ativo
    ) {
        List<String> toPromptFields() {
            List<String> campos = new ArrayList<>();
            add(campos, "nome", nome);
            add(campos, "especie", especie);
            add(campos, "tipo_ciclo", tipoCiclo);
            add(campos, "genetica", genetica);
            add(campos, "strain", strain);
            add(campos, "estagio", estagio);
            add(campos, "sexo", sexo);
            add(campos, "vaso", tamanhoVaso);
            add(campos, "data_germinacao", dataGerminacao);
            add(campos, "data_floracao", dataFloracao);
            add(campos, "praga_ativa", pragaAtiva);
            add(campos, "ativa", ativo);
            return campos;
        }

        List<String> toSearchParts() {
            List<String> partes = new ArrayList<>();
            addSearch(partes, nome);
            addSearch(partes, especie);
            addSearch(partes, tipoCiclo);
            addSearch(partes, genetica);
            addSearch(partes, strain);
            addSearch(partes, estagio);
            addSearch(partes, sexo);
            addSearch(partes, tamanhoVaso);
            return partes;
        }
    }

    public record Telemetria(
            Double alturaCm,
            Double larguraCm,
            Double larguraCauleCm,
            String ultimaObservacao,
            String ultimaRega
    ) {
        List<String> toPromptFields() {
            List<String> campos = new ArrayList<>();
            add(campos, "altura_cm", alturaCm);
            add(campos, "largura_cm", larguraCm);
            add(campos, "largura_caule_cm", larguraCauleCm);
            add(campos, "ultima_observacao", ultimaObservacao);
            add(campos, "ultima_rega", ultimaRega);
            return campos;
        }

        List<String> toSearchParts() {
            List<String> partes = new ArrayList<>();
            addSearch(partes, ultimaObservacao);
            addSearch(partes, ultimaRega);
            return partes;
        }
    }

    public record HistoricoSaude(
            String ultimoSinalPraga,
            String ultimoTratamento
    ) {
        List<String> toPromptFields() {
            List<String> campos = new ArrayList<>();
            add(campos, "ultimo_sinal_praga", ultimoSinalPraga);
            add(campos, "ultimo_tratamento", ultimoTratamento);
            return campos;
        }

        List<String> toSearchParts() {
            List<String> partes = new ArrayList<>();
            addSearch(partes, ultimoSinalPraga);
            addSearch(partes, ultimoTratamento);
            return partes;
        }
    }

    private static void add(List<String> campos, String chave, String valor) {
        if (valor == null || valor.isBlank()) {
            return;
        }
        campos.add("\"" + chave + "\": \"" + escape(valor) + "\"");
    }

    private static void add(List<String> campos, String chave, Double valor) {
        if (valor == null) {
            return;
        }
        campos.add("\"" + chave + "\": " + String.format(java.util.Locale.US, "%.2f", valor));
    }

    private static void add(List<String> campos, String chave, Boolean valor) {
        if (valor == null) {
            return;
        }
        campos.add("\"" + chave + "\": " + valor);
    }

    private static void addSearch(List<String> partes, String valor) {
        if (valor != null && !valor.isBlank()) {
            partes.add(valor);
        }
    }
}