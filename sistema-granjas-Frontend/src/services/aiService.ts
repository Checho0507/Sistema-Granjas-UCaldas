import { api } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  respuesta: string;
  sesion_id: number;
}

export interface ResumenResponse {
  resumen: string;
  diagnostico_id: number;
}

export interface SesionChat {
  id: number;
  titulo: string;
  created_at: string;
  updated_at: string;
  total_mensajes: number;
}

export interface MensajeChat {
  id: number;
  rol: 'user' | 'assistant';
  contenido: string;
  created_at: string;
}

export const aiService = {
  async generarResumenDiagnostico(diagnosticoId: number): Promise<ResumenResponse> {
    const response = await api.post<ResumenResponse>(`/ai/resumen-diagnostico/${diagnosticoId}`);
    return response.data;
  },

  async enviarMensajeChat(pregunta: string, sesionId?: number): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/ai/chat', {
      pregunta,
      sesion_id: sesionId ?? null,
    });
    return response.data;
  },

  async listarSesiones(): Promise<SesionChat[]> {
    const response = await api.get<SesionChat[]>('/ai/sesiones');
    return response.data;
  },

  async crearSesion(titulo?: string): Promise<SesionChat> {
    const response = await api.post<SesionChat>('/ai/sesiones', { titulo: titulo ?? 'Nueva conversación' });
    return response.data;
  },

  async eliminarSesion(sesionId: number): Promise<void> {
    await api.delete(`/ai/sesiones/${sesionId}`);
  },

  async renombrarSesion(sesionId: number, titulo: string): Promise<void> {
    await api.patch(`/ai/sesiones/${sesionId}/titulo`, { titulo });
  },

  async cargarMensajes(sesionId: number): Promise<MensajeChat[]> {
    const response = await api.get<MensajeChat[]>(`/ai/sesiones/${sesionId}/mensajes`);
    return response.data;
  },
};
