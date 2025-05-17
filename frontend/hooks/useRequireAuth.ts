// frontend/hooks/useRequireAuth.ts
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface UseRequireAuthOptions {
    redirectTo?: string;
    requireAdmin?: boolean;
}

export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { redirectTo = '/login', requireAdmin = false } = options;

    useEffect(() => {
        if (!isLoading && !user) {
            router.push(redirectTo);
        } else if (!isLoading && user && requireAdmin && user.role !== 'ADMIN') {
            // Wenn Admin-Rolle erforderlich ist, aber der User kein Admin ist
            toast.error('Zugriff verweigert. Nur für Administratoren.');
            router.push('/'); // Oder eine andere Seite, z.B. /unauthorized
        }
    }, [user, isLoading, router, redirectTo, requireAdmin]);

    return { user, isLoading };
};

// Beispiel für Toast, falls noch nicht importiert
import toast from 'react-hot-toast';