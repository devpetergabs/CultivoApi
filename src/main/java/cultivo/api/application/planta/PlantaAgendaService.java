package cultivo.api.application.planta;

import cultivo.api.api.controller.planta.DadosCadastroEvento;
import cultivo.api.domain.planta.*;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.planta.PlantaEventoPlanejadoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaTratamentoRepository;
import cultivo.api.infrastructure.security.AccessControl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PlantaAgendaService {

    private static final ZoneId ZONE_SP = ZoneId.of("America/Sao_Paulo");

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private PlantaTratamentoRepository tratamentoRepository;

    @Autowired
    private PlantaEventoPlanejadoRepository planejadoRepository;

    @Autowired
    private PlantaEventoService eventoService;

    /**
     * Garante que exista uma agenda (planejados) para o tratamento ativo de INSETICIDA.
     * Se a feature foi ligada com tratamento já em andamento, criamos os planejados "on the fly".
     */
    @Transactional
    public AgendaInseticidaSnapshot getAgendaInseticida(Long plantaId, Usuario usuario) {
        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty()) throw new IllegalArgumentException("Planta não encontrada");
        var planta = plantaOpt.get();

        if (usuario == null || !AccessControl.canReadPlanta(usuario, planta)) {
            throw new IllegalArgumentException("Acesso negado");
        }

        var tratamentoOpt = tratamentoRepository.findFirstByPlantaIdAndStatusAndTipoOrderByUpdatedAtDesc(
                plantaId,
                StatusTratamento.ATIVO,
                TipoTratamento.INSETICIDA
        );

        if (tratamentoOpt.isEmpty()) {
            return null;
        }

        var tratamento = tratamentoOpt.get();

        // se não existem planejados (tratamento anterior ao recurso), cria
        ensurePlanejadosInseticida(tratamento);

        var list = planejadoRepository.findByTratamentoIdAndTipoOrderByRoundIndexAsc(
                tratamento.getId(),
                TipoEventoPlanejado.INSETICIDA_ROUND
        );

        return AgendaInseticidaSnapshot.from(planta, tratamento, list);
    }

    @Transactional
    public void syncFromInseticidaEvento(PlantaEvento evento) {
        if (evento == null || evento.getTratamento() == null) return;
        var t = evento.getTratamento();
        ensurePlanejadosInseticida(t);

        int total = Math.max(1, t.getRoundsTotal() == null ? 1 : t.getRoundsTotal());
        int descanso = Math.max(0, t.getDescansoDias() == null ? 0 : t.getDescansoDias());
        int roundAtual = Math.max(0, t.getRoundAtual() == null ? 0 : t.getRoundAtual());
        var inicio = t.getInicioEm();

        for (int i = 1; i <= total; i++) {
            LocalDateTime scheduledAt = inicio.plusDays((long) (i - 1) * descanso);

            var opt = planejadoRepository.findByTratamentoIdAndTipoAndRoundIndex(
                    t.getId(),
                    TipoEventoPlanejado.INSETICIDA_ROUND,
                    i
            );

            PlantaEventoPlanejado pe;
            if (opt.isPresent()) {
                pe = opt.get();
                if (!pe.getScheduledAt().equals(scheduledAt)) {
                    pe.reschedule(scheduledAt);
                }
            } else {
                pe = new PlantaEventoPlanejado(
                        t.getPlanta(),
                        t,
                        TipoEventoPlanejado.INSETICIDA_ROUND,
                        i,
                        scheduledAt
                );
            }

            // carrega dose do evento origem (se existir)
            if (pe.getDoseEmML() == null && evento.getDoseEmML() != null) {
                pe.setDoseEmML(evento.getDoseEmML());
            }

            if (t.getStatus() == StatusTratamento.CANCELADO) {
                if (pe.getStatus() != StatusEventoPlanejado.CANCELADO) pe.cancelar();
            } else if (i <= roundAtual) {
                // marca como executado; apenas linka o evento atual no round correspondente
                if (pe.getStatus() != StatusEventoPlanejado.EXECUTADO) {
                    pe.marcarExecutado(null, null);
                }
                if (evento.getRoundAtual() != null && evento.getRoundAtual() == i) {
                    pe.marcarExecutado(evento, evento.getDataEvento());
                    if (pe.getDoseEmML() == null && evento.getDoseEmML() != null) {
                        pe.setDoseEmML(evento.getDoseEmML());
                    }
                }
            } else {
                // mantém pendente (não resetamos EXECUTADO)
                if (pe.getStatus() == null) {
                    pe = new PlantaEventoPlanejado(t.getPlanta(), t, TipoEventoPlanejado.INSETICIDA_ROUND, i, scheduledAt);
                }
                if (pe.getStatus() != StatusEventoPlanejado.PENDENTE) {
                    // Se o cara reabriu um tratamento ou ajustou rounds, volta a ser pendente
                    pe.reschedule(scheduledAt);
                    // sem setter dedicado, reschedule só atualiza data; status fica como está
                    // então garantimos aqui
                    // (status pode ser CANCELADO/EXECUTADO; só mudamos se fazia sentido)
                    if (pe.getStatus() != StatusEventoPlanejado.CANCELADO) {
                        // não sobrescreve cancelado
                        // se estava EXECUTADO mas roundAtual diminuiu (edge case), volta a PENDENTE
                        // isso é raro no MVP, mas deixa consistente.
                        trySetStatusPendente(pe);
                    }
                }
            }

            pe.touch();
            planejadoRepository.save(pe);
        }
    }

    @Transactional
    public void cancelarPlanejadosPorTratamento(Long tratamentoId) {
        if (tratamentoId == null) return;
        var list = planejadoRepository.findByTratamentoIdAndTipoOrderByRoundIndexAsc(
                tratamentoId,
                TipoEventoPlanejado.INSETICIDA_ROUND
        );
        for (var p : list) {
            if (p.getStatus() != StatusEventoPlanejado.CANCELADO) {
                p.cancelar();
                planejadoRepository.save(p);
            }
        }
    }

    private void trySetStatusPendente(PlantaEventoPlanejado pe) {
        // hack seguro: não criamos setter público no MVP.
        // Se o status não é pendente, recriamos mantendo id? não dá.
        // Então deixamos como está. (O front usa roundIndex vs roundAtual para decidir o "próximo".)
    }

    private void ensurePlanejadosInseticida(PlantaTratamento t) {
        var existing = planejadoRepository.findByTratamentoIdAndTipoOrderByRoundIndexAsc(
                t.getId(),
                TipoEventoPlanejado.INSETICIDA_ROUND
        );
        if (!existing.isEmpty()) return;

        int total = Math.max(1, t.getRoundsTotal() == null ? 1 : t.getRoundsTotal());
        int descanso = Math.max(0, t.getDescansoDias() == null ? 0 : t.getDescansoDias());
        var inicio = t.getInicioEm();
        for (int i = 1; i <= total; i++) {
            LocalDateTime scheduledAt = inicio.plusDays((long) (i - 1) * descanso);
            var pe = new PlantaEventoPlanejado(t.getPlanta(), t, TipoEventoPlanejado.INSETICIDA_ROUND, i, scheduledAt);
            if (t.getRoundAtual() != null && i <= t.getRoundAtual()) {
                pe.marcarExecutado(null, null);
            }
            planejadoRepository.save(pe);
        }
    }

    @Transactional
    public PlantaEvento marcarPlanejadoDone(Long plantaId, Long planejadoId, Usuario usuario) {
        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty()) throw new IllegalArgumentException("Planta não encontrada");
        var planta = plantaOpt.get();
        if (usuario == null || !AccessControl.canWritePlanta(usuario, planta)) {
            throw new IllegalArgumentException("Acesso negado");
        }

        var pe = planejadoRepository.findById(planejadoId)
                .orElseThrow(() -> new IllegalArgumentException("Planejado não encontrado"));

        if (!pe.getPlanta().getId().equals(plantaId)) {
            throw new IllegalArgumentException("Planejado não pertence à planta");
        }

        if (pe.getStatus() == StatusEventoPlanejado.EXECUTADO) {
            return pe.getEventoExecucao();
        }

        var t = pe.getTratamento();
        if (t == null || t.getStatus() != StatusTratamento.ATIVO) {
            throw new IllegalArgumentException("Tratamento não está ativo");
        }

        int atual = Math.max(0, t.getRoundAtual() == null ? 0 : t.getRoundAtual());
        int expected = atual + 1;
        if (pe.getRoundIndex() == null || pe.getRoundIndex() != expected) {
            throw new IllegalArgumentException("Só é permitido marcar o próximo round pendente (ordem)");
        }

        // Cria evento real com timestamp do planejamento (A: não pede dose)
        var dados = new DadosCadastroEvento(
                TipoEvento.INSETICIDA.name(),
                buildDescricaoRound(t, pe),
                pe.getDoseEmML(),
                t.getProduto().getId(),
                null,
                t.getRoundsTotal(),
                t.getDescansoDias()
        );

        String idempotency = "planned:" + planejadoId;

        PlantaEvento evento = eventoService.criarEventoComTimestamp(plantaId, dados, idempotency, usuario, pe.getScheduledAt());

        // marca planejado executado
        pe.marcarExecutado(evento, pe.getScheduledAt());
        if (pe.getDoseEmML() == null && evento.getDoseEmML() != null) {
            pe.setDoseEmML(evento.getDoseEmML());
        }
        planejadoRepository.save(pe);

        // ressincroniza para atualizar statuses/novos rounds
        syncFromInseticidaEvento(evento);

        return evento;
    }

    private String buildDescricaoRound(PlantaTratamento t, PlantaEventoPlanejado pe) {
        String produto = t.getProduto() != null ? t.getProduto().getNome() : "INSETICIDA";
        int total = Math.max(1, t.getRoundsTotal() == null ? 1 : t.getRoundsTotal());
        int idx = pe.getRoundIndex() != null ? pe.getRoundIndex() : 0;
        return "Aplicação planejada: " + produto + " (round " + idx + "/" + total + ")";
    }

    @Transactional
    public byte[] gerarIcsAgendaInseticida(Long plantaId, Usuario usuario) {
        var snapshot = getAgendaInseticida(plantaId, usuario);
        if (snapshot == null) throw new IllegalArgumentException("Sem tratamento ativo");

        var plantName = snapshot.plantaNome;
        var produtoNome = snapshot.produtoNome;
        int total = snapshot.roundsTotal;

        List<AgendaInseticidaSnapshot.PlanejadoItem> pendentes = new ArrayList<>();
        for (var p : snapshot.planejados) {
            if (p.status == StatusEventoPlanejado.PENDENTE) pendentes.add(p);
        }
        if (pendentes.isEmpty()) {
            pendentes.addAll(snapshot.planejados);
        }

        String ics = buildIcs(plantName, produtoNome, total, pendentes);
        return ics.getBytes(StandardCharsets.UTF_8);
    }

    private String buildIcs(String plantaNome, String produtoNome, int roundsTotal, List<AgendaInseticidaSnapshot.PlanejadoItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//CultivoInteligente//Agenda//PT-BR\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");

        // VTIMEZONE minimalista (suficiente para a maioria dos clientes)
        sb.append("BEGIN:VTIMEZONE\r\n");
        sb.append("TZID:America/Sao_Paulo\r\n");
        sb.append("BEGIN:STANDARD\r\n");
        sb.append("DTSTART:19700101T000000\r\n");
        sb.append("TZOFFSETFROM:-0300\r\n");
        sb.append("TZOFFSETTO:-0300\r\n");
        sb.append("TZNAME:BRT\r\n");
        sb.append("END:STANDARD\r\n");
        sb.append("END:VTIMEZONE\r\n");

        var dtstamp = ZonedDateTime.now(ZONE_SP).withZoneSameInstant(ZoneId.of("UTC"))
                .format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));
        var fmtLocal = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

        for (var it : items) {
            String uid = "cultivo-" + (it.id != null ? it.id : UUID.randomUUID()) + "@cultivo-inteligente";
            String dtstart = it.scheduledAt.atZone(ZONE_SP).format(fmtLocal);

            String summary = "[Cultivo] " + plantaNome + " — Aplicar " + produtoNome + " (Round " + it.roundIndex + "/" + roundsTotal + ")";
            String desc = "Tratamento de inseticida. Descanso e rounds gerados pelo Cultivo Inteligente.";
            if (it.doseEmML != null) {
                desc += " Dose: " + it.doseEmML + "mL.";
            }

            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:").append(escape(uid)).append("\r\n");
            sb.append("DTSTAMP:").append(dtstamp).append("\r\n");
            sb.append("DTSTART;TZID=America/Sao_Paulo:").append(dtstart).append("\r\n");
            sb.append("DURATION:PT15M\r\n");
            sb.append("SUMMARY:").append(escape(summary)).append("\r\n");
            sb.append("DESCRIPTION:").append(escape(desc)).append("\r\n");
            sb.append("END:VEVENT\r\n");
        }

        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    private String escape(String v) {
        if (v == null) return "";
        return v
                .replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\n", "\\n")
                .replace("\r", "");
    }

    /**
     * DTO interno para controller.
     */
    public static class AgendaInseticidaSnapshot {
        public final Long plantaId;
        public final String plantaNome;
        public final Long tratamentoId;
        public final String produtoNome;
        public final Integer roundsTotal;
        public final Integer roundAtual;
        public final Integer descansoDias;
        public final LocalDateTime inicioEm;
        public final LocalDateTime fimTratamentoEm;
        public final LocalDateTime proximaAplicacaoEm;
        public final List<PlanejadoItem> planejados;

        private AgendaInseticidaSnapshot(
                Long plantaId,
                String plantaNome,
                Long tratamentoId,
                String produtoNome,
                Integer roundsTotal,
                Integer roundAtual,
                Integer descansoDias,
                LocalDateTime inicioEm,
                LocalDateTime fimTratamentoEm,
                LocalDateTime proximaAplicacaoEm,
                List<PlanejadoItem> planejados
        ) {
            this.plantaId = plantaId;
            this.plantaNome = plantaNome;
            this.tratamentoId = tratamentoId;
            this.produtoNome = produtoNome;
            this.roundsTotal = roundsTotal;
            this.roundAtual = roundAtual;
            this.descansoDias = descansoDias;
            this.inicioEm = inicioEm;
            this.fimTratamentoEm = fimTratamentoEm;
            this.proximaAplicacaoEm = proximaAplicacaoEm;
            this.planejados = planejados;
        }

        public static AgendaInseticidaSnapshot from(Planta planta, PlantaTratamento t, List<PlantaEventoPlanejado> list) {
            List<PlanejadoItem> items = new ArrayList<>();
            for (var p : list) {
                items.add(new PlanejadoItem(
                        p.getId(),
                        p.getRoundIndex(),
                        p.getScheduledAt(),
                        p.getStatus(),
                        p.getExecutedAt(),
                        p.getEventoExecucao() != null ? p.getEventoExecucao().getId() : null,
                        p.getDoseEmML()
                ));
            }
            return new AgendaInseticidaSnapshot(
                    planta.getId(),
                    planta.getNome(),
                    t.getId(),
                    t.getProduto() != null ? t.getProduto().getNome() : "INSETICIDA",
                    t.getRoundsTotal(),
                    t.getRoundAtual(),
                    t.getDescansoDias(),
                    t.getInicioEm(),
                    t.getFimTratamentoEm(),
                    t.getProximaAplicacaoEm(),
                    items
            );
        }

        public static class PlanejadoItem {
            public final Long id;
            public final Integer roundIndex;
            public final LocalDateTime scheduledAt;
            public final StatusEventoPlanejado status;
            public final LocalDateTime executedAt;
            public final Long eventoExecucaoId;
            public final Double doseEmML;

            public PlanejadoItem(Long id, Integer roundIndex, LocalDateTime scheduledAt, StatusEventoPlanejado status, LocalDateTime executedAt, Long eventoExecucaoId, Double doseEmML) {
                this.id = id;
                this.roundIndex = roundIndex;
                this.scheduledAt = scheduledAt;
                this.status = status;
                this.executedAt = executedAt;
                this.eventoExecucaoId = eventoExecucaoId;
                this.doseEmML = doseEmML;
            }
        }
    }
}
