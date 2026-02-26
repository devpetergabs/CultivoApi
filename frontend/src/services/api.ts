import axios, { AxiosInstance } from 'axios';
import type {
  Aditivo,
  Planta,
  PlantaCompleta,
  PlantaFoto,
  PlantaEventoPayload,
  PlantaEvento,
  PlantaCreatePayload,
  PlantaCreateMePayload,
  PlantaUpdatePayload,
  Page,
  Usuario,
  CultivadorMe,
} from '../types';

const API_URL = '/api';

class ApiService {
  private axiosInstance: AxiosInstance;
  private credentials: { login: string; senha: string } | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
    });
  }

  setCredentials(login: string, senha: string) {
    this.credentials = { login, senha };
    const auth = btoa(`${login}:${senha}`);
    this.axiosInstance.defaults.headers.common['Authorization'] = `Basic ${auth}`;
  }

  clearCredentials() {
    this.credentials = null;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  async getUsuarioMe(): Promise<Usuario> {
    const response = await this.axiosInstance.get('/usuarios/me');
    return response.data;
  }

  async getCultivadorMe(): Promise<CultivadorMe> {
    const response = await this.axiosInstance.get('/cultivadores/me');
    return response.data;
  }

  async getPlantasListagem(page: number = 0, size: number = 20): Promise<any> {
    const response = await this.axiosInstance.get('/plantas', { params: { page, size } });
    return response.data;
  }

  async getPlantaDetalhes(id: number): Promise<Planta> {
    const response = await this.axiosInstance.get(`/plantas/${id}`);
    return response.data;
  }

  async getPlantaCompleta(id: number): Promise<PlantaCompleta> {
    const response = await this.axiosInstance.get(`/plantas/${id}/completa`);
    return response.data;
  }

  async createPlanta(payload: PlantaCreatePayload): Promise<Planta> {
    const response = await this.axiosInstance.post('/plantas', payload);
    return response.data;
  }

  async createPlantaMe(payload: PlantaCreateMePayload): Promise<Planta> {
    const response = await this.axiosInstance.post('/plantas/me', payload);
    return response.data;
  }

  async updatePlanta(id: number, payload: PlantaUpdatePayload): Promise<Planta> {
    const response = await this.axiosInstance.put(`/plantas/${id}`, payload);
    return response.data;
  }

  async deletePlanta(id: number): Promise<void> {
    await this.axiosInstance.delete(`/plantas/${id}`);
  }

  async getPlantaFotos(plantaId: number, page: number = 0, size: number = 100): Promise<any> {
    const response = await this.axiosInstance.get(`/plantas/${plantaId}/fotos`, { params: { page, size } });
    return response.data;
  }

  async getPlantaFotoImagem(plantaId: number, fotoId: number): Promise<Blob> {
    const response = await this.axiosInstance.get(`/plantas/${plantaId}/fotos/${fotoId}/imagem`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async createPlantaEvento(plantaId: number, payload: PlantaEventoPayload): Promise<PlantaEvento> {
    const headers: Record<string, string> = {};
    if (payload.idempotencyKey) headers['Idempotency-Key'] = payload.idempotencyKey;

    const response = await this.axiosInstance.post(
      `/plantas/${plantaId}/eventos`,
      {
        tipo: payload.tipo,
        descricao: payload.descricao,
        doseEmML: payload.doseEmML ?? null,
        produtoId: payload.produtoId ?? null,
        roundsTotal: payload.roundsTotal ?? null,
        descansoDias: payload.descansoDias ?? null,
        consumos: payload.consumos ?? null,
      },
      { headers }
    );
    return response.data;
  }

  async getPlantaEventos(plantaId: number, page = 0, size = 50) {
    const response = await this.axiosInstance.get(`/plantas/${plantaId}/eventos`, { params: { page, size } });
    return response.data; // Page<PlantaEvento>
  }

  async equiparPote(
    plantaId: number,
    payload: { produtoId: number; corHex?: string | null; skinId?: string | null; apelido?: string | null }
  ): Promise<any> {
    const response = await this.axiosInstance.put(`/plantas/${plantaId}/equipamentos/pote`, {
      produtoId: payload.produtoId,
      corHex: payload.corHex ?? null,
      skinId: payload.skinId ?? null,
      apelido: payload.apelido ?? null,
    });
    return response.data;
  }

  async deletePlantaEvento(plantaId: number, eventoId: number): Promise<void> {
    await this.axiosInstance.delete(`/plantas/${plantaId}/eventos/${eventoId}`);
  }

  async patchPlantaEvento(
    plantaId: number,
    eventoId: number,
    payload: { descricao?: string | null; doseEmML?: number | null }
  ): Promise<PlantaEvento> {
    const response = await this.axiosInstance.patch(`/plantas/${plantaId}/eventos/${eventoId}`, {
      descricao: payload.descricao ?? null,
      doseEmML: typeof payload.doseEmML === 'number' ? payload.doseEmML : null,
    });
    return response.data;
  }

  async createPlantaFoto(
    plantaId: number,
    data: { imagemBase64: string; contentType: string; descricao?: string }
  ): Promise<PlantaFoto> {
    const response = await this.axiosInstance.post(`/plantas/${plantaId}/fotos`, data);
    return response.data;
  }

  async getAditivos(page: number = 0, size: number = 200): Promise<Page<Aditivo> | Aditivo[]> {
    const response = await this.axiosInstance.get('/aditivos', { params: { page, size } });
    return response.data;
  }

  async getPlantaAditivos(plantaId: number, page: number = 0, size: number = 100): Promise<any> {
    const response = await this.axiosInstance.get(`/plantas/${plantaId}/aditivos`, { params: { page, size } });
    return response.data;
  }

  async updateProdutoEstoque(produtoId: number, payload: { stockMlAtual?: number | null; unidades?: number | null; mlFrasco?: number | null }): Promise<any> {
    const response = await this.axiosInstance.put(`/estoque/produtos/${produtoId}`, {
      stockMlAtual: typeof payload.stockMlAtual === 'number' ? payload.stockMlAtual : payload.stockMlAtual ?? null,
      unidades: typeof payload.unidades === 'number' ? payload.unidades : payload.unidades ?? null,
      mlFrasco: typeof payload.mlFrasco === 'number' ? payload.mlFrasco : payload.mlFrasco ?? null,
    });
    return response.data;
  }

  async patchPlantaCrescer(
    id: number,
    data: { altura: number; largura: number; larguraCaule: number; descricao?: string; obs?: string }
  ): Promise<void> {
    await this.axiosInstance.patch(`/plantas/${id}/crescer`, data);
  }
}

  

export const apiService = new ApiService();