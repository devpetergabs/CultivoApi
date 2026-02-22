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

  // Auth
  async getUsuarioMe(): Promise<Usuario> {
    const response = await this.axiosInstance.get('/usuarios/me');
    return response.data;
  }

  async getCultivadorMe(): Promise<CultivadorMe> {
    const response = await this.axiosInstance.get('/cultivadores/me');
    return response.data;
  }

  // Plantas
  async getPlantasListagem(page: number = 0, size: number = 20): Promise<any> {
    const response = await this.axiosInstance.get('/plantas', {
      params: { page, size }
    });
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

  // Fotos
  async getPlantaFotos(plantaId: number, page: number = 0, size: number = 100): Promise<any> {
    const response = await this.axiosInstance.get(`/plantas/${plantaId}/fotos`, {
      params: { page, size }
    });
    return response.data;
  }

  async getPlantaFotoImagem(plantaId: number, fotoId: number): Promise<Blob> {
    const response = await this.axiosInstance.get(
      `/plantas/${plantaId}/fotos/${fotoId}/imagem`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  async createPlantaEvento(plantaId: number, payload: PlantaEventoPayload): Promise<PlantaEvento> {
    const response = await this.axiosInstance.post(`/plantas/${plantaId}/eventos`, {
      tipo: payload.tipo,
      descricao: payload.descricao,
      doseEmML: payload.doseEmML ?? null,
    });
    return response.data;
  }

  async createPlantaFoto(plantaId: number, data: { imagemBase64: string; contentType: string; descricao?: string }): Promise<PlantaFoto> {
    const response = await this.axiosInstance.post(`/plantas/${plantaId}/fotos`, data);
    return response.data;
  }

  // Aditivos
  async getAditivos(page: number = 0, size: number = 200): Promise<Page<Aditivo> | Aditivo[]> {
    const response = await this.axiosInstance.get('/aditivos', {
      params: { page, size }
    });
    return response.data;
  }

  async getPlantaAditivos(plantaId: number, page: number = 0, size: number = 100): Promise<any> {
    const response = await this.axiosInstance.get(`/plantas/${plantaId}/aditivos`, {
      params: { page, size }
    });
    return response.data;
  }

  async patchPlantaCrescimento(id: number, data: {
    newHeightCm: number;
    newWidthCm: number;
    newStemWidthCm: number;
    notes?: string;
  }): Promise<void> {
    await this.axiosInstance.patch(`/plantas/${id}/crescimento`, data);
  }

  async patchPlantaCrescer(id: number, data: {
    newHeightCm: number;
    newWidthCm: number;
    newStemWidthCm: number;
    notes?: string;
  }): Promise<void> {
    await this.axiosInstance.patch(`/plantas/${id}/crescer`, data);
  }
}

export const apiService = new ApiService();
