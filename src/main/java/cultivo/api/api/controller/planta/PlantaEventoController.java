package cultivo.api.api.controller.planta;

import cultivo.api.application.planta.PlantaEventoService;
import cultivo.api.domain.planta.PlantaEvento;
import cultivo.api.domain.planta.TipoEvento;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.security.AccessControl;
import cultivo.api.infrastructure.persistence.planta.PlantaEventoRepository;
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
@RequestMapping("/plantas/{plantaId}/eventos")
public class PlantaEventoController {

    @Autowired
    private PlantaEventoRepository repository;

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private PlantaEventoService eventoService;

    @PostMapping
    public ResponseEntity<DadosDetalheEvento> cadastrar(
            @PathVariable Long plantaId,
            @Valid @RequestBody DadosCadastroEvento dados,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal Usuario usuario,
            UriComponentsBuilder uri
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!AccessControl.canWritePlanta(usuario, plantaOpt.get())) {
            // ADMIN não pode interagir com plantas de terceiros.
            return ResponseEntity.notFound().build();
        }

        PlantaEvento evento;
        try {
            evento = eventoService.criarEvento(plantaId, dados, idempotencyKey, usuario);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }

        var resposta = new DadosDetalheEvento(
                evento.getId(),
                evento.getPlanta().getNome(),
                evento.getTipo().toString(),
                evento.getDataEvento(),
                evento.getDescricao(),
                evento.getDoseEmML(),
                evento.getProduto() != null ? evento.getProduto().getId() : null,
                evento.getTratamento() != null ? evento.getTratamento().getId() : null,
                evento.getRoundAtual(),
                evento.getRoundsTotal(),
                evento.getDescansoDias(),
                evento.getProximaAplicacaoEm(),
                evento.getFimTratamentoEm()
        );

        var uriBuilder = uri.path("/plantas/{plantaId}/eventos/{id}")
                .buildAndExpand(plantaId, evento.getId())
                .toUri();

        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @GetMapping
    public ResponseEntity<Page<DadosDetalheEvento>> listar(
            @PathVariable Long plantaId,
            @AuthenticationPrincipal Usuario usuario,
            Pageable paginacao
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!AccessControl.canReadPlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var page = repository.findByPlantaIdAndDeletedAtIsNullOrderByDataEventoDesc(plantaId, paginacao)
                .map(e -> new DadosDetalheEvento(
                        e.getId(),
                        e.getPlanta().getNome(),
                        e.getTipo().toString(),
                        e.getDataEvento(),
                        e.getDescricao(),
                        e.getDoseEmML(),
                        e.getProduto() != null ? e.getProduto().getId() : null,
                        e.getTratamento() != null ? e.getTratamento().getId() : null,
                        e.getRoundAtual(),
                        e.getRoundsTotal(),
                        e.getDescansoDias(),
                        e.getProximaAplicacaoEm(),
                        e.getFimTratamentoEm()
                ));
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DadosDetalheEvento> detalhar(
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

        var evento = repository.findById(id);
        if (evento.isEmpty()
                || !evento.get().getPlanta().getId().equals(plantaId)
                || evento.get().isDeleted()) {
            return ResponseEntity.notFound().build();
        }

        var e = evento.get();
        var resposta = new DadosDetalheEvento(
                e.getId(),
                e.getPlanta().getNome(),
                e.getTipo().toString(),
                e.getDataEvento(),
                e.getDescricao(),
                e.getDoseEmML(),
                e.getProduto() != null ? e.getProduto().getId() : null,
                e.getTratamento() != null ? e.getTratamento().getId() : null,
                e.getRoundAtual(),
                e.getRoundsTotal(),
                e.getDescansoDias(),
                e.getProximaAplicacaoEm(),
                e.getFimTratamentoEm()
        );
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

        var evento = repository.findById(id);
        if (evento.isEmpty()
                || !evento.get().getPlanta().getId().equals(plantaId)
                || evento.get().isDeleted()) {
            return ResponseEntity.notFound().build();
        }

        var e = evento.get();
        e.softDelete("User removed");
        repository.save(e);

        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH de verdade (padronizado):
     * - permite editar descricao e/ou doseEmML para QUALQUER tipo de evento
     * - validações leves para não quebrar a "visão de estado"
     */
    @PatchMapping("/{id}")
    public ResponseEntity<DadosDetalheEvento> atualizar(
            @PathVariable Long plantaId,
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody DadosAtualizacaoEvento dados
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canWritePlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var evento = repository.findById(id);
        if (evento.isEmpty()
                || !evento.get().getPlanta().getId().equals(plantaId)
                || evento.get().isDeleted()) {
            return ResponseEntity.notFound().build();
        }

        if (dados == null) {
            return ResponseEntity.badRequest().build();
        }

        var e = evento.get();

        var hasDescricao = dados.descricao() != null;
        var hasDose = dados.doseEmML() != null;

        if (!hasDescricao && !hasDose) {
            return ResponseEntity.badRequest().build();
        }

        // Validação básica: dose não pode ser negativa
        if (hasDose && dados.doseEmML() < 0) {
            return ResponseEntity.badRequest().build();
        }

        // Aplica updates parciais
        if (hasDescricao) {
            e.updateDescricao(dados.descricao());
        }
        if (hasDose) {
            e.updateDoseEmML(dados.doseEmML());
        }

        // Validação de coerência pra REGA/MODELO: dose/volume precisa ser > 0
        if (isWaterLike(e.getTipo())) {
            if (e.getDoseEmML() == null || e.getDoseEmML() <= 0) {
                return ResponseEntity.badRequest().build();
            }
        }

        repository.save(e);

        var resposta = new DadosDetalheEvento(
                e.getId(),
                e.getPlanta().getNome(),
                e.getTipo().toString(),
                e.getDataEvento(),
                e.getDescricao(),
                e.getDoseEmML(),
                e.getProduto() != null ? e.getProduto().getId() : null,
                e.getTratamento() != null ? e.getTratamento().getId() : null,
                e.getRoundAtual(),
                e.getRoundsTotal(),
                e.getDescansoDias(),
                e.getProximaAplicacaoEm(),
                e.getFimTratamentoEm()
        );

        return ResponseEntity.ok(resposta);
    }

    private boolean isWaterLike(TipoEvento tipo) {
        return tipo == TipoEvento.REGA_NORMAL
                || tipo == TipoEvento.REGA_ADITIVADA
                || tipo == TipoEvento.MODELO_NORMAL
                || tipo == TipoEvento.MODELO_ADITIVADO;
    }
}
