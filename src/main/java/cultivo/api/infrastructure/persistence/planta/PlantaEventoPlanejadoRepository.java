package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.planta.PlantaEventoPlanejado;
import cultivo.api.domain.planta.StatusEventoPlanejado;
import cultivo.api.domain.planta.TipoEventoPlanejado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlantaEventoPlanejadoRepository extends JpaRepository<PlantaEventoPlanejado, Long> {

    Optional<PlantaEventoPlanejado> findByTratamentoIdAndTipoAndRoundIndex(Long tratamentoId, TipoEventoPlanejado tipo, Integer roundIndex);

    List<PlantaEventoPlanejado> findByTratamentoIdAndTipoOrderByRoundIndexAsc(Long tratamentoId, TipoEventoPlanejado tipo);

    List<PlantaEventoPlanejado> findByPlantaIdAndTipoAndStatusOrderByScheduledAtAsc(Long plantaId, TipoEventoPlanejado tipo, StatusEventoPlanejado status);
}
