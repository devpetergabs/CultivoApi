package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.planta.PlantaTratamento;
import cultivo.api.domain.planta.StatusTratamento;
import cultivo.api.domain.planta.TipoTratamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlantaTratamentoRepository extends JpaRepository<PlantaTratamento, Long> {

    Optional<PlantaTratamento> findFirstByPlantaIdAndStatusAndTipoOrderByUpdatedAtDesc(
            Long plantaId,
            StatusTratamento status,
            TipoTratamento tipo
    );
}
