package cultivo.api.infrastructure.persistence.cultivador;

import cultivo.api.domain.cultivador.Cultivador;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CultivadorRepository extends JpaRepository<Cultivador, Long> {
    Cultivador findByUsuarioId(Long usuarioId);
}
