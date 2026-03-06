package cultivo.api.domain.planta;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "codex_estagios")
@Entity(name = "CodexEstagio")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class CodexEstagio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private EstagioPlanta estagio;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "nome_exibicao", nullable = false)
    private String nomeExibicao;

    @Column(nullable = false)
    private String subtitulo;

    @Column(name = "descricao_breve", nullable = false, columnDefinition = "TEXT")
    private String descricaoBreve;

    @Column(name = "descricao_lore", nullable = false, columnDefinition = "TEXT")
    private String descricaoLore;

    @Column(name = "cuidados_texto", columnDefinition = "TEXT")
    private String cuidadosTexto;

    @Column(name = "curiosidades_texto", columnDefinition = "TEXT")
    private String curiosidadesTexto;

    @Column(name = "pontos_fortes_texto", columnDefinition = "TEXT")
    private String pontosFortesTexto;

    @Column(name = "pontos_fracos_texto", columnDefinition = "TEXT")
    private String pontosFracosTexto;

    @Column(name = "alertas_texto", columnDefinition = "TEXT")
    private String alertasTexto;

    @Column(name = "resistencia_label")
    private String resistenciaLabel;

    @Column(name = "observacao_legal", columnDefinition = "TEXT")
    private String observacaoLegal;

    @Column(name = "mensagem_aditivos_vazia", columnDefinition = "TEXT")
    private String mensagemAditivosVazia;

    @Column(name = "nenhum_aditivo_recomendado", nullable = false)
    private Boolean nenhumAditivoRecomendado = false;

    @Column(name = "ordem_desbloqueio", nullable = false)
    private Integer ordemDesbloqueio;

    @Column(name = "art_asset_key")
    private String artAssetKey;

    @Column(name = "tema_visual")
    private String temaVisual;

    @Column(nullable = false)
    private Boolean ativo = true;
}
