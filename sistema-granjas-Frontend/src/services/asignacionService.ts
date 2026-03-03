// src/services/asignacionService.ts

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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`
    );
  }
  return response.json();
};

export const asignacionService = {
  // Obtener todas las relaciones programa-granja (tabla pivote)
  async obtenerRelacionesProgramaGranja(): Promise<{ programa_id: number; granja_id: number }[]> {
    const response = await fetch(`${API_BASE_URL}/asignaciones/programa-granja`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Obtener programas por granja (si existe endpoint específico)
  async obtenerProgramasPorGranja(granjaId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/asignaciones/granja/${granjaId}/programas`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Obtener granjas por programa (si existe endpoint específico)
  async obtenerGranjasPorPrograma(programaId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/asignaciones/programa/${programaId}/granjas`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

export default asignacionService;