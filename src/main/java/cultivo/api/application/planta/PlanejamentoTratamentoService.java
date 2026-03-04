package cultivo.api.application.planta;

import cultivo.api.domain.planta.*;
import cultivo.api.infrastructure.persistence.planta.PlantaEventoPlanejadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Serviço "pure" de planejamento: ele só olha para Tratamento + Repos e mantém
 * a tabela de planejados consistente. NÃO depende de PlantaAgendaService nem de PlantaEventoService.
 *
 * Isso quebra ciclos de DI e deixa a feature modular para outros planejamentos no futuro.
 */
@Service
public class PlanejamentoTratamentoService {

    @Autowired
    private PlantaEventoPlanejadoRepository planejadoRepository;

    /**
     * Idempotente: gera/atualiza os planejados do tratamento (por roundIndex).
     *
     * Regra (INSETICIDA):
     * - rounds 1..roundsTotal
     * - scheduledAt = inicioEm + (roundIndex-1)*descansoDias (preserva o horário do início)
     * - EXECUTADO se roundIndex <= roundAtual
     * - CANCELADO se tratamento CANCELADO
     * - PENDENTE caso contrário
     *
     * Observação: se o evento origem tem dose, copiamos para os planejados que ainda não têm dose.
     */
    @Transactional
    public void cancelarInseticidaPlanejados(Long tratamentoId) {
        if (tratamentoId == null) return;
        var list = planejadoRepository.findByTratamentoIdAndTipoOrderByRoundIndexAsc(
                tratamentoId,
                TipoEventoPlanejado.INSETICIDA_ROUND
        );
        for (var p : list) {
            if (p.getStatus() != StatusEventoPlanejado.CANCELADO) {
                p.cancelar();
                p.touch();
                planejadoRepository.save(p);
            }
        }
    }

    public void syncInseticida(PlantaTratamento t, PlantaEvento eventoOrigem) {
        if (t == null || t.getId() == null) return;

        int total = Math.max(1, t.getRoundsTotal() == null ? 1 : t.getRoundsTotal());
        int descanso = Math.max(0, t.getDescansoDias() == null ? 0 : t.getDescansoDias());
        int roundAtual = Math.max(0, t.getRoundAtual() == null ? 0 : t.getRoundAtual());

        LocalDateTime inicio = t.getInicioEm();
        if (inicio == null) inicio = LocalDateTime.now();

        for (int i = 1; i <= total; i++) {
            LocalDateTime scheduledAt = inicio.plusDays((long) (i - 1) * descanso);

            StatusEventoPlanejado status;
            if (t.getStatus() == StatusTratamento.CANCELADO) {
                status = StatusEventoPlanejado.CANCELADO;
            } else if (i <= roundAtual) {
                status = StatusEventoPlanejado.EXECUTADO;
            } else {
                status = StatusEventoPlanejado.PENDENTE;
            }

            var opt = planejadoRepository.findByTratamentoIdAndTipoAndRoundIndex(
                    t.getId(),
                    TipoEventoPlanejado.INSETICIDA_ROUND,
                    i
            );

            PlantaEventoPlanejado pe;
            if (opt.isPresent()) {
                pe = opt.get();
                if (pe.getScheduledAt() == null || !pe.getScheduledAt().equals(scheduledAt)) {
                    pe.reschedule(scheduledAt);
                }
            } else {
                pe = new PlantaEventoPlanejado(t.getPlanta(), t, TipoEventoPlanejado.INSETICIDA_ROUND, i, scheduledAt);
            }

            // status
            if (status == StatusEventoPlanejado.CANCELADO) {
                if (pe.getStatus() != StatusEventoPlanejado.CANCELADO) pe.cancelar();
            } else if (status == StatusEventoPlanejado.EXECUTADO) {
                // se foi o round do evento atual, linka
                if (eventoOrigem != null && eventoOrigem.getRoundAtual() != null && eventoOrigem.getRoundAtual() == i) {
                    pe.marcarExecutado(eventoOrigem, eventoOrigem.getDataEvento());
                } else if (pe.getStatus() != StatusEventoPlanejado.EXECUTADO) {
                    pe.marcarExecutado(null, null);
                }
            } else {
                // pendente: não desfaz EXECUTADO/CANCELADO; MVP foca em agenda e próxima aplicação
                // se quiser "reabrir" rounds no futuro, aí sim criamos uma regra explícita.
            }

            // dose: tenta carregar do evento origem
            if (pe.getDoseEmML() == null && eventoOrigem != null && eventoOrigem.getDoseEmML() != null) {
                pe.setDoseEmML(eventoOrigem.getDoseEmML());
            }

            pe.touch();
            planejadoRepository.save(pe);
        }
    }
}
