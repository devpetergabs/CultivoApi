package cultivo.api.api.controller.usuario;

import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.usuario.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/registrar")
    public ResponseEntity<DadosDetalheUsuario> registrar(@Valid @RequestBody DadosCadastroUsuario dados, UriComponentsBuilder uri) {
        // Verificar se usuário já existe
        var usuarioExistente = repository.findByLogin(dados.login());
        if (usuarioExistente != null) {
            return ResponseEntity.badRequest().build();
        }

        var senhaCriptografada = passwordEncoder.encode(dados.senha());
        var usuario = new Usuario(dados.nome(), dados.login(), senhaCriptografada);
        repository.save(usuario);

        var resposta = new DadosDetalheUsuario(usuario.getId(), usuario.getNome(), usuario.getLogin());
        var uriBuilder = uri.path("/usuarios/{id}").buildAndExpand(usuario.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @GetMapping
    public ResponseEntity<Page<DadosDetalheUsuario>> listar(Pageable paginacao) {
        var page = repository.findAll(paginacao)
                .map(u -> new DadosDetalheUsuario(u.getId(), u.getNome(), u.getLogin()));
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DadosDetalheUsuario> detalhar(@PathVariable Long id) {
        var usuario = repository.findById(id);
        return usuario.map(u -> ResponseEntity.ok(new DadosDetalheUsuario(u.getId(), u.getNome(), u.getLogin())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        var usuario = repository.findById(id);
        if (usuario.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
