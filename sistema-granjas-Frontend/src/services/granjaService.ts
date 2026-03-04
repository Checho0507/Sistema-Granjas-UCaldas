import type { Granja, Usuario, Programa } from '../types/granjaTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

// Función para manejar errores de respuesta
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error ${response.status}: ${response.statusText}`
    );
  }
  return response.json();
};

export const granjaService = {
  // ========== OPERACIONES CRUD BÁSICAS ==========
  async obtenerGranjas(): Promise<Granja[]> {
    const response = await fetch(`${API_BASE_URL}/granjas`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async obtenerGranjaPorId(id: number): Promise<Granja> {
    const response = await fetch(`${API_BASE_URL}/granjas/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async crearGranja(datosGranja: Omit<Granja, 'id' | 'fecha_creacion'>): Promise<Granja> {
    const response = await fetch(`${API_BASE_URL}/granjas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datosGranja)
    });
    return handleResponse(response);
  },

  async actualizarGranja(id: number, datosGranja: Partial<Granja>): Promise<Granja> {
    const response = await fetch(`${API_BASE_URL}/granjas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(datosGranja)
    });
    return handleResponse(response);
  },

  async eliminarGranja(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/granjas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========== GESTIÓN DE USUARIOS ==========
  async obtenerUsuarios(): Promise<Usuario[]> {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async obtenerUsuariosPorGranja(granjaId: number): Promise<Usuario[]> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/usuarios`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async asignarUsuario(granjaId: number, usuarioId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/usuarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ usuario_id: usuarioId })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al asignar usuario');
    }
  },

  async removerUsuario(granjaId: number, usuarioId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/usuarios/${usuarioId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al remover usuario');
    }
  },

  // ========== GESTIÓN DE PROGRAMAS ==========
  async obtenerProgramas(): Promise<Programa[]> {
    const response = await fetch(`${API_BASE_URL}/programas`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async obtenerProgramasPorGranja(granjaId: number): Promise<Programa[]> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/programas`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async asignarPrograma(granjaId: number, programaId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/programas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ programa_id: programaId })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al asignar programa');
    }
  },

  async removerPrograma(granjaId: number, programaId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/programas/${programaId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al remover programa');
    }
  }
};

export default granjaService;