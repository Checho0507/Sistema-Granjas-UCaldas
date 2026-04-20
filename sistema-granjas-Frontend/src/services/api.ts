import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    // No definas 'Content-Type' aquí; se establecerá automáticamente
});

// Interceptor para agregar el token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Si el cuerpo es FormData, eliminar Content-Type para que el navegador lo establezca con el boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Error de API:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);