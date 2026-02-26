package cultivo.api.domain.planta;

import cultivo.api.domain.aditivo.Aditivo;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(name = "planta_tratamentos")
@Entity(name = "PlantaTratamento")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class PlantaTratamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    @ManyToOne
    @JoinColumn(name = "produto_id", nullable = false)
    private Aditivo produto;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo")
    private TipoTratamento tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StatusTratamento status;

    @Column(name = "inicio_em")
    private LocalDateTime inicioEm;

    @Column(name = "rounds_total")
    private Integer roundsTotal;

    @Column(name = "round_atual")
    private Integer roundAtual;

    @Column(name = "descanso_dias")
    private Integer descansoDias;

    @Column(name = "proxima_aplicacao_em")
    private LocalDateTime proximaAplicacaoEm;

    @Column(name = "fim_tratamento_em")
    private LocalDateTime fimTratamentoEm;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public PlantaTratamento(Planta planta, Aditivo produto, TipoTratamento tipo, int roundsTotal, int descansoDias, LocalDateTime inicioEm) {
        this.planta = planta;
        this.produto = produto;
        this.tipo = tipo;
        this.status = StatusTratamento.ATIVO;
        this.inicioEm = inicioEm;
        this.roundsTotal = roundsTotal;
        this.roundAtual = 0;
        this.descansoDias = Math.max(0, descansoDias);
        this.proximaAplicacaoEm = null;

        // fim = data do último round (início + (roundsTotal-1)*descanso)
        int steps = Math.max(0, roundsTotal - 1);
        this.fimTratamentoEm = inicioEm.plusDays((long) steps * this.descansoDias);

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isAtivo() {
        return this.status == StatusTratamento.ATIVO;
    }

    public void cancelar(String reason) {
        // por enquanto não guardamos reason em coluna; pode ir no payload_json do evento se quiser depois.
        this.status = StatusTratamento.CANCELADO;
        this.proximaAplicacaoEm = null;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Registra uma aplicação: incrementa round, calcula próxima aplicação e conclui quando chega no total.
     */
    public void registrarAplicacao(LocalDateTime quando) {
        if (this.status != StatusTratamento.ATIVO) return;

        int total = Math.max(1, this.roundsTotal == null ? 1 : this.roundsTotal);
        int atual = Math.max(0, this.roundAtual == null ? 0 : this.roundAtual);
        atual++;
        this.roundAtual = atual;

        // recalcula fim para segurança
        int steps = Math.max(0, total - 1);
        int descanso = Math.max(0, this.descansoDias == null ? 0 : this.descansoDias);
        this.fimTratamentoEm = this.inicioEm.plusDays((long) steps * descanso);

        if (atual >= total) {
            this.status = StatusTratamento.CONCLUIDO;
            this.proximaAplicacaoEm = null;
        } else {
            this.proximaAplicacaoEm = quando.plusDays(descanso);
        }

        this.updatedAt = LocalDateTime.now();
    }
}
