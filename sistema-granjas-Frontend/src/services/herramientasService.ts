// src/services/herramientaService.ts
const API_BASE_URL = '/api';

const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

export const herramientaService = {
    async obtenerHerramientas(): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/herramientas`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    },

    async obtenerHerramientaPorId(id: number): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/herramientas/${id}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    }
};

export default herramientaService;