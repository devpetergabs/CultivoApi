package cultivo.api.application.ai;

import cultivo.api.api.controller.planta.DadosResultadoAnalisePlantaFoto;
import cultivo.api.domain.planta.Planta;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PlantaImagemAnaliseService {

    private static final String OBSERVACAO_PADRAO_IMAGEM = "Análise assistida por IA com foco em sintomas visuais. Confirme qualquer hipótese com observação humana antes de agir.";
    private static final String OBSERVACAO_PADRAO_TEXTO = "Leitura inicial baseada apenas em relato textual. Sem foto, a confiança é menor e nenhuma inferência visual deve ser tratada como confirmação.";

    private final RestTemplate restTemplate;
    private final String ollamaBaseUrl;
    private final String modeloVisao;
    private final String modeloTexto;

    public PlantaImagemAnaliseService(
            RestTemplate restTemplate,
            @Value("${app.ai.ollama.base-url}") String ollamaBaseUrl,
            @Value("${app.ai.ollama.vision-model}") String modeloVisao,
            @Value("${app.ai.ollama.text-model}") String modeloTexto
    ) {
        this.restTemplate = restTemplate;
        this.ollamaBaseUrl = ollamaBaseUrl;
        this.modeloVisao = modeloVisao;
        this.modeloTexto = modeloTexto;
    }

    public DadosResultadoAnalisePlantaFoto analisar(Planta planta, byte[] imagem, String contentType, String descricao) {
        validarEntrada(contentType, imagem, descricao);

        boolean possuiImagem = imagem != null && imagem.length > 0;
        String modeloSelecionado = possuiImagem ? modeloVisao : modeloTexto;
        String prompt = montarPrompt(planta, descricao, possuiImagem);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", modeloSelecionado);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);
        if (possuiImagem) {
            String imagemBase64 = Base64.getEncoder().encodeToString(imagem);
            requestBody.put("images", List.of(imagemBase64));
        }
        requestBody.put("options", Map.of("temperature", 0.2));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            @SuppressWarnings("unchecked")
            var response = restTemplate.postForObject(
                    ollamaBaseUrl + "/api/generate",
                    new HttpEntity<>(requestBody, headers),
                    Map.class
            );

            String resposta = response != null && response.get("response") != null
                    ? String.valueOf(response.get("response")).trim()
                    : "A IA não retornou conteúdo utilizável para esta imagem.";

            if (resposta.isBlank()) {
                resposta = "A IA não retornou conteúdo utilizável para esta imagem.";
            }

                return new DadosResultadoAnalisePlantaFoto(
                    modeloSelecionado,
                    resposta,
                    possuiImagem ? OBSERVACAO_PADRAO_IMAGEM : OBSERVACAO_PADRAO_TEXTO
                );
        } catch (RestClientException ex) {
            String mensagem = ex.getMessage() != null ? ex.getMessage() : "Falha ao consultar a IA.";
            if (mensagem.contains("model") && mensagem.contains("not found")) {
                String sugestao = possuiImagem
                        ? "Modelo de visão indisponível no Ollama. Faça o pull de um modelo multimodal, por exemplo: docker exec cultivo_inteligente_ollama ollama pull llava:7b"
                        : "Modelo de texto indisponível no Ollama. Faça o pull do modelo configurado, por exemplo: docker exec cultivo_inteligente_ollama ollama pull llama3.2";
                throw new IllegalArgumentException(sugestao);
            }
            throw new IllegalArgumentException("Falha ao consultar a IA local: " + sanitizar(mensagem));
        }
    }

    private void validarEntrada(String contentType, byte[] imagem, String descricao) {
        boolean possuiImagem = imagem != null && imagem.length > 0;
        boolean possuiDescricao = descricao != null && !descricao.isBlank();

        if (!possuiImagem && !possuiDescricao) {
            throw new IllegalArgumentException("Envie uma imagem ou descreva o que deseja analisar.");
        }

        if (!possuiImagem) {
            return;
        }

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Quando enviar foto, use uma imagem válida para análise.");
        }
        if (imagem.length > 8 * 1024 * 1024) {
            throw new IllegalArgumentException("A imagem excede o limite de 8 MB para análise.");
        }
    }

    private String montarPrompt(Planta planta, String descricao, boolean possuiImagem) {
        String contextoUsuario = descricao == null || descricao.isBlank()
                ? "Nenhuma observação adicional foi enviada."
                : descricao.trim();

        if (possuiImagem) {
            return "Você é um assistente de análise botânica visual. " +
                "Analise a imagem enviada com foco em sintomas visuais, sinais de estresse, manchas, deformações, pragas visíveis e possíveis fatores ambientais. " +
                "Evite qualquer orientação para cultivo de culturas controladas ou atividades ilegais. " +
                "Se estiver incerto, diga claramente. " +
                "Responda em português do Brasil, em tópicos curtos, exatamente com estas seções: " +
                "Resumo, Sinais observados, Hipóteses visuais, Próxima verificação segura. " +
                "Contexto do usuário: planta='" + valor(planta.getNome()) + "', estágio='" + valor(planta.getEstagio() != null ? planta.getEstagio().name() : null) + "'. " +
                "Observação do usuário: " + contextoUsuario;
        }

        return "Você é um assistente de triagem botânica baseado apenas em relato textual. " +
            "Não há imagem anexada. Não invente sinais visuais, não use a expressão 'hipóteses visuais' e não faça recomendações dependentes de inspeção por foto. " +
            "Trate a resposta como uma leitura inicial do relato, deixando claro o que veio do usuário e o que permanece incerto. " +
            "Evite qualquer orientação para cultivo de culturas controladas ou atividades ilegais. " +
            "Se estiver incerto, diga claramente. " +
            "Responda em português do Brasil, em tópicos curtos, exatamente com estas seções: " +
            "Resumo do relato, Pontos mencionados, Hipóteses iniciais não visuais, Próxima verificação segura. " +
            "Contexto do usuário: planta='" + valor(planta.getNome()) + "', estágio='" + valor(planta.getEstagio() != null ? planta.getEstagio().name() : null) + "'. " +
            "Relato do usuário: " + contextoUsuario;
    }

    private String valor(String valor) {
        return valor == null || valor.isBlank() ? "não informado" : valor;
    }

    private String sanitizar(String valor) {
        return new String(valor.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8).replace("\n", " ").trim();
    }
}