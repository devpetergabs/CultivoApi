package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.planta.PlantaAditivo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlantaAditivoRepository extends JpaRepository<PlantaAditivo, Long> {
    Page<PlantaAditivo> findByPlantaId(Long plantaId, Pageable paginacao);
    void deleteByPlantaId(Long plantaId);
}
