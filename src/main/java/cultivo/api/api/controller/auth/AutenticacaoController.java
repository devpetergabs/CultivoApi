package cultivo.api.api.controller.auth;

import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.exception.ErrorResponse;
import cultivo.api.infrastructure.security.TokenService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
public class AutenticacaoController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody DadosLogin dados) {
        try {
            var authenticationToken = new UsernamePasswordAuthenticationToken(dados.login(), dados.senha());
            var authentication = authenticationManager.authenticate(authenticationToken);
            var usuario = (Usuario) authentication.getPrincipal();
            var token = tokenService.gerarToken(usuario);

            return ResponseEntity.ok(new DadosTokenJWT(
                    token,
                    "Bearer",
                    tokenService.getExpiresAt(),
                    usuario.getId(),
                    usuario.getNome(),
                    usuario.getLogin(),
                    usuario.getRole()
            ));
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    new ErrorResponse(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Login ou senha inválidos.",
                            LocalDateTime.now(),
                            null
                    )
            );
        }
    }
}
