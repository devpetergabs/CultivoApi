package cultivo.api.api.controller.planta;

/**
 * DTO para PATCH parcial de evento.
 *
 * Campos podem ser null; validação é feita no controller.
 */
public record DadosAtualizacaoEvento(
        String descricao,
        Double doseEmML
) {
}
