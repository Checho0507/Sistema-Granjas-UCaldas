// src/services/asignacionService.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface RelacionProgramaGranja {
  programa_id: number;
  granja_id: number;
}

// Función para obtener headers con token
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

// Manejo unificado de respuestas HTTP
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`
    );
  }
  // Si la respuesta es 204 No Content, devolvemos null (o un objeto vacío según convenga)
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
};

export const asignacionService = {
  /**
   * Obtiene todas las relaciones programa-granja desde la tabla pivote.
   * @returns Promise con array de objetos { programa_id, granja_id }
   */
  async obtenerRelacionesProgramaGranja(): Promise<RelacionProgramaGranja[]> {
    const url = `${API_BASE_URL}/asignaciones/programa-granja`;
    console.log('🔗 GET', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<RelacionProgramaGranja[]>(response);
  },

  /**
   * Obtiene los programas asignados a una granja específica (si el endpoint existe).
   * @param granjaId ID de la granja
   */
  async obtenerProgramasPorGranja(granjaId: number): Promise<any[]> {
    const url = `${API_BASE_URL}/asignaciones/granja/${granjaId}/programas`;
    console.log('🔗 GET', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<any[]>(response);
  },

  /**
   * Obtiene las granjas asignadas a un programa específico (si el endpoint existe).
   * @param programaId ID del programa
   */
  async obtenerGranjasPorPrograma(programaId: number): Promise<any[]> {
    const url = `${API_BASE_URL}/asignaciones/programa/${programaId}/granjas`;
    console.log('🔗 GET', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<any[]>(response);
  },
};

export default asignacionService;