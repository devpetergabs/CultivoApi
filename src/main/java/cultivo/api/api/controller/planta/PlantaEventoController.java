package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.PlantaEvento;
import cultivo.api.domain.planta.TipoEvento;
import cultivo.api.infrastructure.persistence.planta.PlantaEventoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/plantas/{plantaId}/eventos")
public class PlantaEventoController {

    @Autowired
    private PlantaEventoRepository repository;

    @Autowired
    private PlantaRepository plantaRepository;

    @PostMapping
    public ResponseEntity<DadosDetalheEvento> cadastrar(@PathVariable Long plantaId,
                                                         @RequestBody DadosCadastroEvento dados,
                                                         UriComponentsBuilder uri) {
        var planta = plantaRepository.findById(plantaId);
        if (planta.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var evento = new PlantaEvento(planta.get(), TipoEvento.valueOf(dados.tipo()),
                dados.descricao(), dados.doseEmML());
        repository.save(evento);

        var resposta = new DadosDetalheEvento(evento.getId(), evento.getPlanta().getNome(),
                evento.getTipo().toString(), evento.getDataEvento(), evento.getDescricao(), evento.getDoseEmML());
        var uriBuilder = uri.path("/plantas/{plantaId}/eventos/{id}").buildAndExpand(plantaId, evento.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @GetMapping
    public ResponseEntity<Page<DadosDetalheEvento>> listar(@PathVariable Long plantaId, Pageable paginacao) {
        var page = repository.findByPlantaIdOrderByDataEventoDesc(plantaId, paginacao)
                .map(e -> new DadosDetalheEvento(e.getId(), e.getPlanta().getNome(),
                        e.getTipo().toString(), e.getDataEvento(), e.getDescricao(), e.getDoseEmML()));
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DadosDetalheEvento> detalhar(@PathVariable Long plantaId, @PathVariable Long id) {
        var evento = repository.findById(id);
        if (evento.isEmpty() || !evento.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        var e = evento.get();
        var resposta = new DadosDetalheEvento(e.getId(), e.getPlanta().getNome(),
                e.getTipo().toString(), e.getDataEvento(), e.getDescricao(), e.getDoseEmML());
        return ResponseEntity.ok(resposta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long plantaId, @PathVariable Long id) {
        var evento = repository.findById(id);
        if (evento.isEmpty() || !evento.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
