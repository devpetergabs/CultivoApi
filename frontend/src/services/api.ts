import axios, { AxiosInstance } from 'axios';
import type { Planta, PlantaCompleta, PlantaFoto, PlantaEventoPayload, PlantaEvento } from '../types';

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
  async getPlantaAditivos(plantaId: number, page: number = 0, size: number = 100): Promise<any> {
    const response = await this.axiosInstance.get(`/plantas/${plantaId}/aditivos`, {
      params: { page, size }
    });
    return response.data;
  }
}

export const apiService = new ApiService();
