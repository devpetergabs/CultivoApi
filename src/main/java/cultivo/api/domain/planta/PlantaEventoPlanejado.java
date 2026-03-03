package cultivo.api.domain.planta;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(
        name = "planta_eventos_planejados",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_planejado_tratamento_round",
                        columnNames = {"tratamento_id", "tipo", "round_index"}
                )
        }
)
@Entity(name = "PlantaEventoPlanejado")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class PlantaEventoPlanejado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    @ManyToOne
    @JoinColumn(name = "tratamento_id", nullable = false)
    private PlantaTratamento tratamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoEventoPlanejado tipo;

    @Column(name = "round_index", nullable = false)
    private Integer roundIndex;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusEventoPlanejado status;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @ManyToOne
    @JoinColumn(name = "evento_execucao_id")
    private PlantaEvento eventoExecucao;

    @Column(name = "dose_em_ml")
    private Double doseEmML;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PlantaEventoPlanejado(Planta planta, PlantaTratamento tratamento, TipoEventoPlanejado tipo, int roundIndex, LocalDateTime scheduledAt) {
        this.planta = planta;
        this.tratamento = tratamento;
        this.tipo = tipo;
        this.roundIndex = roundIndex;
        this.scheduledAt = scheduledAt;
        this.status = StatusEventoPlanejado.PENDENTE;
        this.executedAt = null;
        this.eventoExecucao = null;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isPendente() {
        return this.status == StatusEventoPlanejado.PENDENTE;
    }

    public void marcarExecutado(PlantaEvento evento, LocalDateTime executedAt) {
        this.status = StatusEventoPlanejado.EXECUTADO;
        this.eventoExecucao = evento;
        this.executedAt = executedAt;
        this.updatedAt = LocalDateTime.now();
    }

    public void cancelar() {
        this.status = StatusEventoPlanejado.CANCELADO;
        this.updatedAt = LocalDateTime.now();
    }

    public void reschedule(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
        this.updatedAt = LocalDateTime.now();
    }

    public void setDoseEmML(Double doseEmML) {
        this.doseEmML = doseEmML;
        this.updatedAt = LocalDateTime.now();
    }

    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
