// frontend/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/router';
import apiClient from '../lib/apiClient';
import toast from 'react-hot-toast';
import { User, AuthContextType, ApiResponse } from '../types'; // Importiere deine Typen

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Wichtig für initiales Laden
    const router = useRouter();

    const fetchCurrentUser = useCallback(async (existingToken?: string | null) => {
        const currentToken = existingToken || localStorage.getItem('quizduell_token');
        if (currentToken) {
            try {
                // Setze den Token für apiClient, falls er noch nicht gesetzt ist (z.B. nach Hard Refresh)
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
                const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
                if (response.data.status === 'success' && response.data.data?.user) {
                    // Das Backend sendet unter /auth/me nur id und role.
                    // Wir brauchen mehr Details, also laden wir das volle Profil.
                    const profileResponse = await apiClient.get<ApiResponse<{ profile: User }>>(`/users/profile/${response.data.data.user.id}`);
                    if (profileResponse.data.status === 'success' && profileResponse.data.data?.profile) {
                        setUser(profileResponse.data.data.profile);
                        setToken(currentToken);
                    } else {
                        throw new Error('Profil konnte nicht geladen werden.');
                    }
                } else {
                    // Token ist ungültig oder User nicht gefunden
                    logout(); // Token entfernen und User null setzen
                }
            } catch (error) {
                console.error('Fehler beim Abrufen des aktuellen Benutzers:', error);
                logout(); // Bei Fehler Token entfernen
            }
        }
        setIsLoading(false);
    }, []);


    useEffect(() => {
        const storedToken = localStorage.getItem('quizduell_token');
        if (storedToken) {
            fetchCurrentUser(storedToken);
        } else {
            setIsLoading(false); // Kein Token, also nicht laden
        }
    }, [fetchCurrentUser]);

    const login = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { email, password: pass });
            if (response.data.status === 'success' && response.data.data) {
                const { token: newToken, user: loggedInUser } = response.data.data;
                localStorage.setItem('quizduell_token', newToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                setUser(loggedInUser);
                setToken(newToken);
                toast.success(`Willkommen zurück, ${loggedInUser.name}!`);
                router.push('/'); // Zur Startseite oder Dashboard
            }
        } catch (error: any) {
            // Fehler wird bereits vom apiClient Interceptor getoastet
            console.error('Login fehlgeschlagen:', error.response?.data?.message || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, pass: string, uniHandle?: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/register', { name, email, password: pass, uniHandle });
            if (response.data.status === 'success' && response.data.data) {
                const { token: newToken, user: registeredUser } = response.data.data;
                localStorage.setItem('quizduell_token', newToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                setUser(registeredUser);
                setToken(newToken);
                toast.success(`Registrierung erfolgreich, ${registeredUser.name}!`);
                router.push('/');
            }
        } catch (error: any) {
            console.error('Registration failed:', error);
            // Re-throw the error so it can be caught by the component
            throw error;
        } finally {
            // Always reset loading state, regardless of success or failure
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('quizduell_token');
        delete apiClient.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
        toast.success('Erfolgreich ausgeloggt.');
        router.push('/login'); // Zur Login-Seite
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, fetchCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};