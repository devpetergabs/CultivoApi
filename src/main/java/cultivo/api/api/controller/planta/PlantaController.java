package cultivo.api.api.controller.planta;

import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.planta.TamanhVaso;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.exception.ErrorResponse;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaAditivoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
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

        @PostMapping("/me")
        public ResponseEntity<?> cadastrarMe(@Valid @RequestBody DadosCadastroPlantaMe dados,
                         @AuthenticationPrincipal Usuario usuario,
                         UriComponentsBuilder uri) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var cultivador = cultivadorRepository.findByUsuarioId(usuario.getId());
        if (cultivador == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                new ErrorResponse(
                    HttpStatus.CONFLICT.value(),
                    "Usuário autenticado não possui cultivador cadastrado.",
                    LocalDateTime.now(),
                    null
                )
            );
        }

        var planta = new Planta(dados.nome(), dados.strain(), dados.dataGerminacao(),
            dados.altura(), dados.largura(), dados.larguraCaule(),
            TamanhVaso.valueOf(dados.tamanhoVaso()), dados.estagio(), cultivador);
        planta.atualizarDados(null, null, null, null, null, null, null, null, dados.sexo(), dados.dataSexagem(), dados.dataFloracao());
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

    @PostMapping
    public ResponseEntity<DadosDetalhePlanta> cadastrar(@Valid @RequestBody DadosCadastroPlanta dados, UriComponentsBuilder uri) {
        var cultivador = cultivadorRepository.findById(dados.cultivadorId());
        if (cultivador.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var planta = new Planta(dados.nome(), dados.strain(), dados.dataGerminacao(), 
                dados.altura(), dados.largura(), dados.larguraCaule(), 
                TamanhVaso.valueOf(dados.tamanhoVaso()), dados.estagio(), cultivador.get());
        planta.atualizarDados(null, null, null, null, null, null, null, null, dados.sexo(), dados.dataSexagem(), dados.dataFloracao());
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
        var page = repository.findByAtivoTrue(paginacao)
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
                pa.getAditivo().getDescricao(), pa.getAditivo().getEstagio().toString(), pa.getDoseEmML(), pa.getAditivo().getClasse()))
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
        p.atualizarDados(dados.nome(), dados.strain(), dados.dataGerminacao(), dados.altura(), dados.largura(), dados.larguraCaule(),
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

    @Autowired
    private cultivo.api.infrastructure.persistence.planta.PlantaEventoRepository plantaEventoRepository;

    @PatchMapping("/{id}/crescer")
    public ResponseEntity<?> crescer(@PathVariable Long id, @RequestBody DadosCrescimentoPlanta dados) {
        var plantaOpt = repository.findById(id);
        if (plantaOpt.isEmpty()) return ResponseEntity.notFound().build();

        System.out.println("PATCH crescer - dados recebidos: altura=" + dados.altura() + ", largura=" + dados.largura() + ", larguraCaule=" + dados.larguraCaule() + ", descricao=" + dados.descricao() + ", obs=" + dados.obs());

        var planta = plantaOpt.get();

        // Atualiza diretamente as métricas de crescimento
        planta.setAltura(dados.altura());
        planta.setLargura(dados.largura());
        planta.setLarguraCaule(dados.larguraCaule());

        // Gamificação: subir nível
        planta.subirNivel();

        // Evento de evolução
        var eventoEvolucao = new cultivo.api.domain.planta.PlantaEvento(
            planta,
            cultivo.api.domain.planta.TipoEvento.EVOLUCAO,
            "Planta evoluiu para o nível " + planta.getLevel(),
            null
        );
        plantaEventoRepository.save(eventoEvolucao);

        repository.save(planta);

        // Evento de crescimento
        var eventoDescricao = dados.descricao() != null ? dados.descricao() : dados.obs();
        var evento = new cultivo.api.domain.planta.PlantaEvento(
            planta,
            cultivo.api.domain.planta.TipoEvento.CRESCIMENTO,
            eventoDescricao + " : " + dados.altura() + "cm, " + dados.largura() + "cm, " + dados.larguraCaule() + "cm",
            null
        );
        plantaEventoRepository.save(evento);

        return ResponseEntity.ok().build();
    }
}
