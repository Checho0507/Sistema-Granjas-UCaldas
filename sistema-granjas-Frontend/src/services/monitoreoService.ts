// services/monitoreoService.ts
import { api } from './api';

export interface Monitoreo {
  id: number;
  nombre: string;
  programa_id: number;
  created_at?: string;
}

export const monitoreoService = {
  async obtenerMonitoreos(skip: number = 0, limit: number = 100): Promise<Monitoreo[]> {
    const response = await api.get('/monitoreos/', { params: { skip, limit } });
    return response.data;
  },

  async obtenerMonitoreoPorId(id: number): Promise<Monitoreo> {
    const response = await api.get(`/monitoreos/${id}`);
    return response.data;
  },

  async crearMonitoreo(datosMonitoreo: Omit<Monitoreo, 'id' | 'created_at'>): Promise<Monitoreo> {
    const response = await api.post('/monitoreos/', datosMonitoreo);
    return response.data;
  },

  async actualizarMonitoreo(id: number, datosMonitoreo: Partial<Monitoreo>): Promise<Monitoreo> {
    const response = await api.put(`/monitoreos/${id}`, datosMonitoreo);
    return response.data;
  },

  async eliminarMonitoreo(id: number): Promise<void> {
    await api.delete(`/monitoreos/${id}`);
  },

  async obtenerMonitoreosPorPrograma(programaId: number): Promise<Monitoreo[]> {
    const response = await api.get(`/monitoreos/programa/${programaId}`);
    return response.data;
  }
};

export default monitoreoService;