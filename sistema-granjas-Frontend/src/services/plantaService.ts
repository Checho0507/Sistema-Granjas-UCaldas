// src/services/plantaService.ts
import type { PlantaCreate, PlantaUpdate, PlantaResponse, GenerarPlantasResponse } from '../types/plantaTypes';
import loteService from './loteService'; // si lo necesitas

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`Error ${response.status}`);
    }

    // Manejo de errores de validación de FastAPI
    if (errorData.detail && Array.isArray(errorData.detail)) {
      const erroresPorCampo: Record<string, string> = {};
      errorData.detail.forEach((err: any) => {
        const campo = Array.isArray(err.loc) ? err.loc.slice(-1)[0] : 'general';
        let mensaje = err.msg || 'Error de validación';
        mensaje = mensaje.replace('Value error, ', '');
        erroresPorCampo[campo] = mensaje;
      });
      const error = new Error('Error de validación');
      (error as any).erroresValidacion = erroresPorCampo;
      throw error;
    }

    throw new Error(errorData.detail || errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const plantaService = {
  // Obtener plantas (opcional: filtrar por lote)
  async obtenerPlantas(loteId?: number): Promise<PlantaResponse[]> {
    const url = loteId ? `${API_BASE_URL}/plantas?lote_id=${loteId}` : `${API_BASE_URL}/plantas`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  async obtenerPlantaPorId(id: number): Promise<PlantaResponse> {
    const response = await fetch(`${API_BASE_URL}/plantas/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async crearPlanta(data: PlantaCreate): Promise<PlantaResponse> {
    const response = await fetch(`${API_BASE_URL}/plantas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async actualizarPlanta(id: number, data: PlantaUpdate): Promise<PlantaResponse> {
    const response = await fetch(`${API_BASE_URL}/plantas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async eliminarPlanta(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/plantas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      let errorData: any = {};
      try { errorData = await response.json(); } catch { throw new Error('Error al eliminar'); }
      throw new Error(errorData.detail || 'Error al eliminar');
    }
  },

  async generarPlantasParaLote(loteId: number): Promise<GenerarPlantasResponse> {
    const response = await fetch(`${API_BASE_URL}/plantas/generar-para-lote/${loteId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

export default plantaService;