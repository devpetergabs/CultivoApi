package cultivo.api.domain.planta;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(name = "planta_eventos")
@Entity(name = "PlantaEvento")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class PlantaEvento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    @Enumerated(EnumType.STRING)
    private TipoEvento tipo;

    private LocalDateTime dataEvento;
    private String descricao;
    private Double doseEmML;

    public PlantaEvento(Planta planta, TipoEvento tipo, String descricao, Double doseEmML) {
        this.planta = planta;
        this.tipo = tipo;
        this.descricao = descricao;
        this.doseEmML = doseEmML;
        this.dataEvento = LocalDateTime.now();
    }
}
