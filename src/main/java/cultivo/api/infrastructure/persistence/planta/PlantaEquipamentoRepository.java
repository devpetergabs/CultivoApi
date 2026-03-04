package cultivo.api.infrastructure.persistence.planta;

import cultivo.api.domain.planta.PlantaEquipamento;
import cultivo.api.domain.planta.SlotEquipamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlantaEquipamentoRepository extends JpaRepository<PlantaEquipamento, Long> {
    Optional<PlantaEquipamento> findByPlantaIdAndSlot(Long plantaId, SlotEquipamento slot);
    List<PlantaEquipamento> findAllByPlantaId(Long plantaId);
}
