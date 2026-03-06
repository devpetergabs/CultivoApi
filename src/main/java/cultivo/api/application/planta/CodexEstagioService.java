package cultivo.api.application.planta;

import cultivo.api.api.controller.codex.DadosAditivoMatchEstagio;
import cultivo.api.api.controller.codex.DadosCodexEstagio;
import cultivo.api.domain.aditivo.Aditivo;
import cultivo.api.domain.aditivo.EstagioAditivo;
import cultivo.api.domain.aditivo.TipoProduto;
import cultivo.api.domain.planta.CodexEstagio;
import cultivo.api.domain.planta.EstagioPlanta;
import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.planta.PlantaEstagioDesbloqueado;
import cultivo.api.infrastructure.persistence.aditivo.AditivoRepository;
import cultivo.api.infrastructure.persistence.planta.CodexEstagioRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaEstagioDesbloqueadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CodexEstagioService {

    private static final String BULLET_DELIMITER = "\\|\\|";

    @Autowired
    private CodexEstagioRepository codexEstagioRepository;

    @Autowired
    private PlantaEstagioDesbloqueadoRepository plantaEstagioDesbloqueadoRepository;

    @Autowired
    private AditivoRepository aditivoRepository;

    public List<DadosCodexEstagio> listarCatalogo() {
        return codexEstagioRepository.findAllByAtivoTrueOrderByOrdemDesbloqueioAscIdAsc()
                .stream()
                .map(entry -> toDto(entry, false, false))
                .toList();
    }

    public DadosCodexEstagio detalharEstagio(EstagioPlanta estagio) {
        var entry = codexEstagioRepository.findByEstagio(estagio)
                .orElseThrow(() -> new IllegalArgumentException("Codex de estágio não encontrado para " + estagio));
        return toDto(entry, false, false);
    }

    @Transactional
    public List<DadosCodexEstagio> listarCatalogoDaPlanta(Planta planta) {
        garantirTrilhaDesbloqueada(planta, "CONSULTA_CODEX");
        Set<EstagioPlanta> unlocked = unlockedSet(planta.getId());

        return codexEstagioRepository.findAllByAtivoTrueOrderByOrdemDesbloqueioAscIdAsc()
                .stream()
                .map(entry -> toDto(entry, unlocked.contains(entry.getEstagio()), entry.getEstagio() == planta.getEstagio()))
                .toList();
    }

    @Transactional
    public DadosCodexEstagio obterEstagioAtualDaPlanta(Planta planta) {
        garantirTrilhaDesbloqueada(planta, "CONSULTA_ESTAGIO_ATUAL");
        var entry = codexEstagioRepository.findByEstagio(planta.getEstagio())
                .orElseThrow(() -> new IllegalArgumentException("Codex de estágio não encontrado para " + planta.getEstagio()));
        return toDto(entry, true, true);
    }

    @Transactional
    public void garantirTrilhaDesbloqueada(Planta planta, String origem) {
        if (planta == null || planta.getId() == null || planta.getEstagio() == null) return;

        var catalog = codexEstagioRepository.findAllByAtivoTrueOrderByOrdemDesbloqueioAscIdAsc();
        if (catalog.isEmpty()) return;

        Integer ordemAtual = catalog.stream()
                .filter(entry -> entry.getEstagio() == planta.getEstagio())
                .map(CodexEstagio::getOrdemDesbloqueio)
                .findFirst()
                .orElse(null);

        if (ordemAtual == null) {
            unlockIfNeeded(planta, EstagioPlanta.GERMINACAO, "TRILHA_BASE");
            unlockIfNeeded(planta, planta.getEstagio(), origem);
            return;
        }

        for (var entry : catalog) {
            if (entry.getOrdemDesbloqueio() <= ordemAtual) {
                unlockIfNeeded(planta, entry.getEstagio(), entry.getEstagio() == planta.getEstagio() ? origem : "TRILHA_BASE");
            }
        }
    }

    private void unlockIfNeeded(Planta planta, EstagioPlanta estagio, String origem) {
        if (plantaEstagioDesbloqueadoRepository.existsByPlantaIdAndEstagio(planta.getId(), estagio)) return;
        plantaEstagioDesbloqueadoRepository.save(new PlantaEstagioDesbloqueado(planta, estagio, origem));
    }

    private Set<EstagioPlanta> unlockedSet(Long plantaId) {
        if (plantaId == null) return Collections.emptySet();
        return plantaEstagioDesbloqueadoRepository.findAllByPlantaId(plantaId)
                .stream()
                .map(PlantaEstagioDesbloqueado::getEstagio)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(EstagioPlanta.class)));
    }

    private DadosCodexEstagio toDto(CodexEstagio entry, boolean unlocked, boolean atual) {
        List<DadosAditivoMatchEstagio> aditivos = entry.getNenhumAditivoRecomendado() != null && entry.getNenhumAditivoRecomendado()
                ? List.of()
                : resolveRecommendedAditivos(entry.getEstagio());

        boolean nenhumAditivo = Boolean.TRUE.equals(entry.getNenhumAditivoRecomendado()) || aditivos.isEmpty();
        String mensagemAditivos = nenhumAditivo
                ? firstNonBlank(entry.getMensagemAditivosVazia(), "Para esta fase não é recomendado nenhum aditivo.")
                : "Aditivos com match simples para esta fase.";

        return new DadosCodexEstagio(
                entry.getEstagio().name(),
                entry.getSlug(),
                entry.getNomeExibicao(),
                entry.getSubtitulo(),
                entry.getDescricaoBreve(),
                entry.getDescricaoLore(),
                splitBullets(entry.getCuidadosTexto()),
                splitBullets(entry.getCuriosidadesTexto()),
                splitBullets(entry.getPontosFortesTexto()),
                splitBullets(entry.getPontosFracosTexto()),
                splitBullets(entry.getAlertasTexto()),
                entry.getResistenciaLabel(),
                entry.getObservacaoLegal(),
                entry.getOrdemDesbloqueio(),
                unlocked,
                atual,
                nenhumAditivo,
                mensagemAditivos,
                nenhumAditivo ? List.of() : aditivos,
                entry.getArtAssetKey(),
                entry.getTemaVisual()
        );
    }

    private List<DadosAditivoMatchEstagio> resolveRecommendedAditivos(EstagioPlanta estagio) {
        var stage = mapPlantStageToAditivoStage(estagio);
        if (stage == null) return List.of();

        return aditivoRepository.findByAtivoTrueAndTipoAndEstagioOrderByNomeAsc(TipoProduto.ADITIVO, stage)
                .stream()
                .map(this::toAditivoMatch)
                .toList();
    }

    private DadosAditivoMatchEstagio toAditivoMatch(Aditivo aditivo) {
        String descricao = aditivo.getDescricao();
        if (descricao != null && descricao.length() > 180) {
            descricao = descricao.substring(0, 177) + "...";
        }

        return new DadosAditivoMatchEstagio(
                aditivo.getId(),
                aditivo.getNome(),
                aditivo.getMarca(),
                aditivo.getTipo() != null ? aditivo.getTipo().name() : null,
                descricao,
                aditivo.getDosePadraoEmML()
        );
    }

    private EstagioAditivo mapPlantStageToAditivoStage(EstagioPlanta estagio) {
        if (estagio == null) return null;
        return switch (estagio) {
            case VEGETATIVO_INICIAL, VEGETATIVO_MEDIO, VEGETATIVO_AVANCADO -> EstagioAditivo.VEGETATIVA;
            case FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA -> EstagioAditivo.FLORACAO;
            case FINALIZACAO -> EstagioAditivo.FINALIZACAO;
            case GERMINACAO -> null;
        };
    }

    private List<String> splitBullets(String raw) {
        if (raw == null || raw.isBlank()) return List.of();

        Set<String> items = new LinkedHashSet<>();
        for (String item : raw.split(BULLET_DELIMITER)) {
            String normalized = item == null ? "" : item.trim();
            if (!normalized.isEmpty()) items.add(normalized);
        }
        return List.copyOf(items);
    }

    private String firstNonBlank(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) return preferred;
        return fallback;
    }
}
