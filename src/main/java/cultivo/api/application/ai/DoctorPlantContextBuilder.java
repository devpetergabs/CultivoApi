package cultivo.api.application.ai;

import cultivo.api.domain.planta.Planta;
import cultivo.api.domain.planta.PlantaEvento;
import cultivo.api.domain.planta.TipoEvento;
import cultivo.api.infrastructure.persistence.planta.PlantaEventoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;

@Service
public class DoctorPlantContextBuilder {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final EnumSet<TipoEvento> EVENTOS_REGA = EnumSet.of(
            TipoEvento.REGA,
            TipoEvento.REGA_NORMAL,
            TipoEvento.REGA_ADITIVADA,
            TipoEvento.MODELO_NORMAL,
            TipoEvento.MODELO_ADITIVADO
    );

    private final PlantaEventoRepository eventoRepository;

    public DoctorPlantContextBuilder(PlantaEventoRepository eventoRepository) {
        this.eventoRepository = eventoRepository;
    }

    public DoctorPlantAnalysisContext build(Planta planta) {
        List<PlantaEvento> eventos = eventoRepository
                .findByPlantaIdAndDeletedAtIsNullOrderByDataEventoDesc(planta.getId(), PageRequest.of(0, 30))
                .getContent();

        PlantaEvento ultimaObservacao = localizarPrimeiro(eventos, TipoEvento.OBSERVACAO);
        PlantaEvento ultimaRega = localizarPrimeiro(eventos, EVENTOS_REGA);
        PlantaEvento ultimoSinalPraga = localizarPrimeiro(eventos, TipoEvento.PRAGA);
        PlantaEvento ultimoTratamento = localizarPrimeiro(eventos, TipoEvento.INSETICIDA);

        var metadados = new DoctorPlantAnalysisContext.Metadados(
                planta.getNome(),
                planta.getEspecie() != null ? planta.getEspecie().name() : "CANNABIS",
            planta.getTipoCiclo() != null ? planta.getTipoCiclo().name() : null,
            planta.getGenetica() != null ? planta.getGenetica().name() : null,
                blankToNull(planta.getStrain()),
                planta.getEstagio() != null ? planta.getEstagio().name() : null,
                planta.getSexo() != null ? planta.getSexo().name() : null,
                planta.getTamanhoVaso() != null ? planta.getTamanhoVaso().name() : null,
                planta.getDataGerminacao() != null ? planta.getDataGerminacao().format(DATE_FORMAT) : null,
                planta.getDataFloracao() != null ? planta.getDataFloracao().format(DATE_FORMAT) : null,
                planta.getPraga(),
                planta.getAtivo()
        );

        var telemetria = new DoctorPlantAnalysisContext.Telemetria(
                planta.getAltura(),
                planta.getLargura(),
                planta.getLarguraCaule(),
                formatarObservacao(ultimaObservacao),
                formatarRega(ultimaRega)
        );

        var historicoSaude = new DoctorPlantAnalysisContext.HistoricoSaude(
                formatarHistoricoSaude(ultimoSinalPraga),
                formatarHistoricoSaude(ultimoTratamento)
        );

        return new DoctorPlantAnalysisContext(metadados, telemetria, historicoSaude, calcularLacunas(planta, ultimaObservacao, ultimaRega));
    }

    private List<String> calcularLacunas(Planta planta, PlantaEvento ultimaObservacao, PlantaEvento ultimaRega) {
        List<String> lacunas = new ArrayList<>();
        if (planta.getStrain() == null || planta.getStrain().isBlank()) {
            lacunas.add("strain não informada");
        }
        if (planta.getAltura() == null) {
            lacunas.add("altura atual ausente");
        }
        if (planta.getLargura() == null) {
            lacunas.add("largura atual ausente");
        }
        if (ultimaObservacao == null || ultimaObservacao.getDescricao() == null || ultimaObservacao.getDescricao().isBlank()) {
            lacunas.add("sem observação recente registrada");
        }
        if (ultimaRega == null) {
            lacunas.add("sem rega recente registrada");
        }
        return lacunas;
    }

    private PlantaEvento localizarPrimeiro(List<PlantaEvento> eventos, TipoEvento tipo) {
        return eventos.stream()
                .filter(evento -> evento.getTipo() == tipo)
                .findFirst()
                .orElse(null);
    }

    private PlantaEvento localizarPrimeiro(List<PlantaEvento> eventos, EnumSet<TipoEvento> tipos) {
        return eventos.stream()
                .filter(evento -> tipos.contains(evento.getTipo()))
                .findFirst()
                .orElse(null);
    }

    private String formatarObservacao(PlantaEvento evento) {
        if (evento == null) {
            return null;
        }
        String descricao = blankToNull(evento.getDescricao());
        if (descricao == null) {
            return evento.getDataEvento() != null ? evento.getDataEvento().format(DATE_TIME_FORMAT) : null;
        }
        if (evento.getDataEvento() == null) {
            return descricao;
        }
        return evento.getDataEvento().format(DATE_TIME_FORMAT) + " - " + descricao;
    }

    private String formatarRega(PlantaEvento evento) {
        if (evento == null) {
            return null;
        }
        List<String> partes = new ArrayList<>();
        if (evento.getDataEvento() != null) {
            partes.add(evento.getDataEvento().format(DATE_TIME_FORMAT));
        }
        partes.add(rotuloEvento(evento.getTipo()));
        if (evento.getDoseEmML() != null) {
            partes.add(String.format(Locale.US, "%.0f mL", evento.getDoseEmML()));
        }
        if (evento.getDescricao() != null && !evento.getDescricao().isBlank()) {
            partes.add(evento.getDescricao().trim());
        }
        return String.join(" | ", partes);
    }

    private String formatarHistoricoSaude(PlantaEvento evento) {
        if (evento == null) {
            return null;
        }
        List<String> partes = new ArrayList<>();
        if (evento.getDataEvento() != null) {
            partes.add(evento.getDataEvento().format(DATE_TIME_FORMAT));
        }
        partes.add(rotuloEvento(evento.getTipo()));
        if (evento.getDescricao() != null && !evento.getDescricao().isBlank()) {
            partes.add(evento.getDescricao().trim());
        }
        return String.join(" | ", partes);
    }

    private String rotuloEvento(TipoEvento tipo) {
        return switch (tipo) {
            case REGA -> "Rega";
            case REGA_NORMAL -> "Rega normal";
            case REGA_ADITIVADA -> "Rega aditivada";
            case MODELO_NORMAL -> "Modelo de rega normal";
            case MODELO_ADITIVADO -> "Modelo de rega aditivada";
            case OBSERVACAO -> "Observação";
            case PRAGA -> "Sinal de praga";
            case INSETICIDA -> "Tratamento inseticida";
            default -> tipo.name();
        };
    }

    private String blankToNull(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}