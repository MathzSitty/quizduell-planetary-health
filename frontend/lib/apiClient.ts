// frontend/lib/apiClient.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor, um den Token hinzuzufügen
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') { // Stelle sicher, dass es im Browser-Kontext ist
            const token = localStorage.getItem('quizduell_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response Interceptor für globale Fehlerbehandlung (optional)
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; data?: any }>) => {
        const message = error.response?.data?.message || error.message || 'Ein unbekannter Fehler ist aufgetreten.';

        // Zeige einen Toast für Fehler, außer für 401 (wird oft speziell behandelt)
        if (error.response?.status !== 401) {
            toast.error(message);
        }

        // Spezifische Behandlung für 401 Unauthorized (z.B. Token abgelaufen)
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // Hier könntest du den Benutzer ausloggen oder zu /login weiterleiten
                // localStorage.removeItem('quizduell_token');
                // window.location.href = '/login'; // Harte Weiterleitung
                // Besser: Über AuthContext handhaben
                console.warn('API request unauthorized (401). Token might be invalid or expired.');
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;