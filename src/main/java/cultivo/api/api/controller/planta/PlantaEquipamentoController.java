package cultivo.api.api.controller.planta;

import cultivo.api.application.planta.PlantaEquipamentoService;
import cultivo.api.domain.planta.PlantaEquipamento;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.security.AccessControl;
import cultivo.api.infrastructure.persistence.planta.PlantaEquipamentoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/plantas/{plantaId}/equipamentos")
public class PlantaEquipamentoController {

    @Autowired
    private PlantaEquipamentoService equipamentoService;

    @Autowired
    private PlantaEquipamentoRepository equipamentoRepository;

    @Autowired
    private PlantaRepository plantaRepository;

    @GetMapping
    public ResponseEntity<?> listar(
            @PathVariable Long plantaId,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canReadPlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var list = equipamentoRepository.findAllByPlantaId(plantaId)
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(list);
    }

    @PutMapping("/pote")
    public ResponseEntity<?> equiparPote(
            @PathVariable Long plantaId,
            @Valid @RequestBody DadosEquiparPote dados,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canWritePlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        PlantaEquipamento eq = equipamentoService.equiparPote(
                plantaId,
                dados.produtoId(),
                dados.corHex(),
                dados.skinId(),
                dados.apelido()
        );
        return ResponseEntity.ok(toDto(eq));
    }

    private DadosDetalheEquipamento toDto(PlantaEquipamento eq) {
        var produto = eq.getProduto();
        return new DadosDetalheEquipamento(
                eq.getId(),
                eq.getSlot() != null ? eq.getSlot().name() : null,
                produto != null ? produto.getId() : null,
                produto != null ? produto.getNome() : null,
                produto != null && produto.getTipo() != null ? produto.getTipo().name() : null,
                produto != null ? produto.getCapacidadeLitros() : null,
                eq.getCorHex(),
                eq.getSkinId(),
                eq.getApelido(),
                eq.getEquipadoEm()
        );
    }
}
