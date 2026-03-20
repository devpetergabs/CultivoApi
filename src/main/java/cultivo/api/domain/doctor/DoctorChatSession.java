package cultivo.api.domain.doctor;

import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.usuario.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(name = "doctor_chat_sessions")
@Entity(name = "DoctorChatSession")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class DoctorChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(optional = false)
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DoctorChatSessionStatus status;

    @Column(name = "conversation_summary", columnDefinition = "LONGTEXT")
    private String conversationSummary;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public DoctorChatSession(Usuario usuario, Planta planta, String titulo) {
        this.usuario = usuario;
        this.planta = planta;
        this.titulo = titulo;
        this.status = DoctorChatSessionStatus.ATIVA;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public void encerrar() {
        this.status = DoctorChatSessionStatus.ENCERRADA;
        touch();
    }

    public void atualizarResumo(String resumo) {
        this.conversationSummary = resumo;
        touch();
    }
}