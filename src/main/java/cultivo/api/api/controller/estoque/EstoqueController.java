package cultivo.api.api.controller.estoque;

import cultivo.api.application.estoque.ProdutoEstoqueService;
import cultivo.api.domain.usuario.Usuario;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/estoque")
public class EstoqueController {

    @Autowired
    private ProdutoEstoqueService estoqueService;

    @PutMapping("/produtos/{produtoId}")
    public ResponseEntity<?> upsertProduto(
            @PathVariable Long produtoId,
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody DadosAtualizacaoEstoqueProduto dados
    ) {
        if (usuario == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (dados == null) return ResponseEntity.badRequest().build();

        try {
            var estoque = estoqueService.upsertEstoque(usuario, produtoId, dados.stockMlAtual(), dados.unidades(), dados.mlFrasco());
            var view = new DadosEstoqueProdutoView(
                    true,
                    estoque.getTipoProduto() != null ? estoque.getTipoProduto().toString() : null,
                    estoque.getStockMlAtual(),
                    estoque.getUnidades(),
                    estoque.getMlFrasco()
            );
            return ResponseEntity.ok(view);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
