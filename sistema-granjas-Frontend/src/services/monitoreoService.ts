import { API_BASE_URL, getHeaders, handleResponse } from './api';

export interface Monitoreo {
    id: number;
    nombre: string;
    programa_id: number;
    created_at?: string;
}

export const monitoreoService = {
    async obtenerMonitoreosPorPrograma(programaId: number): Promise<Monitoreo[]> {
        const response = await fetch(`${API_BASE_URL}/monitoreos/programa/${programaId}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async obtenerMonitoreos(): Promise<Monitoreo[]> {
        const response = await fetch(`${API_BASE_URL}/monitoreos/`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

export default monitoreoService;