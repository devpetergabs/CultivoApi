package cultivo.api.infrastructure.persistence.doctor;

import cultivo.api.domain.doctor.DoctorChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DoctorChatMessageRepository extends JpaRepository<DoctorChatMessage, Long> {
    List<DoctorChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId);
    List<DoctorChatMessage> findTop12BySessionIdOrderByCreatedAtDesc(Long sessionId);
}