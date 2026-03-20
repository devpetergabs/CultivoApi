package cultivo.api.application.ai;

import cultivo.api.api.controller.planta.DadosResultadoAnalisePlantaFoto;

public record DoctorAnalysisOutcome(
        DadosResultadoAnalisePlantaFoto response,
        DoctorAnalysisDiagnostics diagnostics
) {
}