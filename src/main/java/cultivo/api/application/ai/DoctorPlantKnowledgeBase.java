package cultivo.api.application.ai;

import cultivo.api.domain.planta.Planta;
import jakarta.annotation.PostConstruct;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class DoctorPlantKnowledgeBase {

    private static final Pattern TOKEN_SPLIT = Pattern.compile("[^\\p{L}\\p{Nd}]+");
    private static final Set<String> EXTENSOES_SUPORTADAS = Set.of(".txt", ".md", ".pdf", ".doc", ".docx");
    private static final Set<String> STOPWORDS = Set.of(
            "a", "o", "e", "de", "da", "do", "das", "dos", "um", "uma", "uns", "umas",
            "para", "com", "sem", "por", "que", "na", "no", "nas", "nos", "em", "ser",
            "esta", "está", "esse", "essa", "isso", "como", "mais", "menos", "muito", "pouco",
            "sobre", "apenas", "ainda", "planta", "folha", "folhas", "relato", "cultivo"
    );
    private static final int TAMANHO_MAXIMO_CHUNK = 1400;
    private static final int CHUNKS_RETORNADOS = 4;
    private static final int TAMANHO_MAXIMO_TRECHO = 900;
    private static final int CHUNKS_CAMADA_BASE = 2;
    private static final Set<String> PASTAS_IGNORADAS_ROTEAMENTO = Set.of("fontes_ollama_filtradas");

    private final String promptFilePath;
    private final String sourcesDirPath;
    private final Tika tika = new Tika();

    private static final String PROMPT_BASE_FALLBACK = "Você é o Doctor P., especialista em cannabis do Cultivo Inteligente.";
    private volatile List<KnowledgeChunk> chunks = List.of();
    private volatile long sourcesFingerprint = -1L;

    public DoctorPlantKnowledgeBase(
            @Value("${app.ai.doctor-plant.prompt-file}") String promptFilePath,
            @Value("${app.ai.doctor-plant.sources-dir}") String sourcesDirPath
    ) {
        this.promptFilePath = promptFilePath;
        this.sourcesDirPath = sourcesDirPath;
    }

    @PostConstruct
    public void carregar() {
        this.chunks = carregarChunks();
        this.sourcesFingerprint = calcularFingerprintFontes();
    }

    /** Lê o arquivo de prompt a cada chamada para refletir edições sem restart. */
    public String getPromptBase() {
        return carregarPromptBase();
    }

    public String buildReferenceContext(Planta planta, String descricao, DoctorChatMode modo) {
        return buildReferenceResult(planta, descricao, modo, mapIntentFromMode(modo, descricao)).renderedContext();
    }

    public String buildReferenceContext(Planta planta, String descricao, DoctorChatMode modo, DoctorChatIntent intent) {
        return buildReferenceResult(planta, descricao, modo, intent).renderedContext();
    }

    public ReferenceContextResult buildReferenceResult(Planta planta, String descricao, DoctorChatMode modo) {
        return buildReferenceResult(planta, descricao, modo, mapIntentFromMode(modo, descricao));
    }

    public ReferenceContextResult buildReferenceResult(Planta planta, String descricao, DoctorChatMode modo, DoctorChatIntent intent) {
        recarregarSeNecessario();
        DoctorChatIntent resolvedIntent = intent == null ? mapIntentFromMode(modo, descricao) : intent;

        if (chunks.isEmpty()) {
            return new ReferenceContextResult(
                    "Nenhuma fonte local foi carregada. Use apenas o prompt-base e explicite a limitação.",
                    "",
                    List.of(),
                    List.of(),
                    false,
                    "geral",
                    List.of("geral"),
                    List.of("pt", "en", "multi"),
                    false,
                    List.of(),
                    new CrossSourceSynthesis(
                            "nenhuma fonte local foi carregada para sustentar fundamento geral",
                            "sem refino temático local disponível",
                            "não há convergência observável sem fontes carregadas",
                            "qualquer resposta deve assumir limitação explícita de base local",
                            "sem preferência prática de idioma porque não houve recuperação",
                            List.of("geral"),
                            List.of("pt", "en", "multi"),
                            List.of(),
                            List.of(),
                            "use apenas o prompt-base e admita a lacuna local"
                    )
            );
        }

        String consulta = enriquecerConsulta(montarConsultaBase(planta, descricao, modo, resolvedIntent), modo, resolvedIntent);
        QueryRoute route = inferirRota(consulta, modo, resolvedIntent);

        Set<String> termos = tokenizar(consulta);

        List<RankedChunk> ranqueados = chunks.stream()
                .map(chunk -> new RankedChunk(chunk, pontuar(chunk, termos, modo, resolvedIntent, planta, route)))
                .sorted(Comparator.comparingInt(RankedChunk::score).reversed())
                .toList();

        return montarResultadoEmDuasCamadas(ranqueados, consulta, modo, route);
    }

    private String montarConsultaBase(Planta planta, String descricao, DoctorChatMode modo, DoctorChatIntent intent) {
        return switch (intent) {
            case DEFINICAO -> String.join(" ", valor(descricao), "cannabis conceito definição glossário sinais diferenças práticas");
            case LEITURA_ESTAGIO -> String.join(" ",
                    valor(planta != null && planta.getEstagio() != null ? planta.getEstagio().name() : null),
                    valor(descricao),
                    "cannabis estágio fenologia fotoperíodo maturação tricomas pistilos colheita"
            );
            case RECOMENDACAO_MANEJO -> String.join(" ",
                    valor(planta != null ? planta.getNome() : null),
                    valor(planta != null && planta.getEstagio() != null ? planta.getEstagio().name() : null),
                    valor(descricao),
                    "cannabis manejo ação correção prevenção técnica aplicação timing estágio"
            );
            case DIAGNOSTICO_ESPECIALIZADO -> String.join(" ",
                    valor(planta != null ? planta.getNome() : null),
                    valor(planta != null && planta.getEstagio() != null ? planta.getEstagio().name() : null),
                    valor(descricao),
                    "cannabis diagnóstico técnico ph ec ppm runoff substrato sais fisiologia"
            );
            case DIAGNOSTICO_GERAL -> String.join(" ",
                    valor(planta != null ? planta.getNome() : null),
                    valor(planta != null && planta.getEstagio() != null ? planta.getEstagio().name() : null),
                    valor(descricao),
                    "cannabis sintomas manejo básico ambiente rega vigor"
            );
            case TRIAGEM_AMBIGUA -> valor(descricao);
        };
    }

    private void recarregarSeNecessario() {
        long fingerprintAtual = calcularFingerprintFontes();
        if (fingerprintAtual < 0 || fingerprintAtual == sourcesFingerprint) {
            return;
        }

        synchronized (this) {
            long revalidado = calcularFingerprintFontes();
            if (revalidado >= 0 && revalidado != sourcesFingerprint) {
                this.chunks = carregarChunks();
                this.sourcesFingerprint = revalidado;
            }
        }
    }

    private long calcularFingerprintFontes() {
        Path sourcesPath = Paths.get(sourcesDirPath);
        if (!Files.exists(sourcesPath)) {
            return -1L;
        }

        try (Stream<Path> stream = Files.walk(sourcesPath)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(this::isSupported)
                    .mapToLong(path -> {
                        try {
                            return Files.getLastModifiedTime(path).toMillis() ^ path.toString().hashCode();
                        } catch (IOException ex) {
                            return path.toString().hashCode();
                        }
                    })
                    .reduce(17L, (acc, valor) -> acc * 31L + valor);
        } catch (IOException ex) {
            return -1L;
        }
    }

    private String enriquecerConsulta(String consulta, DoctorChatMode modo, DoctorChatIntent intent) {
        StringBuilder enriquecida = new StringBuilder(valor(consulta));
        enriquecida.append(" ").append(expandirSinonimosDeTema(consulta));

        switch (intent) {
            case DEFINICAO -> enriquecida.append(" cannabis glossário conceito explicação sinais diferenças prática cultivo");
            case LEITURA_ESTAGIO -> enriquecida.append(" cannabis fenologia estágio fotoperíodo maturação preflower flowering harvest trichomes pistils");
            case RECOMENDACAO_MANEJO -> enriquecida.append(" cannabis manejo correção prevenção action plan safe timing stage restrictions");
            case DIAGNOSTICO_GERAL -> enriquecida.append(" cannabis sintomas sinais observação hipótese rival ambiente rega vigor");
            case DIAGNOSTICO_ESPECIALIZADO -> enriquecida.append(" cannabis correlação causal diagnóstico diferencial evidência ph ec ppm runoff salinidade fisiologia");
            case TRIAGEM_AMBIGUA -> enriquecida.append(" cannabis clarificação intenção pergunta contexto mínimo");
        }

        if (modo == DoctorChatMode.PRAGA) {
            enriquecida.append(" thrips mites whitefly aphids mealybugs damage scouting monitoring");
        }

        return enriquecida.toString().trim();
    }

    private String expandirSinonimosDeTema(String consulta) {
        String texto = normalizarBusca(consulta);
        StringBuilder sinonimos = new StringBuilder();

        if (containsAny(texto, "poda", "podar", "desfolha", "desfolhar", "amarras", "treinamento")) {
            sinonimos.append(" pruning prune topping fim lst low stress training high stress training canopy training defoliation supercropping");
        }

        if (containsAny(texto, "top", "topping", "fim")) {
            sinonimos.append(" topping fim manifold mainlining apical pruning");
        }

        if (containsAny(texto, "lst", "amarra", "canopy")) {
            sinonimos.append(" lst low stress training canopy management tie down bending training");
        }

        if (containsAny(texto, "desfolha", "folhas inferiores", "canelas limpas")) {
            sinonimos.append(" defoliation lollipopping lower pruning skirt cleanup");
        }

        if (containsAny(texto, "transplante", "raiz", "vaso")) {
            sinonimos.append(" transplant rootbound roots container pot size");
        }

        if (containsAny(texto, "praga", "tripe", "tripes", "acaro", "acaros", "mosca branca", "pulg", "cochonilha", "fungus gnat")) {
            sinonimos.append(" pests pest management integrated pest management thrips spider mites mites whitefly aphids mealybugs scale fungus gnats larvae eggs underside leaf damage scouting monitoring");
        }

        if (containsAny(texto, "deficiencia", "carencia", "toxicidade", "excesso", "nutricao", "nutriente", "fertiliz", "calcio", "magnesio", "nitrogenio", "fosforo", "potassio")) {
            sinonimos.append(" nutrient deficiency toxicity excess feeding fertilizer nutrition nitrogen phosphorus potassium calcium magnesium micronutrients lockout nutrient burn deficiency symptoms");
        }

        if (containsAny(texto, "rega", "regar", "substrato", "solo", "coco", "hidro", "drenagem", "runoff", "raiz")) {
            sinonimos.append(" watering irrigation substrate soil coco hydro drainage runoff root zone overwatering underwatering root health root oxygenation");
        }

        if (containsAny(texto, "clima", "temperatura", "umidade", "vpd", "calor", "frio", "ventilacao", "ventilação")) {
            sinonimos.append(" climate environment temperature humidity vpd airflow ventilation heat stress cold stress dry air microclimate");
        }

        if (containsAny(texto, "fungo", "mofo", "oidio", "oídio", "botrytis", "podridao", "podridão", "fumagina")) {
            sinonimos.append(" fungus fungal disease mold mildew powdery mildew botrytis bud rot sooty mold pathogen infection humidity related disease");
        }

        if (containsAny(texto, "colheita", "cura", "secagem", "flush", "lavagem", "tricoma", "tricomas", "pistilo", "pistilos")) {
            sinonimos.append(" harvest curing drying flush ripening trichomes pistils maturation amber cloudy milky harvest window terpene preservation");
        }

        if (containsAny(texto, "ph", "ec", "ppm", "salinidade", "sais", "condutividade", "lockout")) {
            sinonimos.append(" ph ec ppm conductivity salinity salts nutrient lockout runoff measurement reservoir feed chart");
        }

        return sinonimos.toString().trim();
    }

    private boolean containsAny(String texto, String... termos) {
        for (String termo : termos) {
            if (texto.contains(normalizarBusca(termo))) {
                return true;
            }
        }
        return false;
    }

    private ReferenceContextResult montarResultadoEmDuasCamadas(List<RankedChunk> ranqueados, String consulta, DoctorChatMode modo, QueryRoute route) {
        List<RankedChunk> positivos = ranqueados.stream()
                .filter(item -> item.score() > 0)
                .toList();

        RankedChunk ancoraBase = melhorChunkBaseGeral(!positivos.isEmpty() ? positivos : ranqueados);
        List<RankedChunk> camadaBase = selecionarCamadaBaseGeral(ranqueados, ancoraBase);
        List<RankedChunk> camadaRefino = selecionarCamadaRefino(ranqueados, modo, camadaBase, route);

        if (camadaBase.isEmpty() && camadaRefino.isEmpty()) {
            return new ReferenceContextResult(
                    "Nenhum trecho local com aderência forte foi encontrado para esta pergunta. Não trate isso como prova local; priorize o Codex, o contexto da planta e admita a lacuna se necessário.",
                    consulta,
                    List.of(),
                    List.of(),
                    false,
                    route.primaryTopic(),
                    route.preferredTopics(),
                    route.preferredLanguages(),
                    route.mandatoryBible(),
                        List.of(),
                        new CrossSourceSynthesis(
                            "não houve base geral forte recuperada para esta pergunta",
                            "também não apareceu refino específico com aderência suficiente",
                            "sem fontes selecionadas, não há convergência relevante a relatar",
                            "a resposta deve evitar certeza porque faltou base local forte",
                            "a busca aceitaria material em " + String.join(", ", route.preferredLanguages()) + ", mas nada aderente foi recuperado",
                            route.preferredTopics(),
                            route.preferredLanguages(),
                            List.of(),
                            List.of(),
                            "responder de forma conservadora e pedir dados ou pergunta mais específica"
                        )
            );
        }

        List<RankedChunk> combinados = Stream.concat(camadaBase.stream(), camadaRefino.stream())
                .distinct()
                .limit(CHUNKS_RETORNADOS)
                .toList();
        CrossSourceSynthesis synthesis = sintetizarRelacoes(combinados, camadaBase, camadaRefino, route);

        StringBuilder contexto = new StringBuilder();
        contexto.append(renderizarRoteamento(route));
        contexto.append("\n\n");
        contexto.append(renderizarRelacoesCruzadas(synthesis));
        contexto.append("\n\n");
        if (!camadaBase.isEmpty()) {
            contexto.append("[CAMADA 1 — GUIA GERAL (THE-BIBLE)]\n");
            contexto.append(renderizarCamada(camadaBase));
        }
        if (!camadaRefino.isEmpty()) {
            if (contexto.length() > 0) {
                contexto.append("\n\n---\n\n");
            }
            contexto.append("[CAMADA 2 — REFINO ESPECIALISTA]\n");
            contexto.append(renderizarCamada(camadaRefino));
        }

        List<ReferenceSource> sourceDetails = agregarFontesPorCamada(camadaBase, camadaRefino);

        List<String> fontes = sourceDetails.stream()
            .map(ReferenceSource::relativePath)
                .distinct()
                .toList();

        List<String> debug = new ArrayList<>();
        camadaBase.forEach(item -> debug.add("geral:" + item.chunk().sourceId() + "=" + item.score()));
        camadaRefino.forEach(item -> debug.add("refino:" + item.chunk().sourceId() + "=" + item.score()));

        boolean groundingForte = combinados.stream().anyMatch(item -> item.score() >= 10);
        return new ReferenceContextResult(
            contexto.toString(),
            consulta,
            fontes,
            debug,
            groundingForte,
            route.primaryTopic(),
            route.preferredTopics(),
            route.preferredLanguages(),
            route.mandatoryBible(),
            sourceDetails,
            synthesis
        );
    }

    private RankedChunk melhorChunkBaseGeral(List<RankedChunk> ranqueados) {
        return ranqueados.stream()
                .filter(item -> "base-geral".equals(item.chunk().sourceCategory()))
                .max(Comparator.comparingInt(RankedChunk::score))
                .orElse(null);
    }

    private List<RankedChunk> selecionarCamadaBaseGeral(List<RankedChunk> ranqueados, RankedChunk ancoraBase) {
        List<RankedChunk> camada = new ArrayList<>();
        if (ancoraBase != null) {
            camada.add(ancoraBase);
        }

        ranqueados.stream()
                .filter(item -> "base-geral".equals(item.chunk().sourceCategory()))
                .filter(item -> !camada.contains(item))
                .filter(item -> item.score() > 0)
            .limit(Math.max(0, CHUNKS_CAMADA_BASE - camada.size()))
                .forEach(camada::add);

        return camada;
    }

    private List<RankedChunk> selecionarCamadaRefino(List<RankedChunk> ranqueados, DoctorChatMode modo, List<RankedChunk> camadaBase) {
        String consultaInferida = ranqueados.stream()
                .map(item -> item.chunk().content())
                .collect(Collectors.joining(" "));
        QueryRoute rota = inferirRota(consultaInferida, modo, mapIntentFromMode(modo, consultaInferida));
        return selecionarCamadaRefino(ranqueados, modo, camadaBase, rota);
    }

    private List<RankedChunk> selecionarCamadaRefino(List<RankedChunk> ranqueados, DoctorChatMode modo, List<RankedChunk> camadaBase, QueryRoute route) {
        List<RankedChunk> camada = new ArrayList<>();
        java.util.Map<String, Integer> contagemPorFonte = new java.util.LinkedHashMap<>();

        List<RankedChunk> candidatos = ordenarCandidatosPorRota(ranqueados.stream()
                .filter(item -> item.score() > 0)
                .filter(item -> !camadaBase.contains(item))
                .filter(item -> !"base-geral".equals(item.chunk().sourceCategory()))
            .toList(), route);

        preencherCamadaRefino(camada, contagemPorFonte, candidatos.stream().filter(item -> combinaComRota(item.chunk(), route)).toList(), modo, camadaBase.size());

        if (camada.size() < CHUNKS_RETORNADOS - camadaBase.size()) {
            preencherCamadaRefino(camada, contagemPorFonte, candidatos, modo, camadaBase.size());
        }

        return camada;
    }

    private List<RankedChunk> ordenarCandidatosPorRota(List<RankedChunk> candidatos, QueryRoute route) {
        return candidatos.stream()
                .sorted(Comparator
                        .comparingInt((RankedChunk item) -> prioridadePorTopico(item.chunk(), route)).reversed()
                        .thenComparingInt(item -> prioridadePorIdioma(item.chunk(), route)).reversed()
                        .thenComparingInt(item -> prioridadePorTipoFonte(item.chunk())).reversed()
                        .thenComparingInt(RankedChunk::score).reversed())
                .toList();
    }

    private void preencherCamadaRefino(List<RankedChunk> camada, Map<String, Integer> contagemPorFonte, List<RankedChunk> candidatos, DoctorChatMode modo, int tamanhoCamadaBase) {
        for (RankedChunk item : candidatos) {
            if (camada.size() >= CHUNKS_RETORNADOS - tamanhoCamadaBase || camada.contains(item)) {
                continue;
            }

            int maxPorFonte = modo == DoctorChatMode.PRAGA && "especialista-pragas".equals(item.chunk().sourceCategory()) ? 3 : 2;
            int atual = contagemPorFonte.getOrDefault(item.chunk().sourceId(), 0);
            if (atual < maxPorFonte) {
                camada.add(item);
                contagemPorFonte.put(item.chunk().sourceId(), atual + 1);
            }
        }
    }

    private String renderizarCamada(List<RankedChunk> camada) {
        return camada.stream()
                .map(item -> "Fonte: " + item.chunk().sourceName()
                        + " | caminho: " + item.chunk().relativePath()
                        + " | idioma: " + item.chunk().language()
                        + " | tópico: " + item.chunk().parentTopic()
                        + " | categoria: " + item.chunk().sourceCategory()
                        + " | relevância: " + item.score()
                        + "\nTrecho: " + item.chunk().content())
                .collect(Collectors.joining("\n\n---\n\n"));
    }

    private String renderizarRoteamento(QueryRoute route) {
        return "[ROTEAMENTO SEMÂNTICO]\n"
                + "tema_principal: " + valor(route.primaryTopic()) + "\n"
                + "topicos_prioritarios: " + String.join(", ", route.preferredTopics()) + "\n"
                + "idiomas_habilitados: " + String.join(", ", route.preferredLanguages()) + "\n"
                + "fonte_base_obrigatoria: " + route.mandatoryBible();
    }

    private String renderizarRelacoesCruzadas(CrossSourceSynthesis synthesis) {
        return "[RELAÇÕES CRUZADAS SUGERIDAS]\n"
                + "- fundamento_geral: " + synthesis.foundationSummary() + "\n"
                + "- refino_tematico: " + synthesis.refinementSummary() + "\n"
                + "- convergencia: " + synthesis.convergenceSummary() + "\n"
                + "- divergencia: " + synthesis.divergenceSummary() + "\n"
                + "- idioma_e_escopo: " + synthesis.languageSummary();
    }

    private String carregarPromptBase() {
        Path path = Paths.get(promptFilePath);
        if (!Files.exists(path)) {
            return PROMPT_BASE_FALLBACK;
        }

        try {
            String conteudo = normalizar(Files.readString(path, StandardCharsets.UTF_8));
            return conteudo.isBlank() ? PROMPT_BASE_FALLBACK : conteudo;
        } catch (IOException ex) {
            return PROMPT_BASE_FALLBACK;
        }
    }

    private List<KnowledgeChunk> carregarChunks() {
        Path sourcesPath = Paths.get(sourcesDirPath);
        if (!Files.exists(sourcesPath)) {
            return List.of();
        }

        try (Stream<Path> stream = Files.walk(sourcesPath)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(this::isSupported)
                    .sorted()
                    .flatMap(this::extrairChunks)
                    .toList();
        } catch (IOException ex) {
            return List.of();
        }
    }

    private boolean isSupported(Path path) {
        String lower = path.getFileName().toString().toLowerCase(Locale.ROOT);
        return EXTENSOES_SUPORTADAS.stream().anyMatch(lower::endsWith);
    }

    private Stream<KnowledgeChunk> extrairChunks(Path path) {
        String texto = extrairTexto(path);
        if (texto.isBlank()) {
            return Stream.empty();
        }

        List<KnowledgeChunk> resultado = new ArrayList<>();
        StringBuilder atual = new StringBuilder();
        for (String bloco : quebrarBlocos(texto)) {
            if (bloco.isBlank()) {
                continue;
            }

            if (atual.length() > 0 && atual.length() + bloco.length() + 2 > TAMANHO_MAXIMO_CHUNK) {
                resultado.add(criarChunk(path, atual.toString()));
                atual.setLength(0);
            }

            if (atual.length() > 0) {
                atual.append("\n\n");
            }
            atual.append(bloco);
        }

        if (atual.length() > 0) {
            resultado.add(criarChunk(path, atual.toString()));
        }

        return resultado.stream();
    }

    private List<String> quebrarBlocos(String texto) {
        return Stream.of(texto.split("\\R\\s*\\R"))
                .map(this::normalizar)
                .filter(valor -> !valor.isBlank())
                .toList();
    }

    private KnowledgeChunk criarChunk(Path path, String texto) {
        String resumido = texto.length() > TAMANHO_MAXIMO_TRECHO
                ? texto.substring(0, TAMANHO_MAXIMO_TRECHO) + "..."
                : texto;
        SourceMetadata metadata = construirMetadados(path);
        return new KnowledgeChunk(
                metadata.sourceId(),
                metadata.sourceName(),
                metadata.relativePath(),
                metadata.parentTopic(),
                metadata.language(),
                metadata.sourceType(),
                metadata.sourceCategory(),
                resumido,
                tokenizar(metadata.sourceName() + " " + metadata.relativePath() + " " + metadata.parentTopic() + " " + resumido),
                metadata.tags()
        );
    }

    private String extrairTexto(Path path) {
        try {
            String lower = path.getFileName().toString().toLowerCase(Locale.ROOT);
            if (lower.endsWith(".txt") || lower.endsWith(".md")) {
                return normalizar(Files.readString(path, StandardCharsets.UTF_8));
            }
            return normalizar(tika.parseToString(path));
        } catch (Exception ex) {
            return "";
        }
    }

    private int pontuar(KnowledgeChunk chunk, Set<String> termos, DoctorChatMode modo, DoctorChatIntent intent, Planta planta, QueryRoute route) {
        if (termos.isEmpty()) {
            return 0;
        }

        int score = 0;
        String conteudoNormalizado = normalizarBusca(chunk.content());
        int correspondencias = 0;
        for (String termo : termos) {
            if (chunk.tokens().contains(termo)) {
                score += termo.length() >= 7 ? 4 : 2;
                correspondencias++;
            }
            if (conteudoNormalizado.contains(termo)) {
                score += 1;
            }
        }

        if (correspondencias == 0) {
            return 0;
        }

        score += Math.min(correspondencias, 6) * 2;
        score += bonusPorModo(chunk, modo);
        score += bonusPorIntent(chunk, intent, route);
        score += bonusPorEstagio(chunk, planta);
        score += bonusPorRota(chunk, route);

        if (chunk.tokens().contains("cannabis")) {
            score += 5;
        }
        if (chunk.tokens().contains("grow") || chunk.tokens().contains("bible")) {
            score += 2;
        }
        return score;
    }

    private int bonusPorRota(KnowledgeChunk chunk, QueryRoute route) {
        if (route == null) {
            return 0;
        }

        int score = 0;
        if (route.mandatoryBible() && "bible".equals(chunk.sourceType())) {
            score += 12;
        }
        if (!route.preferredTopics().isEmpty() && combinaComRota(chunk, route)) {
            score += 8;
        }
        score += prioridadePorIdioma(chunk, route);
        score += prioridadePorTipoFonte(chunk);
        return score;
    }

    private int prioridadePorIdioma(KnowledgeChunk chunk, QueryRoute route) {
        if (chunk == null || route == null || route.preferredLanguages().isEmpty()) {
            return 0;
        }

        int index = route.preferredLanguages().indexOf(chunk.language());
        if (index < 0) {
            return 0;
        }
        return switch (index) {
            case 0 -> 5;
            case 1 -> 3;
            case 2 -> 1;
            default -> 0;
        };
    }

    private int prioridadePorTipoFonte(KnowledgeChunk chunk) {
        if (chunk == null) {
            return 0;
        }
        return switch (chunk.sourceType()) {
            case "bible" -> 6;
            case "guide" -> 4;
            case "specialist" -> 3;
            case "paper" -> 2;
            default -> 0;
        };
    }

    private int prioridadePorTopico(KnowledgeChunk chunk, QueryRoute route) {
        if (chunk == null || route == null || route.preferredTopics().isEmpty()) {
            return 0;
        }
        if (route.preferredTopics().contains(chunk.parentTopic())) {
            return 6;
        }
        if (route.preferredTopics().stream().anyMatch(topico -> chunk.tags().contains(normalizarBusca(topico).replace('_', ' ')))) {
            return 3;
        }
        return 0;
    }

    private int bonusPorIntent(KnowledgeChunk chunk, DoctorChatIntent intent, QueryRoute route) {
        if (chunk == null || intent == null) {
            return 0;
        }
        return switch (intent) {
            case DEFINICAO -> "base-geral".equals(chunk.sourceCategory()) && "geral".equals(route.primaryTopic()) ? 6 : route.preferredTopics().contains(chunk.parentTopic()) ? 5 : 1;
            case LEITURA_ESTAGIO -> "ciclos_fotoperiodo".equals(chunk.parentTopic()) ? 7 : "extracao".equals(chunk.parentTopic()) ? 4 : 1;
            case RECOMENDACAO_MANEJO -> route.preferredTopics().contains(chunk.parentTopic()) ? 6 : 1;
            case DIAGNOSTICO_ESPECIALIZADO -> "nutricao_fertilizacao".equals(chunk.parentTopic()) ? 7 : route.preferredTopics().contains(chunk.parentTopic()) ? 5 : 1;
            case DIAGNOSTICO_GERAL -> route.preferredTopics().contains(chunk.parentTopic()) ? 5 : 1;
            case TRIAGEM_AMBIGUA -> 0;
        };
    }

    private int bonusPorModo(KnowledgeChunk chunk, DoctorChatMode modo) {
        return switch (modo) {
            case PRAGA -> "especialista-pragas".equals(chunk.sourceCategory()) ? 9 : "base-geral".equals(chunk.sourceCategory()) ? 2 : 0;
            case CONHECIMENTO_GERAL -> "base-geral".equals(chunk.sourceCategory()) ? 4 : 1;
            case AVALIACAO_BASICA, AVALIACAO_TECNICA, AUTO -> "base-geral".equals(chunk.sourceCategory()) ? 3 : "especialista-pragas".equals(chunk.sourceCategory()) ? 1 : 0;
        };
    }

    private int bonusPorEstagio(KnowledgeChunk chunk, Planta planta) {
        if (planta == null || planta.getEstagio() == null) {
            return 0;
        }
        String estagioNormalizado = normalizarBusca(planta.getEstagio().name().replace('_', ' '));
        return normalizarBusca(chunk.content()).contains(estagioNormalizado) ? 6 : 0;
    }

    private String detectarCategoriaFonte(String sourceName, String parentTopic, String sourceType) {
        String lower = sourceName.toLowerCase(Locale.ROOT);
        String topic = valor(parentTopic).toLowerCase(Locale.ROOT);
        if ("bible".equals(sourceType) || lower.contains("bible")) {
            return "base-geral";
        }
        if (topic.contains("praga") || topic.contains("pest") || lower.contains("praga") || lower.contains("pest") || lower.contains("thrip") || lower.contains("mite") || lower.contains("acarine")) {
            return "especialista-pragas";
        }
        return "local";
    }

    private SourceMetadata construirMetadados(Path path) {
        Path root = Paths.get(sourcesDirPath);
        Path relative = root.relativize(path);
        String relativePath = relative.toString().replace('\\', '/');
        String sourceName = path.getFileName().toString();
        String parentTopic = detectarTopicoDaPasta(relative);
        String language = detectarIdioma(sourceName);
        String sourceType = detectarTipoFonte(sourceName, parentTopic);
        String sourceCategory = detectarCategoriaFonte(sourceName, parentTopic, sourceType);
        Set<String> tags = tokenizar(relativePath.replace('/', ' ') + " " + parentTopic + " " + sourceName);
        return new SourceMetadata(relativePath, sourceName, relativePath, parentTopic, language, sourceType, sourceCategory, tags);
    }

    private String detectarTopicoDaPasta(Path relative) {
        if (relative == null || relative.getNameCount() <= 1) {
            return "geral";
        }

        for (int i = 0; i < relative.getNameCount() - 1; i++) {
            String segmento = relative.getName(i).toString();
            if (!PASTAS_IGNORADAS_ROTEAMENTO.contains(segmento)) {
                return segmento;
            }
        }
        return "geral";
    }

    private String detectarIdioma(String sourceName) {
        String lower = sourceName.toLowerCase(Locale.ROOT);
        if (lower.startsWith("pt-") || lower.startsWith("pt_")) {
            return "pt";
        }
        if (lower.startsWith("en-") || lower.startsWith("en_")) {
            return "en";
        }
        return "multi";
    }

    private String detectarTipoFonte(String sourceName, String parentTopic) {
        String lower = sourceName.toLowerCase(Locale.ROOT);
        if (lower.contains("bible")) {
            return "bible";
        }
        if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.contains("guia")) {
            return "guide";
        }
        if (lower.contains("especialista") || lower.contains("embrapa")) {
            return "specialist";
        }
        if (valor(parentTopic).toLowerCase(Locale.ROOT).contains("extracao")) {
            return "specialist";
        }
        return "paper";
    }

    private DoctorChatIntent mapIntentFromMode(DoctorChatMode modo, String descricao) {
        if (modo == null) {
            return DoctorChatIntent.TRIAGEM_AMBIGUA;
        }
        String texto = normalizarBusca(descricao);
        if (containsAny(texto, "tricoma", "pistilo", "colheita", "floracao", "flora", "vegetativo", "germinacao")) {
            return DoctorChatIntent.LEITURA_ESTAGIO;
        }
        return switch (modo) {
            case CONHECIMENTO_GERAL -> DoctorChatIntent.DEFINICAO;
            case AVALIACAO_TECNICA -> DoctorChatIntent.DIAGNOSTICO_ESPECIALIZADO;
            case AVALIACAO_BASICA, PRAGA -> DoctorChatIntent.DIAGNOSTICO_GERAL;
            case AUTO -> DoctorChatIntent.TRIAGEM_AMBIGUA;
        };
    }

    private QueryRoute inferirRota(String consulta, DoctorChatMode modo) {
        return inferirRota(consulta, modo, mapIntentFromMode(modo, consulta));
    }

    private QueryRoute inferirRota(String consulta, DoctorChatMode modo, DoctorChatIntent intent) {
        String texto = normalizarBusca(consulta);
        LinkedHashSet<String> topics = new LinkedHashSet<>();

        if (intent == DoctorChatIntent.LEITURA_ESTAGIO) {
            topics.add("ciclos_fotoperiodo");
        }
        if (containsAny(texto, "praga", "pest", "thrip", "mites", "mite", "acaro", "tripe", "whitefly", "aphid", "cochonilha")) {
            topics.add("pragas_manejo");
        }
        if (containsAny(texto, "nutricao", "fertiliz", "deficien", "nitrogen", "phosphorus", "potassium", "calcio", "magnesio", "lockout", "ph", "ec", "ppm", "runoff")) {
            topics.add("nutricao_fertilizacao");
        }
        if (containsAny(texto, "fotoperiodo", "photoperiod", "automatica", "fotoperiodica", "luz", "flora", "vegetativo", "tricoma", "pistilo", "colheita")) {
            topics.add("ciclos_fotoperiodo");
        }
        if (containsAny(texto, "poda", "treinamento", "lst", "topping", "canopy", "supercropping", "pruning")) {
            topics.add("arquitetura_poda_treinamento");
        }
        if (containsAny(texto, "extracao", "extract", "live resin", "colheita", "resin", "fitoquimica")) {
            topics.add("extracao");
        }
        if (topics.isEmpty()) {
            topics.add("geral");
        }

        LinkedHashSet<String> languages = new LinkedHashSet<>();
        if (containsAny(texto, "em ingles", "english", "paper", "study")) {
            languages.add("en");
            languages.add("pt");
            languages.add("multi");
        } else if (containsAny(texto, "em portugues", "portugues", "pt-br")) {
            languages.add("pt");
            languages.add("en");
            languages.add("multi");
        } else {
            languages.add("pt");
            languages.add("en");
            languages.add("multi");
        }

        boolean mandatoryBible = intent == DoctorChatIntent.DEFINICAO && topics.contains("geral");
        return new QueryRoute(topics.iterator().next(), List.copyOf(topics), List.copyOf(languages), mandatoryBible);
    }

    private CrossSourceSynthesis sintetizarRelacoes(List<RankedChunk> combinados, List<RankedChunk> camadaBase, List<RankedChunk> camadaRefino, QueryRoute route) {
        List<String> baseSources = camadaBase.stream()
            .map(item -> item.chunk().relativePath())
            .distinct()
            .toList();
        List<String> refinementSources = camadaRefino.stream()
            .map(item -> item.chunk().relativePath())
            .distinct()
            .toList();

        String foundation = camadaBase.isEmpty()
            ? "nenhuma âncora geral aderente foi encontrada; trate o restante com cautela"
            : "a leitura começa pelo the-bible e pelo guia geral antes de fechar qualquer conclusão específica";

        String refinement = camadaRefino.isEmpty()
            ? "não houve material específico suficientemente aderente para refinar além da base geral"
            : "o refinamento prioriza o tópico " + valor(route != null ? route.primaryTopic() : "geral") + " com complemento das fontes temáticas mais fortes";

        long fontesDistintas = combinados.stream().map(item -> item.chunk().sourceId()).distinct().count();
        String convergence = fontesDistintas >= 3
            ? "há diversidade suficiente de fontes para procurar repetição de padrão antes de responder"
            : "a resposta deve apoiar-se mais na consistência interna do material disponível do que em ampla convergência entre fontes";

        boolean temGuide = camadaRefino.stream().anyMatch(item -> "guide".equals(item.chunk().sourceType()));
        boolean temPaper = camadaRefino.stream().anyMatch(item -> "paper".equals(item.chunk().sourceType()));
        String divergence = temGuide && temPaper
            ? "se guia prático e paper técnico divergirem, preserve contexto e limite de aplicação em vez de forçar consenso"
            : "se houver limitação ou ressalva em uma fonte específica, ela deve refinar a base geral sem invalidá-la automaticamente";

        LinkedHashSet<String> idiomas = combinados.stream()
            .map(item -> item.chunk().language())
            .filter(valor -> valor != null && !valor.isBlank())
            .collect(Collectors.toCollection(LinkedHashSet::new));

        String language = idiomas.isEmpty()
            ? "sem indicação clara de idioma útil nas fontes selecionadas"
            : "fontes em " + String.join(", ", idiomas) + " foram aceitas; quando o EN trouxer melhor densidade técnica, ele deve complementar a resposta em português";

        String practicalAction = switch (valor(route != null ? route.primaryTopic() : "geral")) {
            case "pragas_manejo" -> "comparar padrão do dano com o guia geral e confirmar verso/anverso, ovos, teia, melada ou progressão antes de fechar espécie de praga";
            case "nutricao_fertilizacao" -> "cruzar sintoma com alimentação, pH, EC, runoff e estágio antes de concluir deficiência ou excesso";
            case "ciclos_fotoperiodo" -> "validar se a resposta da planta faz sentido para fotoperíodo, genética e estágio atual antes de propor ajuste de luz";
            case "arquitetura_poda_treinamento" -> "usar o guia geral para objetivo da técnica e a fonte temática para definir timing, intensidade e recuperação esperada";
            case "extracao" -> "separar claramente orientação de cultivo da orientação de extração, usando o geral como contexto e o tópico como detalhe operacional";
            default -> "usar o the-bible como fundamento e completar apenas com a fonte temática que realmente acrescentar contexto útil";
        };

        return new CrossSourceSynthesis(
            foundation,
            refinement,
            convergence,
            divergence,
            language,
            route != null ? route.preferredTopics() : List.of("geral"),
            route != null ? route.preferredLanguages() : List.of("pt", "en", "multi"),
            baseSources,
            refinementSources,
            practicalAction
        );
    }

    private boolean combinaComRota(KnowledgeChunk chunk, QueryRoute route) {
        if (route == null || route.preferredTopics().isEmpty()) {
            return true;
        }

        if (route.preferredTopics().contains(chunk.parentTopic())) {
            return true;
        }

        return route.preferredTopics().stream().anyMatch(topico -> chunk.tags().contains(normalizarBusca(topico).replace('_', ' ')) || chunk.tags().contains(normalizarBusca(topico).replace("_", "")));
    }

    private List<ReferenceSource> agregarFontesPorCamada(List<RankedChunk> camadaBase, List<RankedChunk> camadaRefino) {
        Map<String, ReferenceSource> agregadas = new LinkedHashMap<>();
        agregarCamada(agregadas, camadaBase, "geral");
        agregarCamada(agregadas, camadaRefino, "refino");
        return List.copyOf(agregadas.values());
    }

    private void agregarCamada(Map<String, ReferenceSource> agregadas, List<RankedChunk> camada, String layer) {
        for (RankedChunk item : camada) {
            String key = item.chunk().sourceId() + "|" + layer;
            ReferenceSource atual = agregadas.get(key);
            if (atual == null) {
                agregadas.put(key, new ReferenceSource(
                        item.chunk().sourceId(),
                        item.chunk().sourceName(),
                        item.chunk().relativePath(),
                        item.chunk().sourceCategory(),
                        item.chunk().parentTopic(),
                        item.chunk().language(),
                        item.chunk().sourceType(),
                        item.score(),
                        layer
                ));
            } else {
                agregadas.put(key, new ReferenceSource(
                        atual.sourceId(),
                        atual.sourceName(),
                        atual.relativePath(),
                        atual.sourceCategory(),
                        atual.parentTopic(),
                        atual.language(),
                        atual.sourceType(),
                        atual.score() + item.score(),
                        atual.layer()
                ));
            }
        }
    }

    private Set<String> tokenizar(String texto) {
        return TOKEN_SPLIT.splitAsStream(normalizarBusca(texto))
                .map(String::trim)
                .filter(token -> token.length() >= 3)
                .filter(token -> !STOPWORDS.contains(token))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String normalizarBusca(String texto) {
        String normalizado = Normalizer.normalize(valor(texto), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return normalizado.toLowerCase(Locale.ROOT);
    }

    private String normalizar(String texto) {
        return valor(texto).replace('\u0000', ' ').replaceAll("[ \\t\\x0B\\f\\r]+", " ").replaceAll("\\n{3,}", "\n\n").trim();
    }

    private String valor(String valor) {
        return valor == null ? "" : valor;
    }

        public record ReferenceContextResult(
            String renderedContext,
            String query,
            List<String> sourceNames,
            List<String> debug,
            boolean strongMatch,
            String routeTopic,
            List<String> routeTopics,
            List<String> preferredLanguages,
            boolean mandatoryBible,
            List<ReferenceSource> sourceDetails,
            CrossSourceSynthesis crossSourceSynthesis
        ) {
        }

        public record ReferenceSource(
            String sourceId,
            String sourceName,
            String relativePath,
            String sourceCategory,
            String parentTopic,
            String language,
            String sourceType,
            int score,
            String layer
        ) {
        }

        private record KnowledgeChunk(
            String sourceId,
            String sourceName,
            String relativePath,
            String parentTopic,
            String language,
            String sourceType,
            String sourceCategory,
            String content,
            Set<String> tokens,
            Set<String> tags
        ) {
        }

        private record SourceMetadata(
            String sourceId,
            String sourceName,
            String relativePath,
            String parentTopic,
            String language,
            String sourceType,
            String sourceCategory,
            Set<String> tags
        ) {
        }

        private record QueryRoute(
            String primaryTopic,
            List<String> preferredTopics,
            List<String> preferredLanguages,
            boolean mandatoryBible
        ) {
    }

        public record CrossSourceSynthesis(
            String foundationSummary,
            String refinementSummary,
            String convergenceSummary,
            String divergenceSummary,
            String languageSummary,
            List<String> dominantTopics,
            List<String> selectedLanguages,
            List<String> baseSources,
            List<String> refinementSources,
            String practicalActionHint
    ) {
    }

    private record RankedChunk(KnowledgeChunk chunk, int score) {
    }
}