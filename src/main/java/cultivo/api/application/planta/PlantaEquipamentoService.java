package cultivo.api.application.planta;

import cultivo.api.domain.aditivo.Aditivo;
import cultivo.api.domain.aditivo.TipoProduto;
import cultivo.api.domain.planta.*;
import cultivo.api.infrastructure.persistence.aditivo.AditivoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaEquipamentoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaEventoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PlantaEquipamentoService {

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private AditivoRepository produtoRepository;

    @Autowired
    private PlantaEquipamentoRepository equipamentoRepository;

    @Autowired
    private PlantaEventoRepository eventoRepository;

    /**
     * Garante que a planta tenha um vaso (slot POT) equipado coerente com o tamanhoVaso atual.
     * Útil para create/update e para manter compatibilidade com o campo tamanho_vaso.
     */
    public void garantirPoteSincronizado(Planta planta, boolean gerarEventoTroca) {
        if (planta == null || planta.getId() == null) return;
        if (planta.getTamanhoVaso() == null) return;

        int litros = tamanhoVasoParaLitros(planta.getTamanhoVaso());
        Aditivo vaso = produtoRepository
                .findFirstByTipoAndCapacidadeLitros(TipoProduto.VASO, litros)
                .orElseThrow(() -> new IllegalStateException("Catálogo de vasos não encontrado para " + litros + "L"));

        upsertPote(planta, vaso, null, null, null, gerarEventoTroca);
    }

    /**
     * Equipa um vaso específico (Produto tipo=VASO) e sincroniza tamanhoVaso da planta.
     */
    public PlantaEquipamento equiparPote(Long plantaId, Long produtoVasoId, String corHex, String skinId, String apelido) {
        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty()) throw new IllegalArgumentException("Planta não encontrada");
        var planta = plantaOpt.get();

        if (produtoVasoId == null || produtoVasoId <= 0) {
            throw new IllegalArgumentException("produtoId é obrigatório");
        }

        Aditivo vaso = produtoRepository
                .findByIdAndTipo(produtoVasoId, TipoProduto.VASO)
                .orElseThrow(() -> new IllegalArgumentException("Produto informado não é um VASO válido"));

        Integer litros = vaso.getCapacidadeLitros();
        if (litros == null) throw new IllegalArgumentException("VASO sem capacidade_litros configurada");

        // sincroniza campo legado
        planta.atualizarDados(null, null, null, null, null, null, litrosParaTamanhoVaso(litros), null, null, null, null);
        plantaRepository.save(planta);

        return upsertPote(planta, vaso, corHex, skinId, apelido, true);
    }

    private PlantaEquipamento upsertPote(
            Planta planta,
            Aditivo vaso,
            String corHex,
            String skinId,
            String apelido,
            boolean gerarEventoTroca
    ) {
        var existingOpt = equipamentoRepository.findByPlantaIdAndSlot(planta.getId(), SlotEquipamento.POT);

        boolean mudou = false;
        PlantaEquipamento equipamento;

        if (existingOpt.isPresent()) {
            equipamento = existingOpt.get();
            Long oldId = equipamento.getProduto() != null ? equipamento.getProduto().getId() : null;
            Long newId = vaso.getId();
            mudou = oldId == null || !oldId.equals(newId);
            equipamento.atualizar(vaso, corHex, skinId, apelido);
        } else {
            equipamento = new PlantaEquipamento(planta, SlotEquipamento.POT, vaso);
            equipamento.atualizar(vaso, corHex, skinId, apelido);
            mudou = true;
        }

        equipamento = equipamentoRepository.save(equipamento);

        if (gerarEventoTroca && mudou) {
            criarEventoTrocaVaso(planta, vaso);
        }

        return equipamento;
    }

    private void criarEventoTrocaVaso(Planta planta, Aditivo vaso) {
        String desc = "Vaso equipado: " + (vaso.getNome() != null ? vaso.getNome() : ("VASO " + vaso.getCapacidadeLitros() + "L"));
        var evento = new PlantaEvento(planta, TipoEvento.TROCA_VASO, LocalDateTime.now(), desc, null);
        eventoRepository.save(evento);
    }

    private static int tamanhoVasoParaLitros(TamanhVaso v) {
        return switch (v) {
            case CINCO_L -> 5;
            case VINTE_E_UM_L -> 21;
            case TRINTA_L -> 30;
        };
    }

    private static TamanhVaso litrosParaTamanhoVaso(int litros) {
        return switch (litros) {
            case 5 -> TamanhVaso.CINCO_L;
            case 21 -> TamanhVaso.VINTE_E_UM_L;
            case 30 -> TamanhVaso.TRINTA_L;
            default -> throw new IllegalArgumentException("Capacidade de vaso não suportada: " + litros);
        };
    }
}
