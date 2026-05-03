// src/services/tipoLaborService.ts
const API_BASE_URL = '/api';

const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

export const tipoLaborService = {
    async obtenerTiposLabor(): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/tipos-labor`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    },

    async obtenerTipoLaborPorId(id: number): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/tipos-labor/${id}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    },

    async crearTipoLabor(data: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/tipos-labor`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    }
};

export default tipoLaborService;