// frontend/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket as SocketIOClientSocket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SocketContextType } from '../types';

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Exportiere beide Namen für Abwärtskompatibilität
export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

// Füge den alternativen Namen hinzu
export const useSocketContext = useSocket;

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<SocketIOClientSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user, token } = useAuth();

    useEffect(() => {
        if (user && token && process.env.NEXT_PUBLIC_SOCKET_URL) {
            // Nur verbinden, wenn User und Token vorhanden sind
            const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
                auth: {
                    // Sende den Token für serverseitige Socket-Authentifizierung
                    // token: token,
                    // Alternativ, wenn das Backend userId erwartet (wie im Backend Socket-Code):
                    userId: user.id
                },
                reconnectionAttempts: 5,
                transports: ['websocket'], // Bevorzuge WebSockets
            });

            newSocket.on('connect', () => {
                console.log('Socket.IO: Connected - ID:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket.IO: Disconnected - Reason:', reason);
                setIsConnected(false);
                if (reason === 'io server disconnect') {
                    // Der Server hat die Verbindung aktiv getrennt, z.B. bei Auth-Fehler
                    newSocket.connect(); // Versuche erneut zu verbinden
                }
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket.IO: Connection Error -', err.message, (err as any)?.data || '');
                // Hier könntest du dem Benutzer eine Nachricht anzeigen oder spezielle Logik implementieren
            });

            // Globale Server-Fehlermeldungen vom Socket abfangen
            newSocket.on('server_error', (data: { message: string }) => {
                console.error('Socket.IO: Server Error Received -', data.message);
                // toast.error(`Server Fehler: ${data.message}`); // Optional: globalen Toast anzeigen
            });


            setSocket(newSocket);

            return () => {
                console.log('Socket.IO: Cleaning up socket connection.');
                newSocket.close();
                setIsConnected(false);
                setSocket(null);
            };
        } else if (!user && socket) {
            // Wenn User ausgeloggt wird, bestehende Verbindung schließen
            console.log('Socket.IO: User logged out, closing socket.');
            socket.close();
            setSocket(null);
            setIsConnected(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, token]); // Abhängigkeiten: user und token

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};