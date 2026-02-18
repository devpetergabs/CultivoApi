export interface Planta {
  id: number;
  nome: string;
  strain?: string | null;
  altura: number;
  largura: number;
  larguraCaule: number;
  tamanhoVaso: string;
  estagio: string;
  sexo?: string | null;
  dataSexagem?: string | null;
  dataFloracao?: string | null;
  ativo: boolean;
  dataGerminacao: string | null;
  dataCriacao: string;
}

export interface PlantaCompleta extends Planta {
  cultivadorId: number;
  cultivadorNome: string;
  cultivadorLogin?: string | null;
  cultivadorTelefone: string;
  cultivadorAtivo: boolean;
  aditivos: PlantaAditivo[];
}

export interface PlantaAditivo {
  id: number;
  plantaNome: string;
  aditivoNome: string;
  aditivoMarca: string;
  aditivoDescricao: string;
  estagio: string;
  doseEmML: number;
}

export interface Aditivo {
  id: number;
  nome: string;
  marca: string;
  descricao: string;
  estagio: 'VEGETATIVA' | 'FLORACAO' | 'FINALIZACAO' | string;
  classe:
    | 'BASE_NUTRICIONAL'
    | 'FORTIFICANTE'
    | 'ESTIMULANTE'
    | 'BOOSTER'
    | 'PROTECAO'
    | 'FINALIZADOR'
    | 'OUTROS'
    | string;
  dosePadraoEmML: number | null;
  ativo: boolean;
}

export interface Page<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface PlantaFoto {
  id: number;
  plantaNome: string;
  contentType: string;
  descricao: string;
  dataUpload: string;
}

export interface PlantaEvento {
  id: number;
  plantaNome: string;
  tipo: string;
  dataEvento: string;
  descricao: string | null;
  doseEmML: number | null;
}

export interface PlantaEventoPayload {
  tipo: string; // matches backend TipoEvento enum
  descricao: string;
  doseEmML?: number | null;
}

// Payload para criação de planta (DadosCadastroPlanta)
export interface PlantaCreatePayload {
  cultivadorId: number;
  nome: string;
  strain?: string | null;
  altura: number;
  largura: number;
  larguraCaule: number;
  tamanhoVaso: string; // enum name, ex: CINCO_L
  estagio: string;     // enum name, ex: GERMINACAO
  dataGerminacao?: string | null;
  sexo?: string | null;
  dataSexagem?: string | null;
  dataFloracao?: string | null;
}

// Payload para criação autenticada (POST /plantas/me)
export interface PlantaCreateMePayload {
  nome: string;
  strain?: string | null;
  altura: number;
  largura: number;
  larguraCaule: number;
  tamanhoVaso: string; // enum name, ex: CINCO_L
  estagio: string;     // enum name, ex: GERMINACAO
  dataGerminacao?: string | null;
  sexo?: string | null;
  dataSexagem?: string | null;
  dataFloracao?: string | null;
}

// Payload para atualização de planta (PUT /plantas/{id})
// Observação: o backend exige `nome` e `tamanhoVaso` (NotBlank).
export interface PlantaUpdatePayload {
  nome: string;
  strain?: string | null;
  dataGerminacao?: string | null;
  altura?: number | null;
  largura?: number | null;
  larguraCaule?: number | null;
  tamanhoVaso: string;
  estagio?: string | null;
  sexo?: string | null;
  dataSexagem?: string | null;
  dataFloracao?: string | null;
}

export interface Usuario {
  id: number;
  nome: string;
  login: string;
}

export interface CultivadorMe {
  id: number;
  usuarioNome: string;
  usuarioLogin: string;
  telefone: string;
  ativo: boolean;
}

export interface AuthContextType {
  usuario: Usuario | null;
  cultivador: CultivadorMe | null;
  login: (login: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isRestoring: boolean;
}
