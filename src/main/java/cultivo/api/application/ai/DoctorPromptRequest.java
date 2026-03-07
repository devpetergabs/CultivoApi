package cultivo.api.application.ai;

public record DoctorPromptRequest(
        DoctorChatMode mode,
        DoctorChatIntent intent,
        String intentBlock,
        String userMessage,
        String referencesBlock,
        String codexBlock,
        String caseFactsBlock,
        String evidenceContractBlock,
        String differentialBlock,
        String decisionSupportBlock,
        String plantContextBlock,
        String weatherBlock,
        String specialistBlock,
        String conversationMemoryBlock,
        String conversationSummaryBlock,
        String historyBlock
) {
}
