package med.voll.cultivo.api.domain.cultivador;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CultivadorRepository extends JpaRepository<Cultivador, Long> {
    Cultivador findByUsuarioId(Long usuarioId);
}
