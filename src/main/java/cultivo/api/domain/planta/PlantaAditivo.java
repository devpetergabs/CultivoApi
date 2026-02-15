package cultivo.api.domain.planta;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import cultivo.api.domain.aditivo.Aditivo;

@Table(name = "planta_aditivos")
@Entity(name = "PlantaAditivo")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class PlantaAditivo {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    @ManyToOne
    @JoinColumn(name = "aditivo_id", nullable = false)
    private Aditivo aditivo;

    @Column(name = "dose_em_ml")
    private Double doseEmML;

    public PlantaAditivo(Planta planta, Aditivo aditivo, Double doseEmML) {
        this.planta = planta;
        this.aditivo = aditivo;
        this.doseEmML = doseEmML;
    }
}
