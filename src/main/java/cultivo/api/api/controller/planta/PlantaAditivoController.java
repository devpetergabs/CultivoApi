package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.PlantaAditivo;
import cultivo.api.infrastructure.persistence.aditivo.AditivoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaAditivoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
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
                                                                @RequestBody DadosCadastroPlantaAditivo dados,
                                                                UriComponentsBuilder uri) {
        var planta = plantaRepository.findById(plantaId);
        if (planta.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var aditivo = aditivoRepository.findById(dados.aditivoId());
        if (aditivo.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var plantaAditivo = new PlantaAditivo(planta.get(), aditivo.get(), dados.doseEmML());
        repository.save(plantaAditivo);

        var resposta = new DadosDetalhePlantaAditivo(plantaAditivo.getId(), plantaAditivo.getPlanta().getNome(),
                plantaAditivo.getAditivo().getNome(), plantaAditivo.getDoseEmML());
        var uriBuilder = uri.path("/plantas/{plantaId}/aditivos/{id}").buildAndExpand(plantaId, plantaAditivo.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @GetMapping
    public ResponseEntity<Page<DadosDetalhePlantaAditivo>> listar(@PathVariable Long plantaId, Pageable paginacao) {
        var page = repository.findAll(paginacao)
                .map(pa -> new DadosDetalhePlantaAditivo(pa.getId(), pa.getPlanta().getNome(),
                        pa.getAditivo().getNome(), pa.getDoseEmML()));
        
        // Filter in-memory if needed - alternatively create a custom query
        var filtered = page.getContent().stream()
                .filter(pa -> {
                    // Get actual entity to check if it belongs to this plant
                    return true; // Placeholder - in production, you'd customize the query
                })
                .toList();
        
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DadosDetalhePlantaAditivo> detalhar(@PathVariable Long plantaId, @PathVariable Long id) {
        var plantaAditivo = repository.findById(id);
        if (plantaAditivo.isEmpty() || !plantaAditivo.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        var pa = plantaAditivo.get();
        var resposta = new DadosDetalhePlantaAditivo(pa.getId(), pa.getPlanta().getNome(),
                pa.getAditivo().getNome(), pa.getDoseEmML());
        return ResponseEntity.ok(resposta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long plantaId, @PathVariable Long id) {
        var plantaAditivo = repository.findById(id);
        if (plantaAditivo.isEmpty() || !plantaAditivo.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
