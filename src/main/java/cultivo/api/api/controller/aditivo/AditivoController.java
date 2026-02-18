package cultivo.api.api.controller.aditivo;

import cultivo.api.application.aditivo.ClassificadorAditivoService;
import cultivo.api.domain.aditivo.ClasseAditivo;
import cultivo.api.domain.aditivo.Aditivo;
import cultivo.api.infrastructure.persistence.aditivo.AditivoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/aditivos")
public class AditivoController {

    @Autowired
    private AditivoRepository repository;

    @Autowired
    private ClassificadorAditivoService classificadorAditivoService;

    @PostMapping
    public ResponseEntity<Aditivo> cadastrar(@Valid @RequestBody DadosCadastroAditivo dados, UriComponentsBuilder uri) {
        ClasseAditivo classe = (dados.classe() != null)
            ? dados.classe()
            : classificadorAditivoService.inferirClasse(dados.nome(), dados.descricao());

        var aditivo = new Aditivo(dados.nome(), dados.marca(), dados.descricao(), dados.estagio(), classe, dados.dosePadraoEmML());
        repository.save(aditivo);
        var uriBuilder = uri.path("/aditivos/{id}").buildAndExpand(aditivo.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(aditivo);
    }

    @GetMapping
    public ResponseEntity<Page<Aditivo>> listar(Pageable paginacao) {
        var page = repository.findAll(paginacao);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Aditivo> detalhar(@PathVariable Long id) {
        var aditivo = repository.findById(id);
        return aditivo.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Aditivo> atualizar(@PathVariable Long id, @Valid @RequestBody DadosAtualizacaoAditivo dados) {
        var aditivo = repository.findById(id);
        if (aditivo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        var aditivoExistente = aditivo.get();
        if (dados.nome() != null) {
            aditivoExistente = new Aditivo(id, dados.nome(), 
                    dados.marca() != null ? dados.marca() : aditivoExistente.getMarca(),
                    dados.descricao() != null ? dados.descricao() : "",
                    dados.estagio() != null ? dados.estagio() : aditivoExistente.getEstagio(),
                    dados.classe() != null ? dados.classe() : aditivoExistente.getClasse(),
                    dados.dosePadraoEmML() != null ? dados.dosePadraoEmML() : aditivoExistente.getDosePadraoEmML(),
                    aditivoExistente.getAtivo());
            repository.save(aditivoExistente);
        }
        
        return ResponseEntity.ok(aditivoExistente);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        var aditivo = repository.findById(id);
        if (aditivo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        var aditivoExistente = aditivo.get();
        aditivoExistente.desativar();
        repository.save(aditivoExistente);
        
        return ResponseEntity.noContent().build();
    }
}
