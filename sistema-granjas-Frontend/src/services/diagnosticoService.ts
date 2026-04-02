import type {
  DiagnosticoItem,
  CrearDiagnosticoDTO,
  ActualizarDiagnosticoDTO,
  EstadisticasDiagnostico,
  DiagnosticoFiltros,
  Evidencia,
  DiagnosticoDetalle
} from '../types/diagnosticoTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = (multipart = false): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {};
  if (!multipart) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export const diagnosticoService = {

  // ===================== CRUD =====================

  async obtenerDiagnosticos(filtros?: DiagnosticoFiltros): Promise<DiagnosticoItem[]> {
    const params = new URLSearchParams();
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const url = `${API_BASE_URL}/diagnosticos${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url, { headers: getHeaders() });
    return handleResponse(response);
  },

  async obtenerDiagnosticoPorId(id: number): Promise<DiagnosticoDetalle> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // NUEVO: crear con FormData (incluye archivos)
  async crearDiagnostico(formData: FormData): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/`, {
      method: 'POST',
      headers: getHeaders(true), // multipart
      body: formData
    });
    return handleResponse(response);
  },

  // NUEVO: actualizar con FormData
  async actualizarDiagnostico(id: number, formData: FormData): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(response);
  },

  // Método legacy (si se necesita enviar JSON sin archivos) - lo mantengo por si acaso
  async crearDiagnosticoJSON(datos: CrearDiagnosticoDTO): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });
    return handleResponse(response);
  },

  async actualizarDiagnosticoJSON(id: number, datos: ActualizarDiagnosticoDTO): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });
    return handleResponse(response);
  },

  async eliminarDiagnostico(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Error eliminando diagnóstico');
    }
  },

  // ===================== ACCIONES ESPECIALES =====================

  async asignarDocente(id: number, docenteId: number): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}/asignar-docente`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ docente_id: docenteId })
    });
    return handleResponse(response);
  },

  async cerrarDiagnostico(id: number, observaciones: string = ''): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}/cerrar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ observaciones })
    });
    return handleResponse(response);
  },

  async obtenerEstadisticas(): Promise<EstadisticasDiagnostico> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/estadisticas/resumen`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async obtenerEvidencias(diagnosticoId: number): Promise<Evidencia[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/evidencias/diagnostico/${diagnosticoId}`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error(`Error ${response.status} obteniendo evidencias`);
      const data = await response.json();
      if (Array.isArray(data)) return data;
      if (data?.items) return data.items;
      if (data?.evidencias) return data.evidencias;
      return [];
    } catch (e) {
      console.error("Error en obtenerEvidencias:", e);
      return [];
    }
  },

  async eliminarEvidencia(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/evidencias/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
  },

  // ===================== AUXILIARES =====================
  async obtenerTiposDiagnostico(): Promise<string[]> {
    return ['censo_poblacional', 'monitoreo_fenologico', 'artropodos', 'enfermedades', 'arvenses', 'controladores_biologicos', 'polinizadores'];
  },

  async obtenerEstadosDiagnostico(): Promise<string[]> {
    return ['abierto', 'en_revision', 'cerrado'];
  }
};

// Aliases
export const getDiagnosticos = diagnosticoService.obtenerDiagnosticos;
export const getDiagnosticoById = diagnosticoService.obtenerDiagnosticoPorId;
export const createDiagnostico = diagnosticoService.crearDiagnostico;
export const updateDiagnostico = diagnosticoService.actualizarDiagnostico;
export const deleteDiagnostico = diagnosticoService.eliminarDiagnostico;
export const assignDocente = diagnosticoService.asignarDocente;
export const closeDiagnostico = diagnosticoService.cerrarDiagnostico;
export const getDiagnosticoStats = diagnosticoService.obtenerEstadisticas;

export default diagnosticoService;