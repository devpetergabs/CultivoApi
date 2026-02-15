package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.planta.PlantaAditivo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlantaAditivoRepository extends JpaRepository<PlantaAditivo, Long> {
    void deleteByPlantaId(Long plantaId);
}
