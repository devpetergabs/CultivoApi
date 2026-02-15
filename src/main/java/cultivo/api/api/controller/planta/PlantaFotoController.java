package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.PlantaFoto;
import cultivo.api.infrastructure.persistence.planta.PlantaFotoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Base64;

@RestController
@RequestMapping("/plantas/{plantaId}/fotos")
public class PlantaFotoController {

    @Autowired
    private PlantaFotoRepository repository;

    @Autowired
    private PlantaRepository plantaRepository;

    @PostMapping
    public ResponseEntity<DadosDetalhePlantaFoto> cadastrar(@PathVariable Long plantaId,
                                                             @Valid @RequestBody DadosCadastroPlantaFoto dados,
                                                             UriComponentsBuilder uri) {
        var planta = plantaRepository.findById(plantaId);
        if (planta.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var imagemBytes = Base64.getDecoder().decode(dados.imagemBase64());
        var foto = new PlantaFoto(planta.get(), imagemBytes, dados.contentType(), dados.descricao());
        repository.save(foto);

        var resposta = new DadosDetalhePlantaFoto(foto.getId(), foto.getPlanta().getNome(),
                foto.getContentType(), foto.getDescricao(), foto.getDataUpload());
        var uriBuilder = uri.path("/plantas/{plantaId}/fotos/{id}").buildAndExpand(plantaId, foto.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @GetMapping
    public ResponseEntity<Page<DadosDetalhePlantaFoto>> listar(@PathVariable Long plantaId, Pageable paginacao) {
        var page = repository.findByPlantaId(plantaId, paginacao)
                .map(f -> new DadosDetalhePlantaFoto(f.getId(), f.getPlanta().getNome(),
                        f.getContentType(), f.getDescricao(), f.getDataUpload()));
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DadosDetalhePlantaFoto> detalhar(@PathVariable Long plantaId, @PathVariable Long id) {
        var foto = repository.findById(id);
        if (foto.isEmpty() || !foto.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        var f = foto.get();
        var resposta = new DadosDetalhePlantaFoto(f.getId(), f.getPlanta().getNome(),
                f.getContentType(), f.getDescricao(), f.getDataUpload());
        return ResponseEntity.ok(resposta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long plantaId, @PathVariable Long id) {
        var foto = repository.findById(id);
        if (foto.isEmpty() || !foto.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
