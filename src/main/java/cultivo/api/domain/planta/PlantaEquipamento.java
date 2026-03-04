package cultivo.api.domain.planta;

import cultivo.api.domain.aditivo.Aditivo;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table(name = "planta_equipamentos")
@Entity(name = "PlantaEquipamento")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class PlantaEquipamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "planta_id", nullable = false)
    private Planta planta;

    @Enumerated(EnumType.STRING)
    @Column(name = "slot", nullable = false)
    private SlotEquipamento slot;

    @ManyToOne
    @JoinColumn(name = "aditivo_id", nullable = false)
    private Aditivo produto;

    @Column(name = "cor_hex")
    private String corHex;

    @Column(name = "skin_id")
    private String skinId;

    @Column(name = "apelido")
    private String apelido;

    @Column(name = "equipado_em")
    private LocalDateTime equipadoEm = LocalDateTime.now();

    public PlantaEquipamento(Planta planta, SlotEquipamento slot, Aditivo produto) {
        this.planta = planta;
        this.slot = slot;
        this.produto = produto;
        this.equipadoEm = LocalDateTime.now();
    }

    public void atualizar(Aditivo produto, String corHex, String skinId, String apelido) {
        if (produto != null) this.produto = produto;
        this.corHex = corHex;
        this.skinId = skinId;
        this.apelido = apelido;
        this.equipadoEm = LocalDateTime.now();
    }
}
