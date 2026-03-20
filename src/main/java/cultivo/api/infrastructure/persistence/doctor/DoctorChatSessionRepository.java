package cultivo.api.infrastructure.persistence.doctor;

import cultivo.api.domain.doctor.DoctorChatSession;
import cultivo.api.domain.doctor.DoctorChatSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DoctorChatSessionRepository extends JpaRepository<DoctorChatSession, Long> {
    Optional<DoctorChatSession> findFirstByUsuarioIdAndPlantaIdAndStatusOrderByUpdatedAtDesc(Long usuarioId, Long plantaId, DoctorChatSessionStatus status);
}