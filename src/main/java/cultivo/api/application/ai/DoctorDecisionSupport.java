package cultivo.api.application.ai;

import java.util.ArrayList;
import java.util.List;

public record DoctorDecisionSupport(
        String dominantModule,
        String dominantReason,
        String responseProfile,
        String stageWindow,
        List<String> secondaryModules,
        String evidenceLevel,
        String confidenceLevel,
        String riskLevel,
        List<String> activeSignals,
        List<String> tradeOffs,
        CauseEffectChain causeEffectChain,
        List<String> businessWarnings,
        List<String> businessRecommendations,
        List<String> businessBlocks,
        List<String> telemetryFocus,
        List<String> appActions,
        String appRuleSummary
) {

    public String toPromptBlock() {
        StringBuilder sb = new StringBuilder();
        append(sb, "modulo_dominante", dominantModule);
        append(sb, "razao_dominante", dominantReason);
        append(sb, "perfil_resposta", responseProfile);
        append(sb, "janela_estagio", stageWindow);
        appendList(sb, "modulos_cruzados", secondaryModules);
        append(sb, "forca_evidencia", evidenceLevel);
        append(sb, "confianca_operacional", confidenceLevel);
        append(sb, "risco_operacional", riskLevel);
        appendList(sb, "sinais_ativos", activeSignals);
        appendList(sb, "tradeoffs", tradeOffs);
        if (causeEffectChain != null) {
            append(sb, "cadeia_acao", causeEffectChain.cultivatorAction());
            append(sb, "cadeia_planta", causeEffectChain.plantEffect());
            append(sb, "cadeia_lote", causeEffectChain.lotEffect());
        }
        appendList(sb, "alertas_negocio", businessWarnings);
        appendList(sb, "recomendacoes_negocio", businessRecommendations);
        appendList(sb, "bloqueios_negocio", businessBlocks);
        appendList(sb, "foco_telemetria", telemetryFocus);
        appendList(sb, "acoes_app", appActions);
        append(sb, "resumo_regra_app", appRuleSummary);
        return sb.toString().trim();
    }

    public record CauseEffectChain(
            String cultivatorAction,
            String plantEffect,
            String lotEffect
    ) {
    }

    private static void append(StringBuilder sb, String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (sb.length() > 0) {
            sb.append('\n');
        }
        sb.append(key).append(": ").append(value.trim());
    }

    private static void appendList(StringBuilder sb, String key, List<String> values) {
        List<String> normalized = normalize(values);
        if (normalized.isEmpty()) {
            return;
        }
        append(sb, key, String.join(" | ", normalized));
    }

    private static List<String> normalize(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        List<String> normalized = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                normalized.add(value.trim());
            }
        }
        return List.copyOf(normalized);
    }
}
