package cultivo.api.domain.aditivo;

/**
 * Inventário do jogo: tudo é "produto".
 *
 * MVP: ainda usamos a tabela "aditivos" por compatibilidade, mas o tipo explícito
 * permite expandir para VASO, ferramentas, etc.
 */
public enum TipoProduto {
    ADITIVO,
    INSETICIDA,
    VASO,
    OUTRO
}
