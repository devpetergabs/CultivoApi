package cultivo.api.api.controller.planta;

import cultivo.api.application.ai.DoctorChatService;
import cultivo.api.domain.usuario.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/plantas/{plantaId}/doctor/session")
public class DoctorPlantController {

    private final DoctorChatService doctorChatService;

    public DoctorPlantController(DoctorChatService doctorChatService) {
        this.doctorChatService = doctorChatService;
    }

    @PostMapping
    public ResponseEntity<?> criarOuReutilizar(
            @PathVariable Long plantaId,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(doctorChatService.criarOuReutilizarSessao(plantaId, usuario));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> detalhar(
            @PathVariable Long plantaId,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(doctorChatService.obterSessaoAtiva(plantaId, usuario));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/messages")
    public ResponseEntity<?> enviarMensagem(
            @PathVariable Long plantaId,
            @Valid @RequestBody DadosDoctorChatMensagemEnvio dados,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(doctorChatService.enviarMensagem(plantaId, dados.mensagem(), dados.modo(), usuario));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/reset")
    public ResponseEntity<?> reiniciarSessao(
            @PathVariable Long plantaId,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(doctorChatService.reiniciarSessao(plantaId, usuario));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}