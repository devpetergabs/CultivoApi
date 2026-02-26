package cultivo.api.domain.aditivo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "aditivos")
@Entity(name = "Aditivo")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Aditivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String marca;
    private String descricao;

    @Enumerated(EnumType.STRING)
    private EstagioAditivo estagio;

    @Enumerated(EnumType.STRING)
    private ClasseAditivo classe;

    // --- Produto: tipo do item no inventário (ADITIVO / INSETICIDA / VASO / etc.) ---
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo")
    private TipoProduto tipo = TipoProduto.ADITIVO;

    @Column(name = "dose_padrao_em_ml")
    private Double dosePadraoEmML;

    // VASO (equipamento) - capacidade em litros
    @Column(name = "capacidade_litros")
    private Integer capacidadeLitros;

    // INSETICIDA (classe PROTECAO) - recomendações
    @Column(name = "rounds_recomendados")
    private Integer roundsRecomendados;

    @Column(name = "descanso_dias_recomendados")
    private Integer descansoDiasRecomendados;

    private Boolean ativo;

    public Aditivo(String nome, String marca, String descricao, EstagioAditivo estagio, Double dosePadraoEmML) {
        this.nome = nome;
        this.marca = marca;
        this.descricao = descricao;
        this.estagio = estagio;
        this.classe = ClasseAditivo.OUTROS;
        this.tipo = TipoProduto.ADITIVO;
        this.dosePadraoEmML = dosePadraoEmML;
        this.ativo = true;
    }

    public Aditivo(String nome, String marca, String descricao, EstagioAditivo estagio, ClasseAditivo classe, Double dosePadraoEmML) {
        this.nome = nome;
        this.marca = marca;
        this.descricao = descricao;
        this.estagio = estagio;
        this.classe = (classe == null) ? ClasseAditivo.OUTROS : classe;
        this.tipo = (this.classe == ClasseAditivo.PROTECAO) ? TipoProduto.INSETICIDA : TipoProduto.ADITIVO;
        this.dosePadraoEmML = dosePadraoEmML;
        this.ativo = true;
    }

    public void atualizarDados(
            String nome,
            String marca,
            String descricao,
            EstagioAditivo estagio,
            ClasseAditivo classe,
            Double dosePadraoEmML,
            TipoProduto tipo,
            Integer capacidadeLitros,
            Integer roundsRecomendados,
            Integer descansoDiasRecomendados
    ) {
        if (nome != null && !nome.isBlank()) this.nome = nome;
        if (marca != null && !marca.isBlank()) this.marca = marca;
        if (descricao != null) this.descricao = descricao;
        if (estagio != null) this.estagio = estagio;
        if (classe != null) this.classe = classe;
        if (tipo != null) this.tipo = tipo;

        if (dosePadraoEmML != null) this.dosePadraoEmML = dosePadraoEmML;
        if (capacidadeLitros != null) this.capacidadeLitros = capacidadeLitros;
        if (roundsRecomendados != null) this.roundsRecomendados = roundsRecomendados;
        if (descansoDiasRecomendados != null) this.descansoDiasRecomendados = descansoDiasRecomendados;
    }

    public void desativar() {
        this.ativo = false;
    }
}
