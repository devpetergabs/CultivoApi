package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.planta.CodexEstagio;
import cultivo.api.domain.planta.EstagioPlanta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodexEstagioRepository extends JpaRepository<CodexEstagio, Long> {
    Optional<CodexEstagio> findByEstagio(EstagioPlanta estagio);
    List<CodexEstagio> findAllByAtivoTrueOrderByOrdemDesbloqueioAscIdAsc();
}
