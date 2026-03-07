export interface Planta {
  id: number;
  nome: string;
  strain?: string | null;
  especie?: string | null;
  tipoCiclo?: string | null;
  genetica?: string | null;

  /** flag simples: existe sinal de praga ativo (enquanto durar o tratamento) */
  praga?: boolean;

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
  descricaoTecnica?: string | null;
  estagio: 'VEGETATIVA' | 'FLORACAO' | 'FINALIZACAO' | string;
  estagiosMacro?: 'VEGETATIVO' | 'FLORACAO' | 'CICLO_INTEGRADO' | 'FINALIZACAO' | string;
  estagiosLista?: string | null;
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

export interface CodexAditivoMatch {
  id: number;
  nome: string;
  marca: string;
  tipo: string | null;
  descricao: string | null;
  dosePadraoEmML: number | null;
}

export interface CodexEstagio {
  estagio: string;
  slug: string;
  nomeExibicao: string;
  subtitulo: string;
  descricaoBreve: string;
  descricaoLore: string;
  cuidadosPrincipais: string[];
  curiosidades: string[];
  pontosFortes: string[];
  pontosFracos: string[];
  alertas: string[];
  resistencia: string | null;
  observacaoLegal: string | null;
  ordemDesbloqueio: number;
  desbloqueado: boolean;
  atual: boolean;
  nenhumAditivoRecomendado: boolean;
  mensagemAditivos: string;
  aditivosRecomendados: CodexAditivoMatch[];
  artAssetKey?: string | null;
  temaVisual?: string | null;
}


export interface PlantaFoto {
  id: number;
  plantaNome: string;
  contentType: string;
  descricao: string;
  dataUpload: string;
}

export interface PlantaFotoAnalise {
  modelo: string;
  resposta: string;
  observacao: string;
}

export interface DoctorChatMessage {
  id: number;
  role: 'SYSTEM' | 'USER' | 'ASSISTANT' | string;
  content: string;
  createdAt: string;
  metadataJson?: string | null;
}

export interface DoctorDecisionSupportCauseEffectChain {
  cultivatorAction: string;
  plantEffect: string;
  lotEffect: string;
}

export interface DoctorDecisionSupportMetadata {
  dominantModule?: string | null;
  dominantReason?: string | null;
  secondaryModules?: string[];
  evidenceStrength?: string | null;
  confidenceLevel?: string | null;
  riskLevel?: string | null;
  causeEffectChain?: DoctorDecisionSupportCauseEffectChain | null;
  tradeOffs?: string[];
  businessWarnings?: string[];
  businessRecommendations?: string[];
  hardBlocks?: string[];
  telemetryFocus?: string[];
  appRuleSummary?: string | null;
  responseProfile?: string | null;
  stageWindow?: string | null;
  appActions?: string[];
}

export type DoctorChatIntent =
  | 'DEFINICAO'
  | 'DIAGNOSTICO_GERAL'
  | 'DIAGNOSTICO_ESPECIALIZADO'
  | 'RECOMENDACAO_MANEJO'
  | 'LEITURA_ESTAGIO'
  | 'TRIAGEM_AMBIGUA';

export interface DoctorChatMessageMetadata {
  intencaoDetectada?: DoctorChatIntent | string;
  confiancaRoteamento?: string;
  motivoRoteamento?: string;
  sinaisDisparadores?: string[];
  escopoContexto?: string;
  contextoBusca?: string;
  lacunasCriticas?: string[];
  modoUsado?: DoctorChatMode | string;
  queryRecuperacao?: string;
  fontesRecuperadas?: string[];
  fontesDetalhadas?: Array<{
    sourceId: string;
    sourceName: string;
    relativePath: string;
    sourceCategory: string;
    parentTopic: string;
    language: string;
    sourceType: string;
    score: number;
    layer: string;
  }>;
  debugRecuperacao?: string[];
  groundingLocalForte?: boolean;
  rotaTema?: string;
  rotaTopicos?: string[];
  idiomasPreferidos?: string[];
  bibleObrigatoria?: boolean;
  relacoesCruzadas?: {
    foundationSummary: string;
    refinementSummary: string;
    convergenceSummary: string;
    divergenceSummary: string;
    languageSummary: string;
    dominantTopics: string[];
    selectedLanguages: string[];
    baseSources: string[];
    refinementSources: string[];
    practicalActionHint: string;
  } | null;
  usouCodex?: boolean;
  estagioCodex?: string | null;
  usouEspecialistaPraga?: boolean;
  hipotesesConsideradas?: string[];
  dadosCriticosFaltantes?: string[];
  bloqueadaPorEvidencia?: boolean;
  apoioDecisao?: DoctorDecisionSupportMetadata | null;
}

export type DoctorChatMode = 'AUTO' | 'CONHECIMENTO_GERAL' | 'AVALIACAO_BASICA' | 'AVALIACAO_TECNICA' | 'PRAGA';

export interface DoctorChatSession {
  sessionId: number;
  status: 'ATIVA' | 'ENCERRADA' | string;
  titulo?: string | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: DoctorChatMessage[];
}

export interface DoctorChatSendResponse {
  sessionId: number;
  modoUsado: DoctorChatMode;
  userMessage: DoctorChatMessage;
  assistantMessage: DoctorChatMessage;
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

export type StatusEventoPlanejado = 'PENDENTE' | 'EXECUTADO' | 'CANCELADO' | 'EXPIRADO' | string;

export interface AgendaPlanejado {
  id: number;
  roundIndex: number;
  scheduledAt: string;
  status: StatusEventoPlanejado;
  executedAt?: string | null;
  eventoExecucaoId?: number | null;
  doseEmML?: number | null;
}

export interface AgendaInseticida {
  plantaId: number;
  plantaNome: string;
  tratamentoId: number;
  produtoNome: string;
  roundsTotal: number;
  roundAtual: number;
  descansoDias: number;
  inicioEm: string;
  fimTratamentoEm?: string | null;
  proximaAplicacaoEm?: string | null;
  planejados: AgendaPlanejado[];
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
  tipoCiclo?: string | null;
  genetica?: string | null;

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
  tipoCiclo?: string | null;
  genetica?: string | null;

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
  tipoCiclo?: string | null;
  genetica?: string | null;

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