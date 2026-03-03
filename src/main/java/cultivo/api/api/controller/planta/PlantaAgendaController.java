package cultivo.api.api.controller.planta;

import cultivo.api.application.planta.PlantaAgendaService;
import cultivo.api.domain.usuario.Usuario;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/plantas/{plantaId}/agenda")
public class PlantaAgendaController {

    @Autowired
    private PlantaAgendaService agendaService;

    @GetMapping("/inseticida")
    public ResponseEntity<DadosAgendaInseticida> getAgendaInseticida(
            @PathVariable Long plantaId,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        PlantaAgendaService.AgendaInseticidaSnapshot snapshot;
        try {
            snapshot = agendaService.getAgendaInseticida(plantaId, usuario);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }

        if (snapshot == null) {
            return ResponseEntity.ok(null);
        }

        List<DadosAgendaPlanejado> planejados = snapshot.planejados.stream()
                .map(p -> new DadosAgendaPlanejado(
                        p.id,
                        p.roundIndex,
                        p.scheduledAt,
                        p.status != null ? p.status.name() : null,
                        p.executedAt,
                        p.eventoExecucaoId,
                        p.doseEmML
                ))
                .toList();

        var dto = new DadosAgendaInseticida(
                snapshot.plantaId,
                snapshot.plantaNome,
                snapshot.tratamentoId,
                snapshot.produtoNome,
                snapshot.roundsTotal,
                snapshot.roundAtual,
                snapshot.descansoDias,
                snapshot.inicioEm,
                snapshot.fimTratamentoEm,
                snapshot.proximaAplicacaoEm,
                planejados
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/inseticida/ics")
    public ResponseEntity<byte[]> downloadIcsInseticida(
            @PathVariable Long plantaId,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletResponse response
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        PlantaAgendaService.AgendaInseticidaSnapshot snapshot;
        try {
            snapshot = agendaService.getAgendaInseticida(plantaId, usuario);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
        if (snapshot == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] ics;
        try {
            ics = agendaService.gerarIcsAgendaInseticida(plantaId, usuario);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        String filename = "cultivo-" + safeFilename(snapshot.plantaNome) + "-" + safeFilename(snapshot.produtoNome) + ".ics";
        String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                .contentType(MediaType.parseMediaType("text/calendar; charset=utf-8"))
                .body(ics);
    }

    @PostMapping("/inseticida/planejados/{planejadoId}/done")
    public ResponseEntity<DadosDetalheEvento> marcarDone(
            @PathVariable Long plantaId,
            @PathVariable Long planejadoId,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            var evento = agendaService.marcarPlanejadoDone(plantaId, planejadoId, usuario);
            if (evento == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            var dto = new DadosDetalheEvento(
                    evento.getId(),
                    evento.getPlanta().getNome(),
                    evento.getTipo().toString(),
                    evento.getDataEvento(),
                    evento.getDescricao(),
                    evento.getDoseEmML(),
                    evento.getProduto() != null ? evento.getProduto().getId() : null,
                    evento.getTratamento() != null ? evento.getTratamento().getId() : null,
                    evento.getRoundAtual(),
                    evento.getRoundsTotal(),
                    evento.getDescansoDias(),
                    evento.getProximaAplicacaoEm(),
                    evento.getFimTratamentoEm()
            );
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String safeFilename(String s) {
        if (s == null) return "planta";
        return s.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "")
                .trim();
    }
}
