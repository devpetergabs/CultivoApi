package med.voll.cultivo.api.domain.planta;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlantaEventoRepository extends JpaRepository<PlantaEvento, Long> {
    Page<PlantaEvento> findByPlantaIdOrderByDataEventoDesc(Long plantaId, Pageable paginacao);
}
