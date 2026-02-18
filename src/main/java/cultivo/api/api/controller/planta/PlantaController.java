package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.planta.TamanhVaso;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaAditivoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import jakarta.validation.Valid;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.data.domain.Page;
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

    @Autowired
    private PlantaAditivoRepository plantaAditivoRepository;

    @PostMapping
    public ResponseEntity<DadosDetalhePlanta> cadastrar(@Valid @RequestBody DadosCadastroPlanta dados, UriComponentsBuilder uri) {
        var cultivador = cultivadorRepository.findById(dados.cultivadorId());
        if (cultivador.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var planta = new Planta(dados.nome(), dados.strain(), dados.dataGerminacao(), 
                dados.altura(), dados.largura(), dados.larguraCaule(), 
                TamanhVaso.valueOf(dados.tamanhoVaso()), dados.estagio(), cultivador.get());
        planta.atualizarDados(null, null, null, null, null, null, dados.sexo(), dados.dataSexagem(), dados.dataFloracao());
        repository.save(planta);

        var resposta = new DadosDetalhePlanta(planta.getId(), planta.getNome(), planta.getStrain(),
            planta.getAltura(), planta.getLargura(), planta.getLarguraCaule(),
            planta.getTamanhoVaso().toString(), planta.getEstagio() != null ? planta.getEstagio().toString() : null,
            planta.getSexo() != null ? planta.getSexo().toString() : null,
            planta.getDataSexagem(), planta.getDataFloracao(),
                planta.getAtivo(), planta.getDataGerminacao(), planta.getDataCriacao());
        var uriBuilder = uri.path("/plantas/{id}").buildAndExpand(planta.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @GetMapping
    public ResponseEntity<Page<DadosDetalhePlanta>> listar(Pageable paginacao) {
        var page = repository.findAll(paginacao)
            .map(p -> new DadosDetalhePlanta(p.getId(), p.getNome(), p.getStrain(),
                p.getAltura(), p.getLargura(), p.getLarguraCaule(),
                p.getTamanhoVaso().toString(), p.getEstagio() != null ? p.getEstagio().toString() : null,
                p.getSexo() != null ? p.getSexo().toString() : null,
                p.getDataSexagem(), p.getDataFloracao(),
                p.getAtivo(), p.getDataGerminacao(), p.getDataCriacao()));
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}/completa")
    public ResponseEntity<DadosDetalhePlantaCompleta> detalharCompleta(@PathVariable Long id) {
        var planta = repository.findById(id);
        if (planta.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var p = planta.get();
        var cultivador = p.getCultivador();
        var usuario = cultivador.getUsuario();

        var aditivos = plantaAditivoRepository.findByPlantaId(id, Pageable.unpaged())
                .map(pa -> new DadosDetalhePlantaAditivo(pa.getId(), pa.getPlanta().getNome(),
                        pa.getAditivo().getNome(), pa.getAditivo().getMarca(), 
                        pa.getAditivo().getDescricao(), pa.getAditivo().getEstagio().toString(), pa.getDoseEmML()))
                .getContent();

        var resposta = new DadosDetalhePlantaCompleta(
                p.getId(),
                p.getNome(),
                p.getStrain(),
                p.getAltura(),
                p.getLargura(),
                p.getLarguraCaule(),
                p.getTamanhoVaso().toString(),
                p.getEstagio() != null ? p.getEstagio().toString() : null,
                p.getSexo() != null ? p.getSexo().toString() : null,
                p.getDataSexagem(),
                p.getDataFloracao(),
                p.getAtivo(),
                p.getDataGerminacao(),
                p.getDataCriacao(),
                cultivador.getId(),
                usuario.getNome(),
                usuario.getLogin(),
                cultivador.getTelefone(),
                cultivador.getAtivo(),
                aditivos
        );

        return ResponseEntity.ok(resposta);
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
            p.getTamanhoVaso().toString(), p.getEstagio() != null ? p.getEstagio().toString() : null,
            p.getSexo() != null ? p.getSexo().toString() : null,
            p.getDataSexagem(), p.getDataFloracao(),
            p.getAtivo(), p.getDataGerminacao(), p.getDataCriacao());
        return ResponseEntity.ok(resposta);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DadosDetalhePlanta> atualizar(@PathVariable Long id, @Valid @RequestBody DadosAtualizacaoPlanta dados) {
        var planta = repository.findById(id);
        if (planta.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var p = planta.get();
        p.atualizarDados(dados.nome(), dados.altura(), dados.largura(), dados.larguraCaule(),
                dados.tamanhoVaso() != null ? TamanhVaso.valueOf(dados.tamanhoVaso()) : null, dados.estagio(),
                dados.sexo(), dados.dataSexagem(), dados.dataFloracao());
        repository.save(p);

        var resposta = new DadosDetalhePlanta(p.getId(), p.getNome(), p.getStrain(),
            p.getAltura(), p.getLargura(), p.getLarguraCaule(),
            p.getTamanhoVaso().toString(), p.getEstagio() != null ? p.getEstagio().toString() : null,
            p.getSexo() != null ? p.getSexo().toString() : null,
            p.getDataSexagem(), p.getDataFloracao(),
            p.getAtivo(), p.getDataGerminacao(), p.getDataCriacao());
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
                p.getTamanhoVaso().toString(), p.getEstagio() != null ? p.getEstagio().toString() : null,
                p.getSexo() != null ? p.getSexo().toString() : null,
                p.getDataSexagem(), p.getDataFloracao(),
                p.getAtivo(), p.getDataGerminacao(), p.getDataCriacao()));
        return ResponseEntity.ok(page);
    }
}
