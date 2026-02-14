package med.voll.cultivo.api.domain.planta;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import med.voll.cultivo.api.domain.cultivador.Cultivador;

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
    private LocalDate dataGerminacao;
    private Double altura;
    private Double largura;
    private Double larguraCaule;

    @Enumerated(EnumType.STRING)
    private TamanhVaso tamanhoVaso;

    private Boolean ativo;
    private LocalDate dataCriacao;

    public Planta(String nome, String strain, LocalDate dataGerminacao, Double altura,
                  Double largura, Double larguraCaule, TamanhVaso tamanhoVaso, Cultivador cultivador) {
        this.nome = nome;
        this.strain = strain;
        this.dataGerminacao = dataGerminacao;
        this.altura = altura;
        this.largura = largura;
        this.larguraCaule = larguraCaule;
        this.tamanhoVaso = tamanhoVaso;
        this.cultivador = cultivador;
        this.ativo = true;
        this.dataCriacao = LocalDate.now();
    }

    public void atualizarDados(String nome, Double altura, Double largura, Double larguraCaule, TamanhVaso tamanhoVaso) {
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
    }

    public void desativar() {
        this.ativo = false;
    }
}
