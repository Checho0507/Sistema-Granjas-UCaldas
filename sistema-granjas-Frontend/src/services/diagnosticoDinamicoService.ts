import { api } from './api';

export interface DiagnosticoTipo {
  id: number;
  programa_id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
  created_at: string;
  campos?: DiagnosticoCampo[];
}

export interface DiagnosticoCampo {
  id: number;
  tipo_id: number;
  nombre_campo: string;
  etiqueta: string;
  tipo_dato: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
  requerido: boolean;
  opciones?: string[];
  orden: number;
}

export const diagnosticoDinamicoService = {
  listarTiposPorPrograma: async (programaId: number): Promise<DiagnosticoTipo[]> => {
    const res = await api.get(`/diagnosticos-dinamico/programas/${programaId}/tipos`);
    return res.data;
  },

  obtenerTipo: async (tipoId: number): Promise<DiagnosticoTipo> => {
    const res = await api.get(`/diagnosticos-dinamico/tipos/${tipoId}`);
    return res.data;
  },

  crearTipo: async (data: Omit<DiagnosticoTipo, 'id' | 'created_at'>): Promise<DiagnosticoTipo> => {
    const res = await api.post('/diagnosticos-dinamico/tipos', data);
    return res.data;
  },

  actualizarTipo: async (tipoId: number, data: Partial<DiagnosticoTipo>): Promise<DiagnosticoTipo> => {
    const res = await api.put(`/diagnosticos-dinamico/tipos/${tipoId}`, data);
    return res.data;
  },

  eliminarTipo: async (tipoId: number): Promise<void> => {
    await api.delete(`/diagnosticos-dinamico/tipos/${tipoId}`);
  },

  listarCampos: async (tipoId: number): Promise<DiagnosticoCampo[]> => {
    const res = await api.get(`/diagnosticos-dinamico/tipos/${tipoId}/campos`);
    return res.data;
  },

  crearCampo: async (data: Omit<DiagnosticoCampo, 'id'>): Promise<DiagnosticoCampo> => {
    const res = await api.post('/diagnosticos-dinamico/campos', data);
    return res.data;
  },

  actualizarCampo: async (campoId: number, data: Partial<DiagnosticoCampo>): Promise<DiagnosticoCampo> => {
    const res = await api.put(`/diagnosticos-dinamico/campos/${campoId}`, data);
    return res.data;
  },

  eliminarCampo: async (campoId: number): Promise<void> => {
    await api.delete(`/diagnosticos-dinamico/campos/${campoId}`);
  },
};
