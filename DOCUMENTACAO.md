# Documentação de Domínio e Lógica - CultivoApi

## Sumário
- [Entidades Principais](#entidades-principais)
- [DTOs Principais](#dtos-principais)
- [Enums e Tipos Auxiliares](#enums-e-tipos-auxiliares)
- [Regras de Negócio e Lógica](#regras-de-negócio-e-lógica)
- [Observações](#observações)

---

## Entidades Principais

### Planta
```java
Planta {
    Long id;
    Cultivador cultivador;
    String nome;
    String strain;
    LocalDate dataGerminacao;
    Double altura;
    Double largura;
    Double larguraCaule;
    TamanhVaso tamanhoVaso;
    EstagioPlanta estagio;
    SexoPlanta sexo;
    LocalDate dataSexagem;
    LocalDate dataFloracao;
    Boolean ativo;
    LocalDate dataCriacao;
}
```

### PlantaEvento
```java
PlantaEvento {
    Long id;
    Planta planta;
    TipoEvento tipo;
    LocalDateTime dataEvento;
    String descricao;
    Double doseEmML;
}
```

### PlantaAditivo
```java
PlantaAditivo {
    Long id;
    Planta planta;
    Aditivo aditivo;
    Double doseEmML;
}
```

### PlantaFoto
```java
PlantaFoto {
    Long id;
    Planta planta;
    byte[] imagem;
    String contentType;
    LocalDateTime dataUpload;
    String descricao;
}
```

### Cultivador
```java
Cultivador {
    Long id;
    Usuario usuario;
    String telefone;
    Boolean ativo;
}
```

### Usuario
```java
Usuario {
    Long id;
    String nome;
    String login;
    String senha;
    String role;
}
```

---

## DTOs Principais

### Usuário
- **DadosDetalheUsuario**
  ```java
  DadosDetalheUsuario {
      Long id;
      String nome;
      String login;
  }
  ```
- **DadosCadastroUsuario**
  ```java
  DadosCadastroUsuario {
      String nome;   // obrigatório, 3-100 caracteres
      String login; // obrigatório, 3-50 caracteres
      String senha; // obrigatório, 6-100 caracteres
  }
  ```

### Planta
- **DadosDetalhePlanta**
  ```java
  DadosDetalhePlanta {
      Long id;
      String nome;
      String strain;
      Double altura;
      Double largura;
      Double larguraCaule;
      String tamanhoVaso;
      String estagio;
      String sexo;
      LocalDate dataSexagem;
      LocalDate dataFloracao;
      Boolean ativo;
      LocalDate dataGerminacao;
      LocalDate dataCriacao;
  }
  ```

---

## Enums e Tipos Auxiliares (exemplos)
- **EstagioPlanta**: GERMINACAO, VEGETATIVO, FLORACAO_INICIAL, FLORACAO_MEDIA, FLORACAO_AVANCADA, FINALIZACAO
- **SexoPlanta**: FEMEA, MACHO, HERMAFRODITA
- **TamanhVaso**: CINCO_L, VINTE_E_UM_L, TRINTA_L
- **TipoEvento**: (ex: REGA, ADUBACAO, PODA, etc)

---

## Regras de Negócio e Lógica
- **Germinação:**
  - Se o estágio for GERMINACAO, altura, largura e caule são sempre 0 (backend e frontend).
  - Validação permite altura/largura/caule igual a zero apenas para germinação.
- **Validações:**
  - Nome, login e senha obrigatórios para usuário.
  - Altura, largura e caule obrigatórios para planta, mínimo 0.
- **Relacionamentos:**
  - Planta pertence a um Cultivador.
  - Cultivador está vinculado a um Usuário.
  - Planta pode ter vários eventos, aditivos e fotos.

---

## Observações
- Para exportar este arquivo para PDF/Word, abra no VS Code, Word ou Google Docs e use a opção de exportar/salvar como PDF ou DOCX.
- Para mais detalhes de outros DTOs ou entidades, consulte os arquivos do projeto ou solicite aqui.

**TipoEvento** (valores possíveis):
  - REGA
  - REGA_NORMAL
  - REGA_ADITIVADA
  - MODELO_NORMAL
  - MODELO_ADITIVADO
  - PODA
  - TROCA_VASO
  - APLICACAO_ADITIVO
  - INSETICIDA
  - OBSERVACAO
  - COLHEITA
  - EVOLUCAO
  - OUTRO
  - CRESCIMENTO

### Detalhamento dos Tipos de Evento
| TipoEvento           | Descrição resumida                                                      |
|--------------------- |-------------------------------------------------------------------------|
| REGA                 | Evento genérico de rega                                                  |
| REGA_NORMAL          | Rega comum, apenas água                                                  |
| REGA_ADITIVADA       | Rega com aditivos misturados                                             |
| MODELO_NORMAL        | Aplicação de modelo de cultivo padrão                                    |
| MODELO_ADITIVADO     | Aplicação de modelo de cultivo com aditivos                              |
| PODA                 | Realização de poda                                                       |
| TROCA_VASO           | Troca do vaso da planta                                                  |
| APLICACAO_ADITIVO    | Aplicação direta de aditivo (sem rega)                                   |
| INSETICIDA           | Aplicação de inseticida                                                  |
| OBSERVACAO           | Observação livre sobre a planta                                          |
| COLHEITA             | Colheita da planta                                                       |
| EVOLUCAO             | Registro de evolução (crescimento, mudança de estágio, etc)              |
| OUTRO                | Outro tipo de evento não classificado                                    |
| CRESCIMENTO          | Registro específico de crescimento (altura, largura, etc)                |
