package cultivo.api.domain.doctor;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(name = "doctor_chat_messages")
@Entity(name = "DoctorChatMessage")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class DoctorChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private DoctorChatSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DoctorChatMessageRole role;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "metadata_json", columnDefinition = "json")
    private String metadataJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public DoctorChatMessage(DoctorChatSession session, DoctorChatMessageRole role, String content, String metadataJson) {
        this.session = session;
        this.role = role;
        this.content = content;
        this.metadataJson = metadataJson;
        this.createdAt = LocalDateTime.now();
    }
}