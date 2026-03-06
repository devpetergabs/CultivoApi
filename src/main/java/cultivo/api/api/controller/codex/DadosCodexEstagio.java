package cultivo.api.api.controller.codex;

import java.util.List;

public record DadosCodexEstagio(
        String estagio,
        String slug,
        String nomeExibicao,
        String subtitulo,
        String descricaoBreve,
        String descricaoLore,
        List<String> cuidadosPrincipais,
        List<String> curiosidades,
        List<String> pontosFortes,
        List<String> pontosFracos,
        List<String> alertas,
        String resistencia,
        String observacaoLegal,
        Integer ordemDesbloqueio,
        boolean desbloqueado,
        boolean atual,
        boolean nenhumAditivoRecomendado,
        String mensagemAditivos,
        List<DadosAditivoMatchEstagio> aditivosRecomendados,
        String artAssetKey,
        String temaVisual
) {
}
