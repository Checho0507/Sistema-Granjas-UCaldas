// src/services/insumoService.ts
const API_BASE_URL = '/api';

const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

export const insumoService = {
    async obtenerInsumos(): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/insumos`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    },

    async obtenerInsumoPorId(id: number): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/insumos/${id}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    }
};

export default insumoService;