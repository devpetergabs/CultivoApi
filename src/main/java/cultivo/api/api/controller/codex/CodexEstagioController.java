package cultivo.api.api.controller.codex;

import cultivo.api.application.planta.CodexEstagioService;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import cultivo.api.infrastructure.security.AccessControl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class CodexEstagioController {

    @Autowired
    private CodexEstagioService codexEstagioService;

    @Autowired
    private PlantaRepository plantaRepository;

    @GetMapping("/codex/estagios")
    public ResponseEntity<?> listarCatalogo(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(codexEstagioService.listarCatalogo());
    }

    @GetMapping("/codex/estagios/{estagio}")
    public ResponseEntity<?> detalharEstagio(@AuthenticationPrincipal Usuario usuario, @PathVariable cultivo.api.domain.planta.EstagioPlanta estagio) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(codexEstagioService.detalharEstagio(estagio));
    }

    @GetMapping("/plantas/{plantaId}/codex/estagios")
    public ResponseEntity<?> listarCodexDaPlanta(@PathVariable Long plantaId, @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty()) return ResponseEntity.notFound().build();
        var planta = plantaOpt.get();

        if (!AccessControl.canReadPlanta(usuario, planta)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok(codexEstagioService.listarCatalogoDaPlanta(planta));
    }

    @GetMapping("/plantas/{plantaId}/codex/estagio-atual")
    public ResponseEntity<?> obterEstagioAtualDaPlanta(@PathVariable Long plantaId, @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty()) return ResponseEntity.notFound().build();
        var planta = plantaOpt.get();

        if (!AccessControl.canReadPlanta(usuario, planta)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok(codexEstagioService.obterEstagioAtualDaPlanta(planta));
    }
}
