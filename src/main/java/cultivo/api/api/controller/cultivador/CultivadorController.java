package cultivo.api.api.controller.cultivador;

import cultivo.api.domain.cultivador.Cultivador;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.exception.ErrorResponse;
import cultivo.api.infrastructure.persistence.cultivador.CultivadorRepository;
import cultivo.api.infrastructure.persistence.usuario.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/cultivadores")
public class CultivadorController {

    @Autowired
    private CultivadorRepository repository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var cultivador = repository.findByUsuarioId(usuario.getId());
        if (cultivador == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    new ErrorResponse(
                            HttpStatus.CONFLICT.value(),
                            "Usuário autenticado não possui cultivador cadastrado.",
                            LocalDateTime.now(),
                            null
                    )
            );
        }

        var resposta = new DadosDetalheCultivador(cultivador.getId(), cultivador.getUsuario().getNome(),
                cultivador.getUsuario().getLogin(), cultivador.getTelefone(), cultivador.getAtivo());
        return ResponseEntity.ok(resposta);
    }

    @PostMapping
    public ResponseEntity<DadosDetalheCultivador> cadastrar(@Valid @RequestBody DadosCadastroCultivador dados, UriComponentsBuilder uri) {
        var usuario = usuarioRepository.findById(dados.usuarioId());
        if (usuario.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        var cultivador = new Cultivador(usuario.get(), dados.telefone());
        repository.save(cultivador);
        
        var resposta = new DadosDetalheCultivador(cultivador.getId(), cultivador.getUsuario().getNome(),
            cultivador.getUsuario().getLogin(),
                cultivador.getTelefone(), cultivador.getAtivo());
        var uriBuilder = uri.path("/cultivadores/{id}").buildAndExpand(cultivador.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @GetMapping
    public ResponseEntity<Page<DadosDetalheCultivador>> listar(Pageable paginacao) {
        var page = repository.findAll(paginacao)
            .map(c -> new DadosDetalheCultivador(c.getId(), c.getUsuario().getNome(), c.getUsuario().getLogin(),
                c.getTelefone(), c.getAtivo()));
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DadosDetalheCultivador> detalhar(@PathVariable Long id) {
        var cultivador = repository.findById(id);
        if (cultivador.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var c = cultivador.get();
        var resposta = new DadosDetalheCultivador(c.getId(), c.getUsuario().getNome(), c.getUsuario().getLogin(),
            c.getTelefone(), c.getAtivo());
        return ResponseEntity.ok(resposta);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DadosDetalheCultivador> atualizar(@PathVariable Long id, @Valid @RequestBody DadosAtualizacaoCultivador dados) {
        var cultivador = repository.findById(id);
        if (cultivador.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var c = cultivador.get();
        if (dados.telefone() != null) {
            c.atualizarDados(dados.telefone());
        }
        repository.save(c);

        var resposta = new DadosDetalheCultivador(c.getId(), c.getUsuario().getNome(), c.getUsuario().getLogin(),
            c.getTelefone(), c.getAtivo());
        return ResponseEntity.ok(resposta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        var cultivador = repository.findById(id);
        if (cultivador.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var c = cultivador.get();
        c.desativar();
        repository.save(c);

        return ResponseEntity.noContent().build();
    }
}
