package cultivo.api.application.ai;

public record DoctorPlantCodexContext(
        String stageName,
        String slug,
        String theme,
        String promptBlock,
        String searchText
) {

    public static DoctorPlantCodexContext empty() {
        return new DoctorPlantCodexContext(null, null, null, "", "");
    }

    public boolean isEmpty() {
        return promptBlock == null || promptBlock.isBlank();
    }
}