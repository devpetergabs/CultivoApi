package cultivo.api.infrastructure.persistence.aditivo;

import cultivo.api.domain.aditivo.Aditivo;
import cultivo.api.domain.aditivo.TipoProduto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AditivoRepository extends JpaRepository<Aditivo, Long> {
    Optional<Aditivo> findFirstByTipoAndCapacidadeLitros(TipoProduto tipo, Integer capacidadeLitros);
    Optional<Aditivo> findByIdAndTipo(Long id, TipoProduto tipo);
}
