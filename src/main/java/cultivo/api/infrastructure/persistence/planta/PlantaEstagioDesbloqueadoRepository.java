package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.planta.EstagioPlanta;
import cultivo.api.domain.planta.PlantaEstagioDesbloqueado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlantaEstagioDesbloqueadoRepository extends JpaRepository<PlantaEstagioDesbloqueado, Long> {
    boolean existsByPlantaIdAndEstagio(Long plantaId, EstagioPlanta estagio);
    List<PlantaEstagioDesbloqueado> findAllByPlantaId(Long plantaId);
}
