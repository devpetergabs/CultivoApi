package cultivo.api.domain.planta;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(
        name = "planta_estagios_desbloqueados",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_planta_estagio_desbloqueado", columnNames = {"planta_id", "estagio"})
        }
)
@Entity(name = "PlantaEstagioDesbloqueado")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class PlantaEstagioDesbloqueado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstagioPlanta estagio;

    @Column(nullable = false)
    private String origem;

    @Column(name = "desbloqueado_em", nullable = false)
    private LocalDateTime desbloqueadoEm;

    public PlantaEstagioDesbloqueado(Planta planta, EstagioPlanta estagio, String origem) {
        this.planta = planta;
        this.estagio = estagio;
        this.origem = (origem == null || origem.isBlank()) ? "SISTEMA" : origem;
        this.desbloqueadoEm = LocalDateTime.now();
    }

    @PrePersist
    public void onCreate() {
        if (this.desbloqueadoEm == null) {
            this.desbloqueadoEm = LocalDateTime.now();
        }
        if (this.origem == null || this.origem.isBlank()) {
            this.origem = "SISTEMA";
        }
    }
}
