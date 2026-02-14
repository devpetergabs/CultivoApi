package med.voll.cultivo.api.domain.aditivo;

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

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String marca;
    private String descricao;
    private Double dosePadraoEmML;
    private Boolean ativo;

    public Aditivo(String nome, String marca, String descricao, Double dosePadraoEmML) {
        this.nome = nome;
        this.marca = marca;
        this.descricao = descricao;
        this.dosePadraoEmML = dosePadraoEmML;
        this.ativo = true;
    }

    public void desativar() {
        this.ativo = false;
    }
}
