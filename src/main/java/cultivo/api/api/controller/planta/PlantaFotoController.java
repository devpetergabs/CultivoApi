package cultivo.api.api.controller.planta;

import cultivo.api.application.ai.PlantaImagemAnaliseService;
import cultivo.api.domain.planta.PlantaFoto;
import cultivo.api.domain.usuario.Usuario;
import cultivo.api.infrastructure.security.AccessControl;
import cultivo.api.infrastructure.persistence.planta.PlantaFotoRepository;
import cultivo.api.infrastructure.persistence.planta.PlantaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Base64;

@RestController
@RequestMapping("/plantas/{plantaId}/fotos")
public class PlantaFotoController {

    @Autowired
    private PlantaFotoRepository repository;

    @Autowired
    private PlantaImagemAnaliseService analiseService;

    @Autowired
    private PlantaRepository plantaRepository;

    @PostMapping
    public ResponseEntity<DadosDetalhePlantaFoto> cadastrar(@PathVariable Long plantaId,
                                                             @Valid @RequestBody DadosCadastroPlantaFoto dados,
                                                             @AuthenticationPrincipal Usuario usuario,
                                                             UriComponentsBuilder uri) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var planta = plantaRepository.findById(plantaId);
        if (planta.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (!AccessControl.canWritePlanta(usuario, planta.get())) {
            return ResponseEntity.notFound().build();
        }

        var imagemBytes = Base64.getDecoder().decode(dados.imagemBase64());
        var foto = new PlantaFoto(planta.get(), imagemBytes, dados.contentType(), dados.descricao());
        repository.save(foto);

        var resposta = new DadosDetalhePlantaFoto(foto.getId(), foto.getPlanta().getNome(),
                foto.getContentType(), foto.getDescricao(), foto.getDataUpload());
        var uriBuilder = uri.path("/plantas/{plantaId}/fotos/{id}").buildAndExpand(plantaId, foto.getId()).toUri();
        return ResponseEntity.created(uriBuilder).body(resposta);
    }

    @PostMapping("/analise")
    public ResponseEntity<?> analisar(
            @PathVariable Long plantaId,
            @Valid @RequestBody DadosAnalisePlantaFoto dados,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var planta = plantaRepository.findById(plantaId);
        if (planta.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (!AccessControl.canReadPlanta(usuario, planta.get())) {
            return ResponseEntity.notFound().build();
        }

        byte[] imagemBytes = null;
        if (dados.imagemBase64() != null && !dados.imagemBase64().isBlank()) {
            imagemBytes = Base64.getDecoder().decode(dados.imagemBase64());
        }

        var analise = analiseService.analisar(planta.get(), imagemBytes, dados.contentType(), dados.descricao());
        return ResponseEntity.ok(analise);
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @PathVariable Long plantaId,
            @AuthenticationPrincipal Usuario usuario,
            Pageable paginacao
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canReadPlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var page = repository.findByPlantaId(plantaId, paginacao)
                .map(f -> new DadosDetalhePlantaFoto(f.getId(), f.getPlanta().getNome(),
                        f.getContentType(), f.getDescricao(), f.getDataUpload()));
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detalhar(
            @PathVariable Long plantaId,
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canReadPlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var foto = repository.findById(id);
        if (foto.isEmpty() || !foto.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        var f = foto.get();
        var resposta = new DadosDetalhePlantaFoto(f.getId(), f.getPlanta().getNome(),
                f.getContentType(), f.getDescricao(), f.getDataUpload());
        return ResponseEntity.ok(resposta);
    }

    @GetMapping("/{id}/imagem")
    public ResponseEntity<?> visualizarImagem(
            @PathVariable Long plantaId,
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canReadPlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var foto = repository.findById(id);
        if (foto.isEmpty() || !foto.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        var f = foto.get();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(f.getContentType()));
        headers.setContentLength(f.getImagem().length);

        return new ResponseEntity<>(f.getImagem(), headers, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long plantaId,
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var plantaOpt = plantaRepository.findById(plantaId);
        if (plantaOpt.isEmpty() || !AccessControl.canWritePlanta(usuario, plantaOpt.get())) {
            return ResponseEntity.notFound().build();
        }

        var foto = repository.findById(id);
        if (foto.isEmpty() || !foto.get().getPlanta().getId().equals(plantaId)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
