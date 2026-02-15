package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.planta.TamanhVaso;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;

@RestController
@RequestMapping("/plantas")
public class PlantaController {

    @Autowired
    private PlantaRepository repository;

    @Autowired
    private CultivadorRepository cultivadorRepository;

    @PostMapping
    public ResponseEntity<DadosDetalhePlanta> cadastrar(@RequestBody DadosCadastroPlanta dados, UriComponentsBuilder uri) {
        var cultivador = cultivadorRepository.findById(dados.cultivadorId());
        if (cultivador.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var planta = new Planta(dados.nome(), dados.strain(), dados.dataGerminacao(), 
                dados.altura(), dados.largura(), dados.larguraCaule(), 
                TamanhVaso.valueOf(dados.tamanhoVaso()), cultivador.get());
        repository.save(planta);

        var resposta = new DadosDetalhePlanta(planta.getId(), planta.getNome(), planta.getStrain(),
                planta.getAltura(), planta.getLargura(), planta.getLarguraCaule(),
                planta.getTamanhoVaso().toString(), planta.getAtivo(), planta.getDataGerminacao(), planta.getDataCriacao());
        var uriBuilder = uri.path("/plantas/{id}").buildAndExpand(planta.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @GetMapping
    public ResponseEntity<Page<DadosDetalhePlanta>> listar(Pageable paginacao) {
        var page = repository.findAll(paginacao)
                .map(p -> new DadosDetalhePlanta(p.getId(), p.getNome(), p.getStrain(),
                        p.getAltura(), p.getLargura(), p.getLarguraCaule(),
                        p.getTamanhoVaso().toString(), p.getAtivo(), p.getDataGerminacao(), p.getDataCriacao()));
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DadosDetalhePlanta> detalhar(@PathVariable Long id) {
        var planta = repository.findById(id);
        if (planta.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var p = planta.get();
        var resposta = new DadosDetalhePlanta(p.getId(), p.getNome(), p.getStrain(),
                p.getAltura(), p.getLargura(), p.getLarguraCaule(),
                p.getTamanhoVaso().toString(), p.getAtivo(), p.getDataGerminacao(), p.getDataCriacao());
        return ResponseEntity.ok(resposta);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DadosDetalhePlanta> atualizar(@PathVariable Long id, @RequestBody DadosAtualizacaoPlanta dados) {
        var planta = repository.findById(id);
        if (planta.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var p = planta.get();
        p.atualizarDados(dados.nome(), dados.altura(), dados.largura(), dados.larguraCaule(),
                dados.tamanhoVaso() != null ? TamanhVaso.valueOf(dados.tamanhoVaso()) : null);
        repository.save(p);

        var resposta = new DadosDetalhePlanta(p.getId(), p.getNome(), p.getStrain(),
                p.getAltura(), p.getLargura(), p.getLarguraCaule(),
                p.getTamanhoVaso().toString(), p.getAtivo(), p.getDataGerminacao(), p.getDataCriacao());
        return ResponseEntity.ok(resposta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        var planta = repository.findById(id);
        if (planta.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var p = planta.get();
        p.desativar();
        repository.save(p);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cultivador/{cultivadorId}")
    public ResponseEntity<Page<DadosDetalhePlanta>> listarPorCultivador(@PathVariable Long cultivadorId, Pageable paginacao) {
        var page = repository.findByCultivadorIdAndAtivoTrue(cultivadorId, paginacao)
                .map(p -> new DadosDetalhePlanta(p.getId(), p.getNome(), p.getStrain(),
                        p.getAltura(), p.getLargura(), p.getLarguraCaule(),
                        p.getTamanhoVaso().toString(), p.getAtivo(), p.getDataGerminacao(), p.getDataCriacao()));
        return ResponseEntity.ok(page);
    }
}
