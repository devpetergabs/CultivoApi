package cultivo.api.domain.planta;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(name = "planta_fotos")
@Entity(name = "PlantaFoto")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class PlantaFoto {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] imagem;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "data_upload")
    private LocalDateTime dataUpload;

    private String descricao;

    public PlantaFoto(Planta planta, byte[] imagem, String contentType, String descricao) {
        this.planta = planta;
        this.imagem = imagem;
        this.contentType = contentType;
        this.descricao = descricao;
        this.dataUpload = LocalDateTime.now();
    }
}
