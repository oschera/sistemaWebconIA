import axios from 'axios';

// Creamos una instancia de axios con la URL base de tu backend FastAPI
const api = axios.create({
    baseURL: 'http://localhost:8000', // URL de tu backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de peticiones: Se ejecuta ANTES de que cualquier petición salga al backend
api.interceptors.request.use(
    (config) => {
        // Buscamos el token en el almacenamiento local del navegador
        const token = localStorage.getItem('token');
        
        // Si el token existe, lo adjuntamos a los encabezados (Headers)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
