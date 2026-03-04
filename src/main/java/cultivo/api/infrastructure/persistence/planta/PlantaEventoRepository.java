package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.planta.PlantaEvento;
import cultivo.api.domain.planta.TipoEvento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlantaEventoRepository extends JpaRepository<PlantaEvento, Long> {

    // Lista padrão: não retorna eventos removidos (soft delete)
    Page<PlantaEvento> findByPlantaIdAndDeletedAtIsNullOrderByDataEventoDesc(Long plantaId, Pageable paginacao);

    // Mantido por compatibilidade (caso algum lugar ainda use)
    Page<PlantaEvento> findByPlantaIdOrderByDataEventoDesc(Long plantaId, Pageable paginacao);

    Optional<PlantaEvento> findByPlantaIdAndIdempotencyKey(Long plantaId, String idempotencyKey);

    // Estado (sinal): usado para checar se ainda existe algum evento PRAGA ativo (não removido)
    boolean existsByPlantaIdAndTipoAndDeletedAtIsNull(Long plantaId, TipoEvento tipo);
}