package cultivo.api.api.controller.usuario;

import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.usuario.UsuarioRepository;
import cultivo.api.domain.cultivador.Cultivador;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private CultivadorRepository cultivadorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<DadosDetalheUsuario> me(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(new DadosDetalheUsuario(usuario.getId(), usuario.getNome(), usuario.getLogin()));
    }

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

        // Se isCultivador for true, cria o Cultivador
        if (Boolean.TRUE.equals(dados.isCultivador())) {
            Cultivador cultivador = dados.telefone() != null && !dados.telefone().isBlank()
                ? new Cultivador(usuario, dados.telefone())
                : new Cultivador(usuario);
            cultivadorRepository.save(cultivador);
        }

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
