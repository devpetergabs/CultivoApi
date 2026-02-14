package med.voll.cultivo.api.domain.planta;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlantaFotoRepository extends JpaRepository<PlantaFoto, Long> {
    Page<PlantaFoto> findByPlantaId(Long plantaId, Pageable paginacao);
}
