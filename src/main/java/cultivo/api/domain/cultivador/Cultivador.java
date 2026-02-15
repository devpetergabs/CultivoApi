package cultivo.api.domain.cultivador;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import cultivo.api.domain.usuario.Usuario;

@Table(name = "cultivadores")
@Entity(name = "Cultivador")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Cultivador {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    private String telefone;
    private Boolean ativo;

    public Cultivador(Usuario usuario) {
        this.usuario = usuario;
        this.ativo = true;
    }

    public void atualizarDados(String telefone) {
        if (telefone != null && !telefone.isBlank()) {
            this.telefone = telefone;
        }
    }

    public void desativar() {
        this.ativo = false;
    }
}
