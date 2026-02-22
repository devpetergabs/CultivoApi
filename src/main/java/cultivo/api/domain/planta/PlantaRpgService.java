package cultivo.api.domain.planta;

import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlantaRpgService {
    @Autowired
    private PlantaRepository repository;

    public void distribuirPontos(Long plantaId, int alt, int lar, int caule) {
        var plantaOpt = repository.findById(plantaId);
        if (plantaOpt.isEmpty()) {
            throw new IllegalArgumentException("Planta não encontrada");
        }
        var planta = plantaOpt.get();
        int total = alt + lar + caule;
        if (total > planta.getPontosDisponiveis() || alt < 0 || lar < 0 || caule < 0) {
            throw new IllegalArgumentException("Distribuição inválida de pontos");
        }
        planta.setAltura(planta.getAltura() + alt);
        planta.setLargura(planta.getLargura() + lar);
        planta.setLarguraCaule(planta.getLarguraCaule() + caule);
        planta.setPontosDisponiveis(planta.getPontosDisponiveis() - total);
        repository.save(planta);
    }
}
