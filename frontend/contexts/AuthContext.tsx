// frontend/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../lib/apiClient';
import toast from 'react-hot-toast';
import { User, AuthContextType, ApiResponse } from '../types'; // Importiere deine Typen

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Lade Token und User beim Start der App
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            setToken(storedToken);
            fetchCurrentUser(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchCurrentUser = async (authToken?: string | null) => {
        const tokenToUse = authToken || token;
        if (!tokenToUse) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me', {
                headers: { Authorization: `Bearer ${tokenToUse}` }
            });
            
            if (response.data.status === 'success' && response.data.data?.user) {
                setUser(response.data.data.user);
                setToken(tokenToUse);
                localStorage.setItem('authToken', tokenToUse);
                
                // Set default authorization header
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
            } else {
                throw new Error('Ungültige Antwort vom Server');
            }
        } catch (error: any) {
            console.error('Fehler beim Laden des Benutzers:', error);
            
            // Bei 401 (Unauthorized) Token löschen
            if (error.response?.status === 401) {
                logout();
            } else {
                toast.error('Fehler beim Laden der Benutzerdaten.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
                email,
                password
            });

            if (response.data.status === 'success' && response.data.data) {
                const { token: newToken, user: newUser } = response.data.data;
                
                setToken(newToken);
                setUser(newUser);
                localStorage.setItem('authToken', newToken);
                
                // Set default authorization header
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                
                toast.success(`Willkommen zurück, ${newUser.name}!`);
            } else {
                throw new Error(response.data.message || 'Login fehlgeschlagen');
            }
        } catch (error: any) {
            console.error('Login-Fehler:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.';
            toast.error(errorMessage);
            throw error; // Re-throw für Form-Handling
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string, uniHandle?: string) => {
        try {
            setIsLoading(true);
            const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/register', {
                name,
                email,
                password,
                uniHandle
            });

            if (response.data.status === 'success' && response.data.data) {
                const { token: newToken, user: newUser } = response.data.data;
                
                setToken(newToken);
                setUser(newUser);
                localStorage.setItem('authToken', newToken);
                
                // Set default authorization header
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                
                toast.success(`Willkommen, ${newUser.name}! Registrierung erfolgreich.`);
            } else {
                throw new Error(response.data.message || 'Registrierung fehlgeschlagen');
            }
        } catch (error: any) {
            console.error('Registrierungs-Fehler:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
            toast.error(errorMessage);
            throw error; // Re-throw für Form-Handling
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        
        // Remove authorization header
        delete apiClient.defaults.headers.common['Authorization'];
        
        toast.success('Erfolgreich abgemeldet.');
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        fetchCurrentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};