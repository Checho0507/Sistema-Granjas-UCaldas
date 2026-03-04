// src/services/asignacionService.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface RelacionProgramaGranja {
  programa_id: number;
  granja_id: number;
}

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`
    );
  }
  return response.json();
};

export const asignacionService = {
  async obtenerRelacionesProgramaGranja(): Promise<RelacionProgramaGranja[]> {
    const url = `${API_BASE_URL}/asignaciones/programa-granja`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse<RelacionProgramaGranja[]>(response);
  },

  async obtenerProgramasPorGranja(granjaId: number): Promise<any[]> {
    const url = `${API_BASE_URL}/asignaciones/granja/${granjaId}/programas`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse<any[]>(response);
  },

  async obtenerGranjasPorPrograma(programaId: number): Promise<any[]> {
    const url = `${API_BASE_URL}/asignaciones/programa/${programaId}/granjas`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse<any[]>(response);
  }
};

export default asignacionService;