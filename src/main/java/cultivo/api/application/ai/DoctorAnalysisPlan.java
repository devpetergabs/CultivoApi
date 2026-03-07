package cultivo.api.application.ai;

import java.util.List;

public record DoctorAnalysisPlan(
        String caseFactsBlock,
        String evidenceContractBlock,
        String differentialBlock,
        List<String> hypotheses,
        List<String> criticalMissingData,
        List<String> followUpQuestions,
        String primaryQuery,
        String differentialQuery,
        boolean blockedByEvidenceGate
) {
}