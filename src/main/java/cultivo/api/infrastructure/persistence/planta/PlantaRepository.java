package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.planta.Planta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlantaRepository extends JpaRepository<Planta, Long> {
    Page<Planta> findByAtivoTrue(Pageable paginacao);
    Page<Planta> findByCultivadorIdAndAtivoTrue(Long cultivadorId, Pageable paginacao);
}
