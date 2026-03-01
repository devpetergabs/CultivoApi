export interface Planta {
  id: number;
  nome: string;
  strain?: string | null;
  especie?: string | null;

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

  level?: number;
  xp?: number;
  pontosDisponiveis?: number;
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

export interface ProdutoEstoque {
  tracked: boolean;
  tipoProduto: string | null;
  stockMlAtual: number;
  unidades: number;
  mlFrasco: number;
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

  // --- produto (MVP: mesma API) ---
  tipo?: 'ADITIVO' | 'INSETICIDA' | 'VASO' | 'OUTRO' | string;
  estoque?: ProdutoEstoque;
  capacidadeLitros?: number | null;
  roundsRecomendados?: number | null;
  descansoDiasRecomendados?: number | null;
  doseMinEmML?: number | null;
  doseMaxEmML?: number | null;
  pragasEfetivas?: string | null;
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

  // --- inseticida/tratamento ---
  produtoId?: number | null;
  tratamentoId?: number | null;
  roundAtual?: number | null;
  roundsTotal?: number | null;
  descansoDias?: number | null;
  proximaAplicacaoEm?: string | null;
  fimTratamentoEm?: string | null;
}

export interface PlantaEventoPayload {
  tipo: string;
  descricao: string;
  doseEmML?: number | null;
  produtoId?: number | null;
  consumos?: Array<{ produtoId: number; consumoEmML: number }>;
  roundsTotal?: number | null;
  descansoDias?: number | null;
  idempotencyKey?: string;
}



export interface PlantaEquipamento {
  id: number;
  slot: 'POT' | string;
  produtoId: number;
  produtoNome: string;
  produtoTipo: string;
  capacidadeLitros?: number | null;
  corHex?: string | null;
  skinId?: string | null;
  apelido?: string | null;
  equipadoEm?: string | null;
}
export interface PlantaCreatePayload {
  cultivadorId: number;
  nome: string;
  strain?: string | null;
  especie?: string | null;

  altura: number;
  largura: number;
  larguraCaule: number;
  tamanhoVaso: string;
  estagio: string;

  dataGerminacao?: string | null;
  sexo?: string | null;
  dataSexagem?: string | null;
  dataFloracao?: string | null;
}

export interface PlantaCreateMePayload {
  nome: string;
  strain?: string | null;
  especie?: string | null;

  altura: number;
  largura: number;
  larguraCaule: number;
  tamanhoVaso: string;
  estagio: string;

  dataGerminacao?: string | null;
  sexo?: string | null;
  dataSexagem?: string | null;
  dataFloracao?: string | null;
}

export interface PlantaUpdatePayload {
  nome: string;
  strain?: string | null;
  especie?: string | null;

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