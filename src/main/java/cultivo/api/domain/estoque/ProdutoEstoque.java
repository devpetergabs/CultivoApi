package cultivo.api.domain.estoque;

import cultivo.api.domain.aditivo.Aditivo;
import cultivo.api.domain.aditivo.TipoProduto;
import cultivo.api.domain.cultivador.Cultivador;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(
        name = "cultivador_produtos_estoque",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_estoque_cult_prod", columnNames = {"cultivador_id", "produto_id"})
        }
)
@Entity(name = "ProdutoEstoque")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ProdutoEstoque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cultivador_id", nullable = false)
    private Cultivador cultivador;

    @ManyToOne(optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Aditivo produto;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_produto", nullable = false)
    private TipoProduto tipoProduto;

    @Column(name = "stock_ml_atual", nullable = false)
    private Double stockMlAtual = 0.0;

    @Column(name = "unidades", nullable = false)
    private Integer unidades = 0;

    @Column(name = "ml_frasco", nullable = false)
    private Integer mlFrasco = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ProdutoEstoque(Cultivador cultivador, Aditivo produto) {
        this.cultivador = cultivador;
        this.produto = produto;
        this.tipoProduto = produto.getTipo() != null ? produto.getTipo() : TipoProduto.OUTRO;
        this.stockMlAtual = 0.0;
        this.unidades = 0;
        this.mlFrasco = 0;
    }

    @PrePersist
    public void onCreate() {
        var now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.stockMlAtual == null) this.stockMlAtual = 0.0;
        if (this.unidades == null) this.unidades = 0;
        if (this.mlFrasco == null) this.mlFrasco = 0;
        if (this.tipoProduto == null) this.tipoProduto = TipoProduto.OUTRO;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.stockMlAtual == null) this.stockMlAtual = 0.0;
        if (this.unidades == null) this.unidades = 0;
        if (this.mlFrasco == null) this.mlFrasco = 0;
        if (this.tipoProduto == null) this.tipoProduto = TipoProduto.OUTRO;
    }

    public void atualizar(Double stockMlAtual, Integer unidades, Integer mlFrasco) {
        if (stockMlAtual != null) {
            this.stockMlAtual = Math.max(0.0, stockMlAtual);
        }
        if (unidades != null) {
            this.unidades = Math.max(0, unidades);
        }
        if (mlFrasco != null) {
            this.mlFrasco = Math.max(0, mlFrasco);
        }

        // tipo sempre acompanha o produto (evita inconsistência)
        this.tipoProduto = produto.getTipo() != null ? produto.getTipo() : TipoProduto.OUTRO;
    }

    public void debitar(double consumoMl) {
        if (!Double.isFinite(consumoMl) || consumoMl <= 0) return;
        double atual = this.stockMlAtual != null ? this.stockMlAtual : 0.0;
        double next = atual - consumoMl;
        this.stockMlAtual = Math.max(0.0, next);
        // IMPORTANT: não reabastece automaticamente. Se zerou, fica 0.
    }

    /** Debita 1 unidade física (equipamento, vaso etc.). Não desce abaixo de 0. */
    public void debitarUnidade() {
        int atual = this.unidades != null ? this.unidades : 0;
        this.unidades = Math.max(0, atual - 1);
    }
}
