// backend/src/server.ts
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app, { prisma } from './app'; // Importiere die Express App und Prisma Instanz
import config from './config';
import { initializeSocketIO } from './sockets/game.socket';

const PORT = config.port;

const httpServer = http.createServer(app);

// Socket.IO Setup
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: config.frontendUrl, // Erlaube Verbindungen vom Frontend
        methods: ['GET', 'POST'],
        credentials: true,
    },
    // pingTimeout: 60000, // Optional: Erhöhe Timeout
});

initializeSocketIO(io); // Initialisiere Socket.IO Event Handler

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Prisma: Successfully connected to the database.');

        httpServer.listen(PORT, () => {
            console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
            console.log(`🔌 Socket.IO server is listening on port ${PORT}`);
            console.log(`NODE_ENV: ${config.nodeEnv}`); // Hier war der Fehler: config.env -> config.nodeEnv
        });
    } catch (error) {
        console.error('❌ Prisma: Failed to connect to the database or start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
    process.on(signal, async () => {
        console.log(`\n${signal} signal received. Closing HTTP server...`);
        httpServer.close(async () => {
            console.log('✅ HTTP server closed.');
            await prisma.$disconnect();
            console.log('✅ Prisma connection closed.');
            process.exit(0);
        });
    });
});