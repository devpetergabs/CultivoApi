package cultivo.api.infrastructure.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import cultivo.api.domain.usuario.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class TokenService {

    private static final String ISSUER = "cultivo-inteligente-api";

    @Value("${api.security.token.secret}")
    private String secret;

    @Value("${api.security.token.expiration-hours:12}")
    private long expirationHours;

    public String gerarToken(Usuario usuario) {
        Instant expiresAt = getExpiresAt();

        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(usuario.getLogin())
                .withClaim("userId", usuario.getId())
                .withClaim("role", usuario.getRole())
                .withClaim("name", usuario.getNome())
                .withExpiresAt(expiresAt)
                .sign(getAlgorithm());
    }

    public String getSubject(String token) {
        try {
            return JWT.require(getAlgorithm())
                    .withIssuer(ISSUER)
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException ex) {
            return null;
        }
    }

    public Instant getExpiresAt() {
        return Instant.now().plus(expirationHours, ChronoUnit.HOURS);
    }

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC256(secret);
    }
}
