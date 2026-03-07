package cultivo.api.application.ai;

import cultivo.api.application.ai.DoctorPlantKnowledgeBase.CrossSourceSynthesis;
import cultivo.api.application.ai.DoctorPlantKnowledgeBase.ReferenceSource;

import java.util.List;

public record DoctorAnalysisDiagnostics(
        String retrievalQuery,
        List<String> referenceSources,
        List<String> referenceDebug,
        boolean strongLocalGrounding,
        String routeTopic,
        List<String> routeTopics,
        List<String> preferredLanguages,
        boolean mandatoryBible,
        List<ReferenceSource> referenceSourceDetails,
        CrossSourceSynthesis crossSourceSynthesis,
        boolean usedCodex,
        String codexStage,
        boolean usedPestSpecialist,
        List<String> hypothesesConsidered,
        List<String> criticalMissingData,
        boolean blockedByEvidenceGate,
        DoctorDecisionSupport decisionSupport
) {
}