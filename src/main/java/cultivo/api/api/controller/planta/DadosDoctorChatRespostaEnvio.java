package cultivo.api.api.controller.planta;

public record DadosDoctorChatRespostaEnvio(
        Long sessionId,
        String modoUsado,
        DadosDoctorChatMensagem userMessage,
        DadosDoctorChatMensagem assistantMessage
) {
}