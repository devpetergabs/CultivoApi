package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.PlantaAditivo;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.security.AccessControl;
import cultivo.api.infrastructure.persistence.aditivo.AditivoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaAditivoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/plantas/{plantaId}/aditivos")
public class PlantaAditivoController {

    @Autowired
    private PlantaAditivoRepository repository;

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private AditivoRepository aditivoRepository;

    @PostMapping
    public ResponseEntity<DadosDetalhePlantaAditivo> cadastrar(@PathVariable Long plantaId, 
                                                                @Valid @RequestBody DadosCadastroPlantaAditivo dados,
                                                                @AuthenticationPrincipal Usuario usuario,
                                                                UriComponentsBuilder uri) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var planta = plantaRepository.findById(plantaId);
        if (planta.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (!AccessControl.canWritePlanta(usuario, planta.get())) {
            return ResponseEntity.notFound().build();
        }

        var aditivo = aditivoRepository.findById(dados.aditivoId());
        if (aditivo.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var plantaAditivo = new PlantaAditivo(planta.get(), aditivo.get(), dados.doseEmML());
        repository.save(plantaAditivo);

        var resposta = new DadosDetalhePlantaAditivo(plantaAditivo.getId(), plantaAditivo.getPlanta().getNome(),
                plantaAditivo.getAditivo().getNome(), plantaAditivo.getAditivo().getMarca(),
            plantaAditivo.getAditivo().getDescricao(), plantaAditivo.getAditivo().getEstagio().toString(), plantaAditivo.getDoseEmML(), plantaAditivo.getAditivo().getClasse());
        var uriBuilder = uri.path("/plantas/{plantaId}/aditivos/{id}").buildAndExpand(plantaId, plantaAditivo.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @PathVariable Long plantaId,
            @AuthenticationPrincipal Usuario usuario,
            Pageable paginacao
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canReadPlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var page = repository.findByPlantaId(plantaId, paginacao)
            .map(pa -> new DadosDetalhePlantaAditivo(pa.getId(), pa.getPlanta().getNome(),
                pa.getAditivo().getNome(), pa.getAditivo().getMarca(),
                pa.getAditivo().getDescricao(), pa.getAditivo().getEstagio().toString(), pa.getDoseEmML(), pa.getAditivo().getClasse()));
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detalhar(
            @PathVariable Long plantaId,
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canReadPlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var plantaAditivo = repository.findById(id);
        if (plantaAditivo.isEmpty() || !plantaAditivo.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        var pa = plantaAditivo.get();
        var resposta = new DadosDetalhePlantaAditivo(pa.getId(), pa.getPlanta().getNome(),
                pa.getAditivo().getNome(), pa.getAditivo().getMarca(),
            pa.getAditivo().getDescricao(), pa.getAditivo().getEstagio().toString(), pa.getDoseEmML(), pa.getAditivo().getClasse());
        return ResponseEntity.ok(resposta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long plantaId,
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canWritePlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var plantaAditivo = repository.findById(id);
        if (plantaAditivo.isEmpty() || !plantaAditivo.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
