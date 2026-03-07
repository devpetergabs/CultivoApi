package cultivo.api.application.ai;

import cultivo.api.application.ai.DoctorDecisionSupport.CauseEffectChain;
import cultivo.api.application.ai.DoctorPlantKnowledgeBase.ReferenceContextResult;
import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.planta.TipoCicloPlanta;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class DoctorMentalMapEngine {

    public DoctorDecisionSupport evaluate(
            Planta planta,
            String mensagem,
            DoctorChatMode modo,
            DoctorPlantAnalysisContext context,
            DoctorPlantCodexContext codexContext,
            ReferenceContextResult referenceResult,
            DoctorAnalysisPlan analysisPlan
    ) {
        String texto = normalize(mensagem);
        String dominantModule = inferDominantModule(texto, modo, referenceResult, codexContext);
        List<String> secondaryModules = inferSecondaryModules(dominantModule, texto, planta, context, referenceResult);
        List<String> activeSignals = inferActiveSignals(planta, context, analysisPlan, referenceResult, codexContext);
        List<String> tradeOffs = inferTradeOffs(dominantModule, planta, textHas(texto, "densidade", "density"), context);
        CauseEffectChain causeEffectChain = inferChain(dominantModule, planta, context);
        List<String> warnings = inferWarnings(dominantModule, planta, context, analysisPlan, referenceResult);
        List<String> recommendations = inferRecommendations(dominantModule, planta, context, analysisPlan, referenceResult);
        List<String> blocks = inferBlocks(modo, analysisPlan, referenceResult, planta);
        List<String> telemetryFocus = inferTelemetryFocus(dominantModule, analysisPlan, context);
        String evidenceLevel = inferEvidenceLevel(referenceResult, analysisPlan);
        String confidenceLevel = inferConfidenceLevel(referenceResult, analysisPlan, context);
        String riskLevel = inferRiskLevel(dominantModule, planta, context, analysisPlan);
        String reason = inferDominantReason(dominantModule, texto, referenceResult, codexContext, context);
        String responseProfile = inferResponseProfile(modo, dominantModule, analysisPlan);
        String stageWindow = inferStageWindow(planta, dominantModule);
        List<String> appActions = inferAppActions(modo, dominantModule, planta, context, analysisPlan, referenceResult);
        String appRuleSummary = inferAppRuleSummary(dominantModule, secondaryModules, analysisPlan, referenceResult);

        return new DoctorDecisionSupport(
                dominantModule,
                reason,
                responseProfile,
                stageWindow,
                List.copyOf(secondaryModules),
                evidenceLevel,
                confidenceLevel,
                riskLevel,
                List.copyOf(activeSignals),
                List.copyOf(tradeOffs),
                causeEffectChain,
                List.copyOf(warnings),
                List.copyOf(recommendations),
                List.copyOf(blocks),
                List.copyOf(telemetryFocus),
                List.copyOf(appActions),
                appRuleSummary
        );
    }

    private String inferDominantModule(String texto, DoctorChatMode modo, ReferenceContextResult referenceResult, DoctorPlantCodexContext codexContext) {
        if (modo == DoctorChatMode.PRAGA || textHas(texto, "praga", "pest", "thrip", "tripe", "ácar", "acaro", "whitefly", "cochonilha", "pulg")) {
            return "pragas_manejo";
        }

        if (textHas(texto, "poda", "lst", "topping", "fim", "canopy", "desfolha", "amarra", "treinamento")) {
            return "arquitetura_poda_treinamento";
        }

        if (textHas(texto, "ph", "ec", "ppm", "fertiliz", "nutri", "deficien", "lockout", "runoff", "nitrogen", "phosphorus", "potassium")) {
            return "nutricao_fertilizacao";
        }

        if (textHas(texto, "fotoper", "photoperiod", "luz", "flora", "vegetativo", "automatica", "fotoperiodica")) {
            return "ciclos_fotoperiodo";
        }

        if (textHas(texto, "extra", "resina", "colheita", "cura", "secagem", "trim", "process")) {
            return "extracao";
        }

        if (referenceResult != null && referenceResult.routeTopic() != null && !referenceResult.routeTopic().isBlank()) {
            return referenceResult.routeTopic();
        }

        if (codexContext != null && !codexContext.isEmpty()) {
            return "fenologia_estagio";
        }

        return "fenologia_estagio";
    }

    private List<String> inferSecondaryModules(String dominantModule, String texto, Planta planta, DoctorPlantAnalysisContext context, ReferenceContextResult referenceResult) {
        LinkedHashSet<String> modules = new LinkedHashSet<>();

        if (!"fenologia_estagio".equals(dominantModule)) {
            modules.add("fenologia_estagio");
        }

        if (referenceResult != null && referenceResult.routeTopics() != null) {
            modules.addAll(referenceResult.routeTopics());
        }

        if (planta != null && Boolean.TRUE.equals(planta.getPraga())) {
            modules.add("pragas_manejo");
        }

        if (context != null && context.telemetria() != null && context.telemetria().larguraCm() != null && context.telemetria().alturaCm() != null) {
            double ratio = safeRatio(context.telemetria().larguraCm(), context.telemetria().alturaCm());
            if (ratio >= 0.85d) {
                modules.add("arquitetura_poda_treinamento");
            }
        }

        if (textHas(texto, "ph", "ec", "ppm", "runoff", "fertiliz", "nutri")) {
            modules.add("nutricao_fertilizacao");
        }
        if (textHas(texto, "praga", "ácar", "acaro", "tripe", "thrip", "whitefly", "cochonilha")) {
            modules.add("pragas_manejo");
        }
        if (textHas(texto, "poda", "lst", "topping", "canopy", "desfolha", "amarra")) {
            modules.add("arquitetura_poda_treinamento");
        }
        if (textHas(texto, "luz", "fotoper", "flora", "vegetativo", "automatica", "fotoperiodica")) {
            modules.add("ciclos_fotoperiodo");
        }
        if (textHas(texto, "colheita", "secagem", "cura", "resina", "extra")) {
            modules.add("extracao");
        }

        modules.remove(dominantModule);
        if (modules.isEmpty()) {
            if ("fenologia_estagio".equals(dominantModule)) {
                boolean floracao = planta != null && planta.getEstagio() != null && planta.getEstagio().name().startsWith("FLORACAO");
                return List.of(floracao ? "ciclos_fotoperiodo" : "arquitetura_poda_treinamento");
            }
            return List.of("fenologia_estagio");
        }
        return modules.stream().limit(3).toList();
    }

    private List<String> inferActiveSignals(Planta planta, DoctorPlantAnalysisContext context, DoctorAnalysisPlan analysisPlan, ReferenceContextResult referenceResult, DoctorPlantCodexContext codexContext) {
        List<String> signals = new ArrayList<>();
        if (planta != null && planta.getEstagio() != null) {
            signals.add("estágio atual: " + planta.getEstagio().name().toLowerCase(Locale.ROOT).replace('_', ' '));
        }
        if (planta != null && Boolean.TRUE.equals(planta.getPraga())) {
            signals.add("sinal de praga ativo no estado da planta");
        }
        if (planta != null && planta.getTipoCiclo() == TipoCicloPlanta.AUTOMATICA) {
            signals.add("ciclo automático reduz janela de recuperação para intervenções agressivas");
        }
        if (context != null && context.lacunasCriticas() != null && !context.lacunasCriticas().isEmpty()) {
            signals.add("lacunas operacionais: " + String.join(" | ", context.lacunasCriticas().stream().limit(2).toList()));
        }
        if (analysisPlan != null && analysisPlan.blockedByEvidenceGate()) {
            signals.add("gate de evidência ativo");
        }
        if (referenceResult != null && referenceResult.crossSourceSynthesis() != null && referenceResult.crossSourceSynthesis().convergenceSummary() != null) {
            signals.add("convergência local: " + referenceResult.crossSourceSynthesis().convergenceSummary());
        }
        if (codexContext != null && !codexContext.isEmpty()) {
            signals.add("codex de estágio disponível para contextualização");
        }
        return dedupe(signals, 4);
    }

    private List<String> inferTradeOffs(String dominantModule, Planta planta, boolean mentionsDensity, DoctorPlantAnalysisContext context) {
        List<String> tradeOffs = new ArrayList<>();
        switch (dominantModule) {
            case "arquitetura_poda_treinamento" -> {
                tradeOffs.add("intervenção estrutural pode melhorar leitura de copa, mas cobra janela de recuperação");
                tradeOffs.add("mais abertura e distribuição visual podem vir com custo de estresse se o timing estiver ruim");
            }
            case "nutricao_fertilizacao" -> {
                tradeOffs.add("força nutricional maior nem sempre entrega resposta proporcional em qualidade ou estabilidade");
                tradeOffs.add("ajustes sem contexto podem mascarar o limitante real e aumentar ruído de diagnóstico");
            }
            case "ciclos_fotoperiodo" -> {
                tradeOffs.add("mudança de luz acelera decisão de estágio, mas encurta janela para corrigir manejo estrutural");
                tradeOffs.add("mais intensidade ou transição cedo podem aumentar volume sem padronizar o lote sozinhos");
            }
            case "pragas_manejo" -> {
                tradeOffs.add("agir tarde aumenta custo operacional; agir cedo sem leitura também gera retrabalho");
                tradeOffs.add("tratamento sem revisar ambiente e recorrência reduz previsibilidade do resultado");
            }
            case "extracao" -> {
                tradeOffs.add("processar lote heterogêneo preserva volume, mas reduz previsibilidade de qualidade");
                tradeOffs.add("esperar demais por uniformidade pode alongar janela sem ganho líquido claro");
            }
            default -> {
                tradeOffs.add("ação certa fora do estágio errado costuma render menos que uma ação conservadora no momento correto");
            }
        }
        if (mentionsDensity) {
            tradeOffs.add("densidade ou fechamento de copa melhoram uso de área, mas aumentam risco de heterogeneidade");
        }
        if (planta != null && planta.getTipoCiclo() == TipoCicloPlanta.AUTOMATICA) {
            tradeOffs.add("cultivares de ciclo automático toleram menos intervenções que pedem recuperação longa");
        }
        if (context != null && context.telemetria() != null && context.telemetria().larguraCm() != null && context.telemetria().alturaCm() != null) {
            double ratio = safeRatio(context.telemetria().larguraCm(), context.telemetria().alturaCm());
            if (ratio >= 0.85d) {
                tradeOffs.add("copa larga em relação à altura sugere olhar arquitetura junto da decisão principal");
            }
        }
        return dedupe(tradeOffs, 4);
    }

    private CauseEffectChain inferChain(String dominantModule, Planta planta, DoctorPlantAnalysisContext context) {
        return switch (dominantModule) {
            case "arquitetura_poda_treinamento" -> new CauseEffectChain(
                    "intervenção em poda, amarra ou desfolha altera distribuição física da copa",
                    "a planta redistribui luz, ventilação e custo de recuperação entre regiões",
                    "o lote tende a mudar uniformidade, leitura sanitária e previsibilidade visual"
            );
            case "nutricao_fertilizacao" -> new CauseEffectChain(
                    "ajuste de alimentação, força da solução ou correção de desequilíbrio altera a entrada de recursos",
                    "a planta responde em vigor, tecido novo, consumo e sinais fisiológicos",
                    "o lote ganha ou perde estabilidade operacional e margem para erro nas próximas decisões"
            );
            case "ciclos_fotoperiodo" -> new CauseEffectChain(
                    "mudança de luz, transição de fase ou leitura de janela redefine o timing do manejo",
                    "a planta muda prioridade morfológica e capacidade de recuperar estresse",
                    "o lote passa a exigir outra cadência de intervenção e observação"
            );
            case "pragas_manejo" -> new CauseEffectChain(
                    "atraso ou acerto no monitoramento e tratamento muda a pressão biótica sobre o sistema",
                    "a planta perde ou recupera vigor conforme o avanço do dano e a qualidade da resposta",
                    "o lote sente impacto em consistência, retrabalho e risco de recorrência"
            );
            case "extracao" -> new CauseEffectChain(
                    "escolha de janela de colheita e segregação da matéria-prima define a base do processamento",
                    "a planta entra como insumo mais homogêneo ou mais misturado",
                    "o lote final herda essa variabilidade em qualidade e previsibilidade"
            );
            default -> new CauseEffectChain(
                    "a ação do cultivador precisa respeitar a fase e o contexto antes de ser intensificada",
                    "a planta responde melhor quando o manejo conversa com o estágio real",
                    "o lote tende a ficar mais previsível quando a decisão segue menor arrependimento"
            );
        };
    }

    private List<String> inferWarnings(String dominantModule, Planta planta, DoctorPlantAnalysisContext context, DoctorAnalysisPlan analysisPlan, ReferenceContextResult referenceResult) {
        List<String> warnings = new ArrayList<>();
        if (analysisPlan != null && analysisPlan.blockedByEvidenceGate()) {
            warnings.add("não transformar hipótese em conclusão fechada enquanto houver dados impeditivos");
        }
        if (referenceResult != null && !referenceResult.strongMatch()) {
            warnings.add("grounding local parcial: reduzir o tom de certeza e priorizar convergência entre fontes");
        }
        if (context != null && context.lacunasCriticas() != null && !context.lacunasCriticas().isEmpty()) {
            warnings.add("contexto operacional incompleto pode esconder o verdadeiro limitante");
        }
        if (planta != null && Boolean.TRUE.equals(planta.getPraga()) && !"pragas_manejo".equals(dominantModule)) {
            warnings.add("há sinal sanitário ativo; cruzar a resposta principal com manejo de pragas reduz falso positivo");
        }
        if (planta != null && planta.getTipoCiclo() == TipoCicloPlanta.AUTOMATICA && "arquitetura_poda_treinamento".equals(dominantModule)) {
            warnings.add("em ciclo automático, intervenção estrutural agressiva pede filtro extra de timing");
        }
        if (planta != null && planta.getEstagio() != null && planta.getEstagio().name().startsWith("FLORACAO") && "arquitetura_poda_treinamento".equals(dominantModule)) {
            warnings.add("em estágio reprodutivo, mudanças estruturais costumam ter tolerância operacional menor");
        }
        if (planta != null && planta.getEstagio() != null && planta.getEstagio().name().equals("FINALIZACAO") && "nutricao_fertilizacao".equals(dominantModule)) {
            warnings.add("no fechamento do lote, correções tardias de alimentação podem adicionar ruído sem retorno claro");
        }
        return dedupe(warnings, 4);
    }

    private List<String> inferRecommendations(String dominantModule, Planta planta, DoctorPlantAnalysisContext context, DoctorAnalysisPlan analysisPlan, ReferenceContextResult referenceResult) {
        List<String> recommendations = new ArrayList<>();
        recommendations.add("identificar primeiro o módulo dominante e pelo menos um módulo cruzado antes de recomendar ação");
        switch (dominantModule) {
            case "arquitetura_poda_treinamento" -> recommendations.add("traduzir a resposta em leitura de arquitetura, janela de recuperação e efeito sobre uniformidade");
            case "nutricao_fertilizacao" -> recommendations.add("tratar números como faixa contextual e não como dose universal do app");
            case "ciclos_fotoperiodo" -> recommendations.add("amarrar transição de fase ao timing das demais intervenções do histórico");
            case "pragas_manejo" -> recommendations.add("explicar hipótese principal junto do que observar agora para separar hipóteses rivais");
            case "extracao" -> recommendations.add("considerar uniformidade da matéria-prima antes de prometer previsibilidade de processamento");
            default -> recommendations.add("preferir resposta de menor arrependimento quando a evidência estiver incompleta");
        }
        if (analysisPlan != null && !analysisPlan.criticalMissingData().isEmpty()) {
            recommendations.add("explicitar os poucos dados que realmente aumentam confiança em vez de pedir tudo");
        }
        if (referenceResult != null && referenceResult.crossSourceSynthesis() != null && referenceResult.crossSourceSynthesis().practicalActionHint() != null) {
            recommendations.add("usar a síntese cruzada local como base da recomendação, não só o modo escolhido");
        }
        if (context != null && context.telemetria() != null && context.telemetria().ultimaObservacao() == null) {
            recommendations.add("quando não houver observação recente, responder de forma mais conservadora e pedir só o detalhe impeditivo");
        }
        if (planta != null && planta.getTipoCiclo() == TipoCicloPlanta.AUTOMATICA && "arquitetura_poda_treinamento".equals(dominantModule)) {
            recommendations.add("em automático, preferir leituras de menor estresse e evitar sugerir arquitetura pesada por padrão");
        }
        if (planta != null && planta.getEstagio() != null && planta.getEstagio().name().startsWith("FLORACAO")) {
            recommendations.add("explicar como o estágio reprodutivo muda o custo de cada intervenção antes do próximo passo");
        }
        return dedupe(recommendations, 4);
    }

    private List<String> inferBlocks(DoctorChatMode modo, DoctorAnalysisPlan analysisPlan, ReferenceContextResult referenceResult, Planta planta) {
        List<String> blocks = new ArrayList<>();
        if (analysisPlan != null && analysisPlan.blockedByEvidenceGate()) {
            blocks.add("bloquear laudo fechado sem antes reduzir a ambiguidade principal do caso");
        }
        if (modo == DoctorChatMode.CONHECIMENTO_GERAL) {
            blocks.add("não transformar curiosidade em diagnóstico operacional da planta sem o usuário pedir isso");
        }
        if (planta != null && planta.getTipoCiclo() == TipoCicloPlanta.AUTOMATICA) {
            blocks.add("não recomendar intervenção estrutural pesada como padrão sem checar janela curta de recuperação");
        }
        if (referenceResult != null && referenceResult.sourceNames().isEmpty()) {
            blocks.add("não afirmar base científica local forte quando a recuperação não encontrou fonte útil");
        }
        return dedupe(blocks, 3);
    }

    private List<String> inferTelemetryFocus(String dominantModule, DoctorAnalysisPlan analysisPlan, DoctorPlantAnalysisContext context) {
        List<String> focus = new ArrayList<>();
        if (analysisPlan != null && analysisPlan.criticalMissingData() != null) {
            focus.addAll(analysisPlan.criticalMissingData());
        }
        switch (dominantModule) {
            case "nutricao_fertilizacao" -> focus.add("telemetria que reduz dúvida nutricional: medições, reação pós-evento e histórico recente");
            case "pragas_manejo" -> focus.add("telemetria que separa hipóteses: padrão do dano, progressão e histórico de tratamento");
            case "arquitetura_poda_treinamento" -> focus.add("telemetria estrutural: relação altura/largura, observação recente e estágio ativo");
            case "ciclos_fotoperiodo" -> focus.add("telemetria de fase: estágio atual, tipo de ciclo e marco temporal da transição");
            case "extracao" -> focus.add("telemetria de lote: janela de colheita, uniformidade e histórico de estresse");
            default -> focus.add("telemetria mínima: estágio, observação recente e histórico do último evento relevante");
        }
        if (context != null && context.lacunasCriticas() != null && !context.lacunasCriticas().isEmpty()) {
            focus.add("fechar lacunas básicas do contexto antes de aprofundar explicações avançadas");
        }
        return dedupe(focus, 4);
    }

    private String inferEvidenceLevel(ReferenceContextResult referenceResult, DoctorAnalysisPlan analysisPlan) {
        if (referenceResult != null && referenceResult.strongMatch() && (analysisPlan == null || !analysisPlan.blockedByEvidenceGate())) {
            return "forte";
        }
        if (referenceResult != null && !referenceResult.sourceNames().isEmpty()) {
            return "parcial";
        }
        return "fraca";
    }

    private String inferConfidenceLevel(ReferenceContextResult referenceResult, DoctorAnalysisPlan analysisPlan, DoctorPlantAnalysisContext context) {
        int missing = analysisPlan != null && analysisPlan.criticalMissingData() != null ? analysisPlan.criticalMissingData().size() : 0;
        if (referenceResult != null && referenceResult.strongMatch() && missing == 0) {
            return "alta";
        }
        if ((referenceResult != null && referenceResult.strongMatch()) || missing <= 1 || (context != null && context.lacunasCriticas() != null && context.lacunasCriticas().size() <= 1)) {
            return "média";
        }
        return "baixa";
    }

    private String inferRiskLevel(String dominantModule, Planta planta, DoctorPlantAnalysisContext context, DoctorAnalysisPlan analysisPlan) {
        int score = 0;
        if (analysisPlan != null && analysisPlan.blockedByEvidenceGate()) score += 2;
        if (planta != null && Boolean.TRUE.equals(planta.getPraga())) score += 2;
        if (context != null && context.lacunasCriticas() != null) score += Math.min(2, context.lacunasCriticas().size());
        if ("pragas_manejo".equals(dominantModule) || "extracao".equals(dominantModule)) score += 1;
        if (score >= 4) return "alto";
        if (score >= 2) return "moderado";
        return "baixo";
    }

    private String inferDominantReason(String dominantModule, String texto, ReferenceContextResult referenceResult, DoctorPlantCodexContext codexContext, DoctorPlantAnalysisContext context) {
        String route = referenceResult != null ? normalize(referenceResult.routeTopic()) : "";
        return switch (dominantModule) {
            case "arquitetura_poda_treinamento" -> "o caso toca arquitetura, redistribuição de copa ou impacto estrutural do manejo";
            case "nutricao_fertilizacao" -> "o caso pede leitura de alimentação, medições ou possível desequilíbrio de resposta";
            case "ciclos_fotoperiodo" -> "o contexto depende do timing de luz, estágio ou janela de transição fisiológica";
            case "pragas_manejo" -> "o caso gira em torno de dano, infestação, triagem sanitária ou recorrência";
            case "extracao" -> "a pergunta encosta na janela de colheita, homogeneidade do lote ou impacto no processamento";
            default -> {
                if (codexContext != null && !codexContext.isEmpty()) {
                    yield "o codex do estágio fornece o melhor ponto de entrada para contextualizar a resposta";
                }
                if (!route.isBlank() && !"geral".equals(route)) {
                    yield "a recuperação local puxou o tema para " + route.replace('_', ' ');
                }
                if (context != null && context.metadados() != null && context.metadados().estagio() != null) {
                    yield "o estágio atual da planta é o melhor eixo para reduzir respostas genéricas";
                }
                yield textHas(texto, "como assim", "por quê", "porque")
                        ? "a mensagem parece continuação do tópico anterior e pede explicação causal"
                        : "o caso exige primeiro ancorar a decisão no estágio e no histórico recente";
            }
        };
    }

    private String inferResponseProfile(DoctorChatMode modo, String dominantModule, DoctorAnalysisPlan analysisPlan) {
        if (modo == DoctorChatMode.CONHECIMENTO_GERAL) {
            return "educacional";
        }
        if (modo == DoctorChatMode.PRAGA || "pragas_manejo".equals(dominantModule)) {
            return "triagem_sanitaria";
        }
        if ("ciclos_fotoperiodo".equals(dominantModule)) {
            return "janela_fisiologica";
        }
        if ("extracao".equals(dominantModule)) {
            return "pos_colheita";
        }
        if (analysisPlan != null && analysisPlan.blockedByEvidenceGate()) {
            return "diagnostico_conservador";
        }
        return "manejo_operacional";
    }

    private String inferStageWindow(Planta planta, String dominantModule) {
        if (planta == null || planta.getEstagio() == null) {
            return "janela dependente do estágio atual";
        }

        String estagio = planta.getEstagio().name();
        if ("GERMINACAO".equals(estagio)) {
            return "janela de estabelecimento: priorizar estabilidade e leitura fina";
        }
        if (estagio.startsWith("VEGETATIVO")) {
            if (planta.getTipoCiclo() == TipoCicloPlanta.AUTOMATICA) {
                return "janela vegetativa curta: qualquer estresse cobra recuperação mais cara";
            }
            if ("arquitetura_poda_treinamento".equals(dominantModule)) {
                return "janela vegetativa útil para estruturar, mas ainda dependente de recuperação";
            }
            return "janela vegetativa de expansão: usar contexto antes de intensificar manejo";
        }
        if (estagio.startsWith("FLORACAO")) {
            return "janela reprodutiva sensível: reduzir intervenções que atrasem estabilidade";
        }
        if ("FINALIZACAO".equals(estagio)) {
            return "janela de fechamento: evitar correções tardias que adicionem ruído ao lote";
        }
        return "janela dependente do estágio atual";
    }

    private List<String> inferAppActions(
            DoctorChatMode modo,
            String dominantModule,
            Planta planta,
            DoctorPlantAnalysisContext context,
            DoctorAnalysisPlan analysisPlan,
            ReferenceContextResult referenceResult
    ) {
        List<String> actions = new ArrayList<>();

        if (analysisPlan != null && analysisPlan.blockedByEvidenceGate()) {
            actions.add("coletar_dado_impeditivo");
        }
        if (context != null && context.lacunasCriticas() != null && !context.lacunasCriticas().isEmpty()) {
            actions.add("fechar_lacunas_do_contexto");
        }
        if (referenceResult == null || referenceResult.sourceNames().isEmpty()) {
            actions.add("responder_com_tom_conservador");
        }
        if (modo == DoctorChatMode.CONHECIMENTO_GERAL) {
            actions.add("manter_resposta_educativa_sem_virar_laudo");
        }

        switch (dominantModule) {
            case "arquitetura_poda_treinamento" -> {
                actions.add("avaliar_janela_de_recuperacao");
                actions.add("observar_uniformidade_de_copa");
                if (planta != null && planta.getTipoCiclo() == TipoCicloPlanta.AUTOMATICA) {
                    actions.add("evitar_intervencao_estrutural_agressiva");
                }
            }
            case "nutricao_fertilizacao" -> {
                actions.add("revisar_medicoes_nutricionais");
                actions.add("evitar_overfeed_sem_sinal_claro");
            }
            case "ciclos_fotoperiodo" -> {
                actions.add("checar_janela_de_transicao");
                actions.add("alinhar_timing_com_historico");
            }
            case "pragas_manejo" -> {
                actions.add("confirmar_padrao_do_dano");
                actions.add("monitorar_progressao_24_72h");
                actions.add("revisar_ambiente_e_recorrencia");
            }
            case "extracao" -> {
                actions.add("validar_uniformidade_da_materia_prima");
                actions.add("checar_janela_de_fechamento_do_lote");
            }
            default -> actions.add("priorizar_proximo_passo_de_menor_arrependimento");
        }

        if (planta != null && Boolean.TRUE.equals(planta.getPraga()) && !"pragas_manejo".equals(dominantModule)) {
            actions.add("cruzar_com_manejo_de_pragas");
        }
        if (planta != null && planta.getEstagio() != null && planta.getEstagio().name().startsWith("FLORACAO")) {
            actions.add("filtrar_acoes_por_estagio_reprodutivo");
        }

        return dedupe(actions, 5);
    }

    private String inferAppRuleSummary(String dominantModule, List<String> secondaryModules, DoctorAnalysisPlan analysisPlan, ReferenceContextResult referenceResult) {
        StringBuilder sb = new StringBuilder();
        sb.append("responder pelo módulo dominante ").append(dominantModule.replace('_', ' '));
        if (secondaryModules != null && !secondaryModules.isEmpty()) {
            sb.append(", cruzando com ").append(String.join(" + ", secondaryModules.stream().limit(2).map(module -> module.replace('_', ' ')).toList()));
        }
        sb.append(" e sempre explicando ação -> planta -> lote");
        if (analysisPlan != null && analysisPlan.blockedByEvidenceGate()) {
            sb.append("; como há gate de evidência, priorizar dados impeditivos antes de conclusão fechada");
        }
        if (referenceResult != null && !referenceResult.strongMatch()) {
            sb.append("; como o grounding local não está forte, manter tom conservador");
        }
        return sb.toString();
    }

    private List<String> dedupe(List<String> values, int limit) {
        Set<String> ordered = new LinkedHashSet<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                ordered.add(value.trim());
            }
        }
        if (ordered.isEmpty()) {
            return List.of();
        }
        return ordered.stream().limit(limit).toList();
    }

    private boolean textHas(String texto, String... tokens) {
        for (String token : tokens) {
            if (texto.contains(token)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    private double safeRatio(Double width, Double height) {
        if (width == null || height == null || height <= 0d) {
            return 0d;
        }
        return width / height;
    }
}
