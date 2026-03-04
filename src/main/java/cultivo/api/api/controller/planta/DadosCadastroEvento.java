package cultivo.api.api.controller.planta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record DadosCadastroEvento(
        @NotBlank(message = "Tipo do evento é obrigatório")
        String tipo,

        String descricao,

        @Positive(message = "Dose deve ser maior que zero")
        Double doseEmML,

        // --- Produto (inventário) ---
        Long produtoId,

        // --- Mix (rega aditivada / modelo aditivado): consumos por produto ---
        List<DadosConsumoProduto> consumos,

        // --- INSETICIDA: rounds ---
        Integer roundsTotal,
        Integer descansoDias
) {
}
