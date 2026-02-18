package cultivo.api.domain.planta;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import cultivo.api.domain.cultivador.Cultivador;

import java.time.LocalDate;

@Table(name = "plantas")
@Entity(name = "Planta")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Planta {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cultivador_id", nullable = false)
    private Cultivador cultivador;

    private String nome;
    private String strain;

    @Column(name = "data_germinacao")
    private LocalDate dataGerminacao;

    private Double altura;
    private Double largura;

    @Column(name = "largura_caule")
    private Double larguraCaule;

    @Enumerated(EnumType.STRING)
    @Column(name = "tamanho_vaso")
    private TamanhVaso tamanhoVaso;

    @Enumerated(EnumType.STRING)
    private EstagioPlanta estagio;

    @Enumerated(EnumType.STRING)
    @Column(name = "sexo_planta")
    private SexoPlanta sexo;

    @Column(name = "data_sexagem")
    private LocalDate dataSexagem;

    @Column(name = "data_floracao")
    private LocalDate dataFloracao;

    private Boolean ativo;

    @Column(name = "data_criacao")
    private LocalDate dataCriacao;

    public Planta(String nome, String strain, LocalDate dataGerminacao, Double altura,
                  Double largura, Double larguraCaule, TamanhVaso tamanhoVaso, EstagioPlanta estagio, Cultivador cultivador) {
        this.nome = nome;
        this.strain = strain;
        this.dataGerminacao = dataGerminacao;
        this.altura = altura;
        this.largura = largura;
        this.larguraCaule = larguraCaule;
        this.tamanhoVaso = tamanhoVaso;
        this.estagio = estagio;
        this.cultivador = cultivador;
        this.ativo = true;
        this.dataCriacao = LocalDate.now();
    }

    public void atualizarDados(String nome, Double altura, Double largura, Double larguraCaule, TamanhVaso tamanhoVaso, EstagioPlanta estagio, SexoPlanta sexo, LocalDate dataSexagem, LocalDate dataFloracao) {
        if (nome != null && !nome.isBlank()) {
            this.nome = nome;
        }
        if (altura != null) {
            this.altura = altura;
        }
        if (largura != null) {
            this.largura = largura;
        }
        if (larguraCaule != null) {
            this.larguraCaule = larguraCaule;
        }
        if (tamanhoVaso != null) {
            this.tamanhoVaso = tamanhoVaso;
        }
        if (estagio != null) {
            this.estagio = estagio;
        }
        if (sexo != null) {
            this.sexo = sexo;
        }
        if (dataSexagem != null) {
            this.dataSexagem = dataSexagem;
        }
        if (dataFloracao != null) {
            this.dataFloracao = dataFloracao;
        }
    }

    public void desativar() {
        this.ativo = false;
    }
}
