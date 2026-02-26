package cultivo.api.application.estoque;

import cultivo.api.domain.aditivo.Aditivo;
import cultivo.api.domain.cultivador.Cultivador;
import cultivo.api.domain.estoque.ProdutoEstoque;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.aditivo.AditivoRepository;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import cultivo.api.infrastructure.persistence.estoque.ProdutoEstoqueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProdutoEstoqueService {

    @Autowired
    private ProdutoEstoqueRepository estoqueRepository;

    @Autowired
    private CultivadorRepository cultivadorRepository;

    @Autowired
    private AditivoRepository produtoRepository;

    public Cultivador getCultivadorOrThrow(Usuario usuario) {
        if (usuario == null) throw new IllegalArgumentException("Usuário não autenticado");
        var c = cultivadorRepository.findByUsuarioId(usuario.getId());
        if (c == null) throw new IllegalArgumentException("Usuário autenticado não possui cultivador cadastrado");
        return c;
    }

    public Optional<ProdutoEstoque> findByCultivadorAndProduto(Long cultivadorId, Long produtoId) {
        return estoqueRepository.findByCultivadorIdAndProdutoId(cultivadorId, produtoId);
    }

    public Map<Long, ProdutoEstoque> mapByProdutoId(Long cultivadorId, List<Long> produtoIds) {
        if (cultivadorId == null || produtoIds == null || produtoIds.isEmpty()) return Collections.emptyMap();
        var list = estoqueRepository.findByCultivadorIdAndProdutoIdIn(cultivadorId, produtoIds);
        return list.stream().collect(Collectors.toMap(e -> e.getProduto().getId(), e -> e));
    }

    @Transactional
    public ProdutoEstoque upsertEstoque(Usuario usuario, Long produtoId, Double stockMlAtual, Integer unidades, Integer mlFrasco) {
        var cultivador = getCultivadorOrThrow(usuario);

        if (produtoId == null || produtoId <= 0) {
            throw new IllegalArgumentException("produtoId inválido");
        }

        Aditivo produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado"));

        var estoque = estoqueRepository
                .findByCultivadorIdAndProdutoId(cultivador.getId(), produtoId)
                .orElseGet(() -> new ProdutoEstoque(cultivador, produto));

        // Atualiza (inclusive com 0): simula realidade.
        estoque.atualizar(stockMlAtual, unidades, mlFrasco);
        return estoqueRepository.save(estoque);
    }

    /**
     * Debita APENAS se o item já estiver rastreado (registro existe). Evita criar "verdade" de estoque
     * quando o usuário não configurou nada.
     */
    @Transactional
    public void debitarSeExiste(Long cultivadorId, Long produtoId, double consumoMl) {
        if (cultivadorId == null || produtoId == null) return;
        if (!Double.isFinite(consumoMl) || consumoMl <= 0) return;

        estoqueRepository.findByCultivadorIdAndProdutoId(cultivadorId, produtoId)
                .ifPresent(estoque -> {
                    estoque.debitar(consumoMl);
                    estoqueRepository.save(estoque);
                });
    }
}
