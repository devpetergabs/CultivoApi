package cultivo.api.domain.planta;

import cultivo.api.domain.aditivo.Aditivo;
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

    // --- Produto / Tratamento (INSETICIDA multi-round) ---
    @ManyToOne
    @JoinColumn(name = "produto_id")
    private Aditivo produto;

    @ManyToOne
    @JoinColumn(name = "tratamento_id")
    private PlantaTratamento tratamento;

    @Column(name = "round_atual")
    private Integer roundAtual;

    @Column(name = "rounds_total")
    private Integer roundsTotal;

    @Column(name = "descanso_dias")
    private Integer descansoDias;

    @Column(name = "proxima_aplicacao_em")
    private LocalDateTime proximaAplicacaoEm;

    @Column(name = "fim_tratamento_em")
    private LocalDateTime fimTratamentoEm;

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

    public PlantaEvento(Planta planta, TipoEvento tipo, LocalDateTime dataEvento, String descricao, Double doseEmML) {
        this.planta = planta;
        this.tipo = tipo;
        this.descricao = descricao;
        this.doseEmML = doseEmML;
        this.dataEvento = dataEvento;
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

    public void setProduto(Aditivo produto) {
        this.produto = produto;
    }

    public void setTratamento(PlantaTratamento tratamento) {
        this.tratamento = tratamento;
    }

    public void setRoundAtual(Integer roundAtual) {
        this.roundAtual = roundAtual;
    }

    public void setRoundsTotal(Integer roundsTotal) {
        this.roundsTotal = roundsTotal;
    }

    public void setDescansoDias(Integer descansoDias) {
        this.descansoDias = descansoDias;
    }

    public void setProximaAplicacaoEm(LocalDateTime proximaAplicacaoEm) {
        this.proximaAplicacaoEm = proximaAplicacaoEm;
    }

    public void setFimTratamentoEm(LocalDateTime fimTratamentoEm) {
        this.fimTratamentoEm = fimTratamentoEm;
    }

    /**
     * Atualização parcial (soft edit).
     *
     * Sem versionamento por enquanto; apenas corrige os campos.
     * (O histórico de criação permanece no dataEvento.)
     */
    public void updateDescricao(String novaDescricao) {
        this.descricao = novaDescricao;
    }

    public void updateDoseEmML(Double novaDoseEmML) {
        this.doseEmML = novaDoseEmML;
    }
}