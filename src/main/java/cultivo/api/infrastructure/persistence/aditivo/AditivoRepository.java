package cultivo.api.infrastructure.persistence.aditivo;

import cultivo.api.domain.aditivo.Aditivo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AditivoRepository extends JpaRepository<Aditivo, Long> {
}
