export interface Planta {
  id: number;
  nome: string;
  strain: string;
  altura: number;
  largura: number;
  larguraCaule: number;
  tamanhoVaso: string;
  estagio: string;
  sexo?: string | null;
  dataSexagem?: string | null;
  dataFloracao?: string | null;
  ativo: boolean;
  dataGerminacao: string;
  dataCriacao: string;
}

export interface PlantaCompleta extends Planta {
  cultivadorId: number;
  cultivadorNome: string;
  cultivadorLogin: string;
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

export interface PlantaFoto {
  id: number;
  plantaNome: string;
  contentType: string;
  descricao: string;
  dataUpload: string;
}

export interface Usuario {
  id: number;
  nome: string;
  login: string;
}

export interface AuthContextType {
  usuario: Usuario | null;
  login: (login: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
