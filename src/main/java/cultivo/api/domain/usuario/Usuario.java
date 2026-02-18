package cultivo.api.domain.usuario;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "usuarios")
@Entity(name = "Usuario")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String login;
    private String senha;
    private String role;

    public Usuario(String nome, String login, String senha, String role) {
        this.nome = nome;
        this.login = login;
        this.senha = senha;
        this.role = role;
    }

    public Usuario(String nome, String login, String senha) {
        this.nome = nome;
        this.login = login;
        this.senha = senha;
        this.role = "ROLE_USER";
    }

    public Usuario(String login, String senha) {
        this.nome = login;
        this.login = login;
        this.senha = senha;
        this.role = "ROLE_USER";
    }

    public void atualizarNome(String nome) {
        if (nome != null && !nome.isBlank()) {
            this.nome = nome;
        }
    }

    public void atualizarSenha(String senha) {
        if (senha != null && !senha.isBlank()) {
            this.senha = senha;
        }
    }

    public void atualizarRole(String role) {
        if (role != null && !role.isBlank()) {
            this.role = role;
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String resolvedRole = (role == null || role.isBlank()) ? "ROLE_USER" : role;
        return List.of(new SimpleGrantedAuthority(resolvedRole));
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public String getUsername() {
        return login;
    }

    @Override
    public boolean isAccountNonExpired() {
       return true;
    }

    @Override
    public boolean isAccountNonLocked() {
       return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
