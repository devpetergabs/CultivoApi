package cultivo.api.api.controller.aditivo;

import cultivo.api.application.aditivo.ClassificadorAditivoService;
import cultivo.api.application.estoque.ProdutoEstoqueService;
import cultivo.api.domain.aditivo.ClasseAditivo;
import cultivo.api.domain.aditivo.Aditivo;
import cultivo.api.domain.aditivo.TipoProduto;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.domain.estoque.ProdutoEstoque;
import cultivo.api.infrastructure.persistence.aditivo.AditivoRepository;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/aditivos")
public class AditivoController {

    @Autowired
    private AditivoRepository repository;

    @Autowired
    private ClassificadorAditivoService classificadorAditivoService;

    @Autowired
    private CultivadorRepository cultivadorRepository;

    @Autowired
    private ProdutoEstoqueService estoqueService;

    private DadosEstoqueProduto toEstoqueDto(ProdutoEstoque e) {
        if (e == null) return null;
        // Defesa dupla: garante que o JSON nunca venha com null em campos numéricos.
        Double stock = e.getStockMlAtual() != null ? e.getStockMlAtual() : 0.0;
        Integer unidades = e.getUnidades() != null ? e.getUnidades() : 0;
        Integer mlFrasco = e.getMlFrasco() != null ? e.getMlFrasco() : 0;
        String tipo = (e.getTipoProduto() != null) ? e.getTipoProduto().toString() : null;
        return new DadosEstoqueProduto(true, tipo, stock, unidades, mlFrasco);
    }

    @PostMapping
    public ResponseEntity<Aditivo> cadastrar(@Valid @RequestBody DadosCadastroAditivo dados, UriComponentsBuilder uri) {
        ClasseAditivo classe = (dados.classe() != null)
            ? dados.classe()
            : classificadorAditivoService.inferirClasse(dados.nome(), dados.descricao());

        var aditivo = new Aditivo(dados.nome(), dados.marca(), dados.descricao(), dados.estagio(), classe, dados.dosePadraoEmML());
        aditivo.atualizarDados(
            null,
            null,
            null,
            dados.descricaoTecnica(),
            null,
            dados.estagiosMacro(),
            dados.estagiosLista(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        );
        repository.save(aditivo);
        var uriBuilder = uri.path("/aditivos/{id}").buildAndExpand(aditivo.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(aditivo);
    }

    /**
     * Catálogo do jogo (com estoque por cultivador).
     *
     * Observação: continua em /aditivos por compatibilidade com o front.
     */
    @GetMapping
    public ResponseEntity<?> listar(
            @AuthenticationPrincipal Usuario usuario,
            Pageable paginacao
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var cultivador = cultivadorRepository.findByUsuarioId(usuario.getId());
        if (cultivador == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        var page = repository.findAll(paginacao);
        var ids = page.getContent().stream().map(Aditivo::getId).toList();
        var estoqueMap = estoqueService.mapByProdutoId(cultivador.getId(), ids);

        List<DadosAditivoCatalogo> content = page.getContent().stream().map(a -> {
            var estoque = estoqueMap.get(a.getId());

            // IMPORTANT (MVP):
            // - Se NÃO existe registro em `cultivador_produtos_estoque`, retornamos `estoque = null`.
            //   Isso evita o front tratar um "não rastreado" como um estoque 0 e sobrescrever
            //   o cache local (localStorage) com `tracked=false` em listas antigas.
            // - Se existir registro, retornamos os valores reais e `tracked=true`.
            DadosEstoqueProduto estoqueDto = toEstoqueDto(estoque);

            return new DadosAditivoCatalogo(
                    a.getId(),
                    a.getNome(),
                    a.getMarca(),
                    a.getDescricao(),
                    a.getDescricaoTecnica(),
                    a.getEstagio(),
                    a.getEstagiosMacro(),
                    a.getEstagiosLista(),
                    a.getClasse(),
                    a.getDosePadraoEmML(),
                    a.getAtivo(),
                    a.getTipo() != null ? a.getTipo().toString() : null,
                    a.getCapacidadeLitros(),
                    a.getRoundsRecomendados(),
                    a.getDescansoDiasRecomendados(),
                    a.getDoseMinEmML(),
                    a.getDoseMaxEmML(),
                    a.getPragasEfetivas(),
                    estoqueDto
            );
        }).toList();

        Page<DadosAditivoCatalogo> dtoPage = new PageImpl<>(content, paginacao, page.getTotalElements());
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detalhar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var cultivador = cultivadorRepository.findByUsuarioId(usuario.getId());
        if (cultivador == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        var aditivoOpt = repository.findById(id);
        if (aditivoOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var a = aditivoOpt.get();
        var estoqueOpt = estoqueService.findByCultivadorAndProduto(cultivador.getId(), id);
        // Sem registro => estoque = null (front decide via cache/localStorage).
        var estoqueDto = estoqueOpt.map(this::toEstoqueDto).orElse(null);

        var dto = new DadosAditivoCatalogo(
                a.getId(),
                a.getNome(),
                a.getMarca(),
                a.getDescricao(),
            a.getDescricaoTecnica(),
                a.getEstagio(),
            a.getEstagiosMacro(),
            a.getEstagiosLista(),
                a.getClasse(),
                a.getDosePadraoEmML(),
                a.getAtivo(),
                a.getTipo() != null ? a.getTipo().toString() : null,
                a.getCapacidadeLitros(),
                a.getRoundsRecomendados(),
                a.getDescansoDiasRecomendados(),
                a.getDoseMinEmML(),
                a.getDoseMaxEmML(),
                a.getPragasEfetivas(),
                estoqueDto
        );

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @Valid @RequestBody DadosAtualizacaoAditivo dados) {
        var aditivo = repository.findById(id);
        if (aditivo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var aditivoExistente = aditivo.get();

        // tipo é opcional; se não vier, preserva.
        TipoProduto tipo = null;
        try {
            if (dados.tipo() != null) {
                tipo = TipoProduto.valueOf(dados.tipo());
            }
        } catch (Exception ignored) {}

        try {
            aditivoExistente.atualizarDados(
                    dados.nome(),
                    dados.marca(),
                    dados.descricao(),
                    dados.descricaoTecnica(),
                    dados.estagio(),
                    dados.estagiosMacro(),
                    dados.estagiosLista(),
                    dados.classe(),
                    dados.dosePadraoEmML(),
                    tipo,
                    dados.capacidadeLitros(),
                    dados.roundsRecomendados(),
                    dados.descansoDiasRecomendados(),
                    dados.doseMinEmML(),
                    dados.doseMaxEmML(),
                    dados.pragasEfetivas()
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }

        repository.save(aditivoExistente);
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
