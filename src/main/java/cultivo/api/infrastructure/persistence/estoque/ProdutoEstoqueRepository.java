package cultivo.api.infrastructure.persistence.estoque;

import cultivo.api.domain.estoque.ProdutoEstoque;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProdutoEstoqueRepository extends JpaRepository<ProdutoEstoque, Long> {

    Optional<ProdutoEstoque> findByCultivadorIdAndProdutoId(Long cultivadorId, Long produtoId);

    List<ProdutoEstoque> findByCultivadorIdAndProdutoIdIn(Long cultivadorId, List<Long> produtoIds);
}
