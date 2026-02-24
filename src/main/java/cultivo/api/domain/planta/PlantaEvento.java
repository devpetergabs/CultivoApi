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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    @Enumerated(EnumType.STRING)
    private TipoEvento tipo;

    @Column(name = "data_evento")
    private LocalDateTime dataEvento;

    private String descricao;

    @Column(name = "dose_em_ml")
    private Double doseEmML;

    // --- Extensões (gamification / UX) ---

    @Column(name = "correlation_id")
    private String correlationId;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    // Mantém compatível: o front pode enviar null; usamos String para não travar o build.
    @Column(name = "payload_json", columnDefinition = "json")
    private String payloadJson;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_reason")
    private String deletedReason;

    public PlantaEvento(Planta planta, TipoEvento tipo, String descricao, Double doseEmML) {
        this.planta = planta;
        this.tipo = tipo;
        this.descricao = descricao;
        this.doseEmML = doseEmML;
        this.dataEvento = LocalDateTime.now();
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void softDelete(String reason) {
        this.deletedAt = LocalDateTime.now();
        this.deletedReason = reason;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }
}