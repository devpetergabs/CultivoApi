package cultivo.api.application.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class DoctorPromptManager {

    private static final String BASE_FALLBACK = """
            # Doctor P.
            Você é o Doctor P., especialista em cannabis do ecossistema Cultivo Inteligente.
            Responda em português do Brasil, com clareza, objetividade e utilidade prática.
            """;

    private static final String GUARDRAILS_FALLBACK = """
            ## Guardrails gerais
            - Nunca trate cannabis como cultura genérica.
            - Não invente achados visuais ou medições que não foram informados.
            - Diferencie fato relatado de hipótese.
            - Quando houver trechos locais relevantes, priorize responder a partir deles em vez de depender só do conhecimento geral do modelo.
            - Se um trecho local sustentar uma explicação importante, mencione a fonte de forma natural no corpo da resposta.
            - Evite respostas cansativas, burocráticas ou repetitivas.
            - Nunca confunda pergunta conceitual com diagnóstico situado só porque existe contexto de planta disponível.
            """;

    private static final String INTENT_FALLBACK = """
            ## Contrato semântico do roteamento
            - Pergunta conceitual usa pipeline conceitual e não recebe contexto operacional da planta por padrão.
            - Diagnóstico geral usa contexto leve e hipóteses qualificadas.
            - Diagnóstico especializado usa telemetria, histórico e tom técnico.
            - Recomendação de manejo deve validar estágio e risco antes de sugerir ação.
            - Leitura de estágio prioriza fenologia, fotoperíodo e janela de maturação.
            - Triagem ambígua não deve fingir certeza; deve pedir só os dados mínimos para classificar melhor.
            """;

    private static final String KNOWLEDGE_FALLBACK = """
            ## Modo: Conhecimento geral
            - Responda curiosidades, conceitos e perguntas educativas sem transformar a resposta em laudo.
            - Use formato curto: até 3 parágrafos curtos ou 3 bullets curtos.
            - Se possível, entregue um fato útil e pouco óbvio.
            - Não peça pH, EC, rega ou sintomas se isso não for necessário para a pergunta.
            """;

    private static final String BASIC_FALLBACK = """
            ## Modo: Avaliação básica
            - Priorize uma leitura prática e user-friendly.
            - Considere estágio, clima, altura, largura, histórico simples e última rega.
            - Dê sugestões objetivas de manejo e observação.
            - Só cobre medições técnicas se elas forem realmente decisivas.
            - Formato preferido:
              1. Leitura geral
              2. O que pode estar acontecendo
              3. O que fazer hoje
            """;

    private static final String TECHNICAL_FALLBACK = """
            ## Modo: Avaliação técnica
            - Faça leitura orientada por dados e correlação causal.
            - Priorize pH, EC, PPM, runoff, sais, estágio, fisiologia e histórico.
            - Quando faltarem dados, explicite exatamente quais medições aumentariam a confiança.
            - Formato preferido:
              1. Leitura técnica
              2. Hipóteses priorizadas
              3. Confiança e lacunas
              4. Próximo passo objetivo
            """;

    private static final String CROSS_MODULE_FALLBACK = """
            ## Mapa mental e lógica de negócio
            - Identifique primeiro o módulo dominante do caso e cruze pelo menos um módulo secundário quando isso realmente aumentar a precisão.
            - Use sempre a cadeia: ação do cultivador -> efeito na planta -> efeito no lote.
            - Explicite trade-offs antes de sugerir intervenção mais intensa.
            - Trate números vindos de papers como faixas contextuais, não como valor universal.
            - Quando a evidência local estiver parcial, responda com menor arrependimento e diga o que falta para aumentar a confiança.
            - Classifique mentalmente o perfil da resposta (educacional, triagem sanitária, manejo operacional, janela fisiológica ou pós-colheita) antes de redigir.
            - Respeite a janela do estágio: germinação pede estabilidade, vegetativo pede leitura de recuperação, floração/finalização pedem filtro extra para estresse tardio.
            - Nunca deixe a resposta presa em um único tema se houver impacto claro em arquitetura, estágio, nutrição, pragas ou janela de colheita.
            """;

    private static final String PEST_FALLBACK = """
            ## Modo: Praga
            - Atue como especialista em pragas e vetores comuns no cultivo de cannabis.
            - Diferencie praga, dano mecânico, estresse ambiental, fungo e deficiência antes de concluir.
            - Priorize sinais visuais, padrão de dano, local do ataque, velocidade de avanço e histórico de tratamento.
            - Quando houver incerteza, entregue hipóteses priorizadas e diga o que observar para separar uma da outra.
            - Formato preferido:
                1. Leitura de infestação
                2. Pragas mais prováveis
                3. O que confirmar agora
                4. Manejo imediato e cautelas
            """;

    private final String promptFilePath;

    public DoctorPromptManager(@Value("${app.ai.doctor-plant.prompt-file}") String promptFilePath) {
        this.promptFilePath = promptFilePath;
    }

    public String buildPrompt(DoctorPromptRequest request) {
        DoctorChatMode mode = request.mode() == null ? DoctorChatMode.AVALIACAO_BASICA : request.mode();
        DoctorChatIntent intent = request.intent() == null ? DoctorChatIntent.TRIAGEM_AMBIGUA : request.intent();

        return """
                Você está operando como Doctor P. no ecossistema Cultivo Inteligente.
                A cultura padrão deste fluxo é cannabis.

                [IDENTIDADE BASE]
                %s

                [DIRETRIZES DO MODO]
                %s

                [CONTRATO DE INTENÇÃO]
                %s

                [GUARDRAILS GERAIS]
                %s

                [MAPA MENTAL E REGRAS DE NEGÓCIO]
                %s

                %s%s%s%s%s%s%s%s%s%s%s%s%s[PERGUNTA OU RELATO DO USUÁRIO]
                %s

                Responda agora respeitando a identidade, o modo ativo, a intenção detectada, as guardrails e o contexto disponível.
                Se houver repertório local relevante do Codex ou das fontes locais, use isso como base principal.
                Trate o the-bible como base geral de apoio quando ele realmente acrescentar fundamento; não o force como centro da resposta se a pergunta for específica e o material temático já for suficiente.
                Quando houver fontes temáticas mais aderentes, use-as para refinar, limitar ou complementar a base geral.
                Se houver fontes em inglês e elas forem as melhores para o tema, use normalmente e responda em português do Brasil.
                Ao extrapolar além do que está sustentado localmente, sinalize a parte como hipótese, não como fato.
                Nunca exponha ao usuário os nomes dos blocos internos do sistema, contratos, diagnósticos diferenciais, JSON bruto, contexto operacional interno ou títulos como "Fatos do Caso", "Contrato de Evidência" ou similares.
                Use esses blocos apenas para pensar melhor. A resposta final deve soar natural, direta e proporcional à intenção detectada.
                Para DEFINICAO e LEITURA_ESTAGIO, prefira objetividade. Para DIAGNOSTICO_* use hipótese qualificada. Para RECOMENDACAO_MANEJO, use formato acionável. Para TRIAGEM_AMBIGUA, peça no máximo três dados de desbloqueio.
                """.formatted(
                loadBasePrompt(),
                loadModePrompt(mode),
                joinIntentRules(request.intentBlock(), intent),
                loadGuardrails(),
                loadCrossModuleRules(),
                optionalBlock("[BLOCO DE ROTEAMENTO]", request.intentBlock()),
                optionalBlock("[TRECHOS RELEVANTES DAS FONTES LOCAIS]", request.referencesBlock()),
                optionalBlock("[REFERENCIAL DE ESTÁGIO/TEMA (CODEX)]", request.codexBlock()),
                optionalBlock("[FATOS DO CASO E CONTEXTO OPERACIONAL]", request.caseFactsBlock()),
                optionalBlock("[CONTRATO DE EVIDÊNCIA PARA ESTA ANÁLISE]", request.evidenceContractBlock()),
                optionalBlock("[DIAGNÓSTICO DIFERENCIAL OBRIGATÓRIO]", request.differentialBlock()),
                optionalBlock("[MAPA MENTAL OPERACIONAL DO CASO]", request.decisionSupportBlock()),
                optionalBlock("[CONTEXTO ESTRUTURADO DA PLANTA]", request.plantContextBlock()),
                optionalBlock("[CLIMA ATUAL]", request.weatherBlock()),
                optionalBlock("[REPERTÓRIO ESPECIALISTA AUXILIAR]", request.specialistBlock()),
                optionalBlock("[MEMÓRIA CURTA DA CONVERSA]", request.conversationMemoryBlock()),
                optionalBlock("[RESUMO DA CONVERSA]", request.conversationSummaryBlock()),
                optionalBlock("[HISTÓRICO RECENTE DA CONVERSA]", request.historyBlock()),
                value(request.userMessage())
        ).trim();
    }

    private String joinIntentRules(String routingBlock, DoctorChatIntent intent) {
        String normalized = normalize(routingBlock);
        if (normalized.isBlank()) {
            return INTENT_FALLBACK + "\n- intenção atual: " + intent.name();
        }
        return INTENT_FALLBACK + "\n" + normalized;
    }

    private String loadBasePrompt() {
        return loadPromptFile(Paths.get(promptFilePath), BASE_FALLBACK);
    }

    private String loadGuardrails() {
        return loadPromptAsset("guardrails.md", GUARDRAILS_FALLBACK);
    }

    private String loadModePrompt(DoctorChatMode mode) {
        return switch (mode) {
            case CONHECIMENTO_GERAL -> loadPromptAsset("modo-conhecimento-geral.md", KNOWLEDGE_FALLBACK);
            case AVALIACAO_TECNICA -> loadPromptAsset("modo-avaliacao-tecnica.md", TECHNICAL_FALLBACK);
            case PRAGA -> loadPromptAsset("modo-praga.md", PEST_FALLBACK);
            case AVALIACAO_BASICA, AUTO -> loadPromptAsset("modo-avaliacao-basica.md", BASIC_FALLBACK);
        };
    }

    private String loadCrossModuleRules() {
        return loadPromptAsset("modo-cross-module.md", CROSS_MODULE_FALLBACK);
    }

    public String buildSpecialistBlock(DoctorChatMode mode) {
        if (mode == null || mode == DoctorChatMode.AUTO) {
            return "";
        }

        return switch (mode) {
            case PRAGA -> loadPromptAsset("modo-praga.md", PEST_FALLBACK);
            case CONHECIMENTO_GERAL, AVALIACAO_BASICA, AVALIACAO_TECNICA, AUTO -> "";
        };
    }

    private String loadPromptAsset(String fileName, String fallback) {
        Path basePath = Paths.get(promptFilePath);
        Path dir = basePath.getParent();
        if (dir == null) {
            return fallback;
        }
        return loadPromptFile(dir.resolve(fileName), fallback);
    }

    private String loadPromptFile(Path path, String fallback) {
        try {
            if (!Files.exists(path)) {
                return fallback;
            }
            String content = normalize(Files.readString(path, StandardCharsets.UTF_8));
            return content.isBlank() ? fallback : content;
        } catch (IOException ex) {
            return fallback;
        }
    }

    private String optionalBlock(String title, String content) {
        String normalized = normalize(content);
        if (normalized.isBlank()) {
            return "";
        }
        return title + "\n" + normalized + "\n\n";
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String value(String value) {
        return normalize(value).isBlank() ? "Nenhuma mensagem informada." : normalize(value);
    }
}
