package cultivo.api.application.planta;

import com.fasterxml.jackson.databind.ObjectMapper;
import cultivo.api.api.controller.planta.DadosCadastroEvento;
import cultivo.api.application.estoque.ProdutoEstoqueService;
import cultivo.api.domain.aditivo.Aditivo;
import cultivo.api.domain.planta.*;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.persistence.aditivo.AditivoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaEventoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaTratamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class PlantaEventoService {

    @Autowired
    private PlantaEventoRepository eventoRepository;

    @Autowired
    private PlantaRepository plantaRepository;

    @Autowired
    private AditivoRepository produtoRepository;

    @Autowired
    private PlantaTratamentoRepository tratamentoRepository;

    @Autowired
    private ProdutoEstoqueService estoqueService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public PlantaEvento criarEvento(Long plantaId, DadosCadastroEvento dados, String idempotencyKey, Usuario usuario) {
        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty()) {
            throw new IllegalArgumentException("Planta não encontrada");
        }

        var planta = plantaOpt.get();

        // autorização: planta pertence ao cultivador do usuário logado
        if (usuario == null
                || planta.getCultivador() == null
                || planta.getCultivador().getUsuario() == null
                || !planta.getCultivador().getUsuario().getId().equals(usuario.getId())) {
            throw new IllegalArgumentException("Planta não pertence ao usuário");
        }

        // Idempotency
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = eventoRepository.findByPlantaIdAndIdempotencyKey(plantaId, idempotencyKey);
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        var tipo = TipoEvento.valueOf(dados.tipo());
        Double doseEmML = (tipo == TipoEvento.PRAGA) ? null : dados.doseEmML();

        // 1 timestamp para tudo
        LocalDateTime when = LocalDateTime.now();

        var evento = new PlantaEvento(planta, tipo, when, dados.descricao(), doseEmML);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            evento.setIdempotencyKey(idempotencyKey);
        }

        // payloadJson: salva um snapshot do que o front enviou (útil pra auditoria)
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("tipo", dados.tipo());
            payload.put("descricao", dados.descricao());
            payload.put("doseEmML", doseEmML);
            payload.put("produtoId", dados.produtoId());
            payload.put("consumos", dados.consumos());
            payload.put("roundsTotal", dados.roundsTotal());
            payload.put("descansoDias", dados.descansoDias());
            evento.setPayloadJson(objectMapper.writeValueAsString(payload));
        } catch (Exception ignored) {}

        // Debita estoque quando aplicável.
        if (tipo == TipoEvento.INSETICIDA) {
            aplicarTratamentoInseticida(planta, evento, dados, when);

            // consumo do produto (mL do produto), se informado
            if (dados.produtoId() != null && dados.doseEmML() != null && dados.doseEmML() > 0) {
                estoqueService.debitarSeExiste(planta.getCultivador().getId(), dados.produtoId(), dados.doseEmML());
            }
        } else if (tipo == TipoEvento.REGA_ADITIVADA) {
            // mix: debita cada item do consumo (mL do produto)
            if (dados.consumos() != null) {
                for (var c : dados.consumos()) {
                    if (c == null || c.produtoId() == null) continue;
                    double ml = (c.consumoEmML() != null) ? c.consumoEmML() : 0;
                    if (ml <= 0) continue;
                    estoqueService.debitarSeExiste(planta.getCultivador().getId(), c.produtoId(), ml);
                }
            }
        } else if (tipo == TipoEvento.PRAGA) {
            // Evento de marcação de praga: não exige produto/rounds e não movimenta estoque.
        } else {
            // fallback: evento com produtoId único (ex: APLICACAO_ADITIVO)
            if (dados.produtoId() != null && dados.doseEmML() != null && dados.doseEmML() > 0) {
                estoqueService.debitarSeExiste(planta.getCultivador().getId(), dados.produtoId(), dados.doseEmML());
            }
        }

        return eventoRepository.save(evento);
    }

    private void aplicarTratamentoInseticida(Planta planta, PlantaEvento evento, DadosCadastroEvento dados, LocalDateTime when) {
        Long produtoId = dados.produtoId();
        if (produtoId == null || produtoId <= 0) {
            throw new IllegalArgumentException("produtoId é obrigatório para INSETICIDA");
        }

        Aditivo produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado"));

        int roundsTotal = safeInt(
                dados.roundsTotal(),
                produto.getRoundsRecomendados(),
                1,
                50
        );
        int descansoDias = safeInt(
                dados.descansoDias(),
                produto.getDescansoDiasRecomendados(),
                0,
                30
        );

        // Tratamento ativo mais recente
        var ativoOpt = tratamentoRepository.findFirstByPlantaIdAndStatusAndTipoOrderByUpdatedAtDesc(
                planta.getId(),
                StatusTratamento.ATIVO,
                TipoTratamento.INSETICIDA
        );

        PlantaTratamento tratamento;

        if (ativoOpt.isPresent()) {
            var t = ativoOpt.get();

            // Se o usuário trocar o produto no meio, encerramos o antigo e abrimos outro.
            if (!t.getProduto().getId().equals(produto.getId())) {
                t.cancelar("swap produto");
                tratamentoRepository.save(t);
                tratamento = new PlantaTratamento(planta, produto, TipoTratamento.INSETICIDA, roundsTotal, descansoDias, when);
                tratamento = tratamentoRepository.save(tratamento);
            } else {
                tratamento = t;
            }
        } else {
            tratamento = new PlantaTratamento(planta, produto, TipoTratamento.INSETICIDA, roundsTotal, descansoDias, when);
            tratamento = tratamentoRepository.save(tratamento);
        }

        // aplica 1 round
        tratamento.registrarAplicacao(when);
        tratamento = tratamentoRepository.save(tratamento);

        // snapshot no evento
        evento.setProduto(produto);
        evento.setTratamento(tratamento);
        evento.setRoundAtual(tratamento.getRoundAtual());
        evento.setRoundsTotal(tratamento.getRoundsTotal());
        evento.setDescansoDias(tratamento.getDescansoDias());
        evento.setProximaAplicacaoEm(tratamento.getProximaAplicacaoEm());
        evento.setFimTratamentoEm(tratamento.getFimTratamentoEm());
    }

    private static int safeInt(Integer preferred, Integer fallback, int min, int max) {
        Integer v = preferred != null ? preferred : fallback;
        if (v == null) v = min;
        int n = v;
        if (n < min) n = min;
        if (n > max) n = max;
        return n;
    }
}
