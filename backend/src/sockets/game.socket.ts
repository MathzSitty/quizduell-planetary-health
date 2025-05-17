import { Server, Socket } from 'socket.io';
import { Game, Question, User } from '@prisma/client';
import { GameStatus } from '../types/enums';
import { prisma } from '../app'; // Prisma Instanz
import {
    createGameService,
    findOpenGameService,
    joinGameService,
    submitAnswerService,
    forfeitGameService,
    getGameDetailsService,
} from '../services/game.service'; // Importiere Game Services
import { AppError } from '../utils/AppError'; // Deine AppError Klasse

// Hilfsfunktionen oder In-Memory-Speicher für Sockets
// Mapping von userId zu socketId für direkte Nachrichten
const userSockets = new Map<string, string>(); // userId -> socketId

// Mapping von gameId zu einem Set von Socket-IDs der Spieler im Spiel
const gameRooms = new Map<string, Set<string>>(); // gameId -> Set<socketId>

// Map um aktive Sucher zu verfolgen (userId -> timestamp)
const activeSeekers = new Map<string, number>();

const QUESTION_TIME_LIMIT_SECONDS = 15;

interface AuthenticatedSocket extends Socket {
    data: {
        userId?: string;
        // weitere Daten, die du an den Socket binden möchtest
    }
}

export function initializeSocketIO(io: Server) {
    // Socket.IO Middleware für Authentifizierung (optional, aber empfohlen)
    io.use(async (socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token; // Erwartet Token vom Client
        // Hier könntest du den Token validieren (z.B. mit jwt.util)
        // und die userId an socket.data binden.
        // Für dieses Beispiel nehmen wir an, der Client sendet userId direkt (weniger sicher)
        const userId = socket.handshake.auth.userId;
        if (userId) {
            socket.data.userId = userId;
            userSockets.set(userId, socket.id); // Speichere userId -> socketId Mapping
            console.log(`Socket ${socket.id} authenticated for user ${userId}`);
            next();
        } else {
            console.log(`Socket ${socket.id} authentication failed: No userId provided.`);
            next(new Error('Authentication error: userId is required'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`User connected via socket: ${socket.id}, UserID: ${socket.data.userId}`);

        socket.on('disconnect', async () => {
            const userId = socket.data.userId;
            console.log(`User disconnected: ${socket.id}, UserID: ${userId}`);
            if (userId) {
                userSockets.delete(userId);
                
                // Entferne aus aktiveSeekers
                activeSeekers.delete(userId);
                
                // Logik, um Spiele zu beenden, wenn ein Spieler disconnected
                // Finde alle aktiven Spiele, an denen dieser User teilnimmt
                const gamesAsPlayer = await prisma.game.findMany({
                    where: {
                        OR: [{ player1Id: userId }, { player2Id: userId }],
                        status: { in: [GameStatus.ACTIVE, GameStatus.PENDING] }
                    }
                });

                for (const game of gamesAsPlayer) {
                    try {
                        const forfeitedGame = await forfeitGameService(game.id, userId);
                        // Benachrichtige den anderen Spieler
                        const opponentId = game.player1Id === userId ? game.player2Id : game.player1Id;
                        if (opponentId) {
                            const opponentSocketId = userSockets.get(opponentId);
                            if (opponentSocketId) {
                                io.to(opponentSocketId).emit('opponent_forfeited', { gameId: game.id, forfeitedPlayerId: userId, winnerId: forfeitedGame.winnerId });
                            }
                        }
                        io.to(game.id).emit('game_updated', forfeitedGame); // Update für alle im Raum
                        console.log(`Game ${game.id} forfeited by ${userId} due to disconnect.`);
                        // Raum aufräumen
                        gameRooms.delete(game.id);

                    } catch (error) {
                        console.error(`Error forfeiting game ${game.id} on disconnect:`, error);
                    }
                }
            }
        });

        socket.on('error', (err) => {
            console.error(`Socket error for ${socket.id} (User: ${socket.data.userId}):`, err.message);
            // Hier könntest du dem Client eine generische Fehlermeldung senden
            socket.emit('server_error', { message: "Ein interner Serverfehler ist aufgetreten." });
        });

        socket.on('cancel_search', async (callback) => {
            if (!socket.data.userId) {
                return callback?.({ error: 'Nicht authentifiziert.' });
            }
            
            try {
                // Finde offene Spiele, die von diesem User erstellt wurden
                const pendingGames = await prisma.game.findMany({
                    where: {
                        player1Id: socket.data.userId,
                        status: GameStatus.PENDING,
                        player2Id: null
                    }
                });
                
                // Spiele als abgebrochen markieren
                for (const game of pendingGames) {
                    await prisma.game.update({
                        where: { id: game.id },
                        data: { status: GameStatus.CANCELLED }
                    });
                    console.log(`Game ${game.id} cancelled by ${socket.data.userId}`);
                }
                
                // Entferne Socket-ID aus der aktiveSuchende Map
                activeSeekers.delete(socket.data.userId);
                
                callback?.({ success: true, cancelledGames: pendingGames.length });
            } catch (error: any) {
                console.error('Error in cancel_search:', error);
                callback?.({ error: error.message || 'Fehler beim Abbrechen der Suche.' });
            }
        });

        socket.on('find_game', async (callback) => {
            if (!socket.data.userId) {
                return callback({ error: 'Nicht authentifiziert.' });
            }
            
            try {
                // Markiere diesen User als aktiv suchend
                activeSeekers.set(socket.data.userId, Date.now());
                
                // Zuerst prüfen, ob User bereits ein offenes Spiel hat
                const existingPendingGames = await prisma.game.findMany({
                    where: {
                        player1Id: socket.data.userId,
                        status: GameStatus.PENDING,
                        player2Id: null
                    }
                });
                
                // Vorhandene offene Spiele dieses Users abbrechen
                for (const oldGame of existingPendingGames) {
                    await prisma.game.update({
                        where: { id: oldGame.id },
                        data: { status: GameStatus.CANCELLED }
                    });
                }
                
                // Suche nach offenen Spielen von anderen aktiven Suchern
                let game = await prisma.game.findFirst({
                    where: {
                        status: GameStatus.PENDING,
                        player1Id: { not: socket.data.userId },
                        player2Id: null
                    },
                    orderBy: { createdAt: 'asc' }
                });
                
                let waiting = false;
                
                if (game) {
                    // Prüfen, ob der Ersteller noch aktiv sucht (innerhalb der letzten 30 Sekunden)
                    const creatorIsActive = activeSeekers.has(game.player1Id) && 
                                           (Date.now() - activeSeekers.get(game.player1Id)! < 30000);
                                           
                    if (creatorIsActive) {
                        // Game gefunden, beitreten
                        const joinedGameData = await joinGameService({ gameId: game.id, player2Id: socket.data.userId });
                        const questions = (joinedGameData as any).rounds.map((r: any) => r.question);
                        
                        socket.join(game.id);
                        addSocketToGameRoom(game.id, socket.id);
                        
                        // Benachrichtige Spieler 1
                        const player1SocketId = userSockets.get(game.player1Id);
                        if (player1SocketId) {
                            const opponentUser = await prisma.user.findUnique({ where: { id: socket.data.userId } });
                            io.to(player1SocketId).emit('player_joined', { 
                                game, 
                                opponent: { id: socket.data.userId, name: opponentUser?.name } 
                            });
                        }
                        
                        // Game Start Event an beide
                        io.to(game.id).emit('game_started', { 
                            game: joinedGameData, 
                            questions,
                            timeLimit: QUESTION_TIME_LIMIT_SECONDS 
                        });
                        
                        // Entferne beide aus aktiveSeekers nach dem Match
                        activeSeekers.delete(socket.data.userId);
                        activeSeekers.delete(game.player1Id);
                        
                        callback({ game: joinedGameData, questions, waiting });
                    } else {
                        // Der Ersteller des Spiels ist nicht mehr aktiv, ignoriere dieses Spiel und erstelle ein neues
                        game = await createGameService({ player1Id: socket.data.userId });
                        waiting = true;
                        socket.join(game.id);
                        addSocketToGameRoom(game.id, socket.id);
                        callback({ game, waiting });
                    }
                } else {
                    // Kein passendes Spiel, neues erstellen
                    game = await createGameService({ player1Id: socket.data.userId });
                    waiting = true;
                    socket.join(game.id);
                    addSocketToGameRoom(game.id, socket.id);
                    callback({ game, waiting });
                }
            } catch (error: any) {
                console.error('Error in find_game:', error);
                callback?.({ error: error.message || 'Fehler bei der Spielsuche.' });
            }
        });

        socket.on('submit_answer', async ({ gameId, roundNumber, selectedOption }, callback) => {
            if (!socket.data.userId) return callback({ error: 'Nicht authentifiziert.' });
            try {
                const result = await submitAnswerService(gameId, socket.data.userId, roundNumber, selectedOption);
                
                // Überprüfen, ob beide Spieler geantwortet haben
                const isAnswerComplete = result.roundResult.player1Answer !== null && result.roundResult.player2Answer !== null;

                // Informiere den anderen Spieler, dass dieser Spieler geantwortet hat
                socket.to(gameId).emit('opponent_answered', { 
                    playerId: socket.data.userId,
                    roundNumber
                });

                // WICHTIG: Nur dann das volle Rundenergebnis senden, wenn beide geantwortet haben
                // Ansonsten nur dem Spieler bestätigen, dass seine Antwort registriert wurde
                if (isAnswerComplete) {
                    // Beide haben geantwortet - sende vollständiges Rundenergebnis an alle
                    io.to(gameId).emit('round_result', {
                        gameId,
                        ...result.roundResult,
                        nextQuestion: result.nextQuestion,
                        gameStatus: result.game.status
                    });

                    // Wenn die Runde oder das Spiel beendet ist
                    if (result.game.status === GameStatus.FINISHED) {
                        io.to(gameId).emit('game_over', result.game);
                        // Räume aufräumen
                        gameRooms.delete(gameId);
                    }
                }

                callback({ 
                    success: true, 
                    currentScore: socket.data.userId === result.game.player1Id ? result.game.player1Score : result.game.player2Score,
                    bothAnswered: isAnswerComplete
                });
            } catch (error: any) {
                console.error(`Error in submit_answer for game ${gameId}:`, error);
                callback({ error: error.message || 'Fehler beim Übermitteln der Antwort.' });
            }
        });

        socket.on('leave_game', async ({ gameId }) => {
            if (!socket.data.userId) return;
            try {
                const game = await prisma.game.findUnique({where: {id: gameId}});
                if (!game) return;
                // Nur wenn das Spiel noch nicht beendet ist
                if (game.status === GameStatus.ACTIVE || game.status === GameStatus.PENDING) {
                    const forfeitedGame = await forfeitGameService(gameId, socket.data.userId);
                    const opponentId = game.player1Id === socket.data.userId ? game.player2Id : game.player1Id;
                    if (opponentId) {
                        const opponentSocketId = userSockets.get(opponentId);
                        if (opponentSocketId) {
                            io.to(opponentSocketId).emit('opponent_left', { gameId, leaverId: socket.data.userId, winnerId: forfeitedGame.winnerId });
                        }
                    }
                    io.to(gameId).emit('game_updated', forfeitedGame); // Update für alle im Raum
                    console.log(`Game ${gameId} left by ${socket.data.userId}.`);
                }
                socket.leave(gameId);
                removeSocketFromGameRoom(gameId, socket.id);
                if (game.status === GameStatus.FINISHED || game.status === GameStatus.CANCELLED) {
                    gameRooms.delete(gameId);
                }

            } catch (error) {
                console.error(`Error leaving game ${gameId}:`, error);
            }
        });

        socket.on('answer_timeout', async ({ gameId, roundNumber }, callback) => {
            if (!socket.data.userId) return callback?.({ error: 'Nicht authentifiziert.' });
            
            try {
                // Verwende null für Timeouts, wird als falsche Antwort gewertet
                const result = await submitAnswerService(gameId, socket.data.userId, roundNumber, null);
                
                // Informiere den anderen Spieler über den Timeout
                socket.to(gameId).emit('opponent_answered', { 
                    playerId: socket.data.userId,
                    roundNumber,
                    wasTimeout: true
                });

                // WICHTIG: Bei Timeout IMMER das Rundenergebnis senden, unabhängig davon, 
                // ob beide geantwortet haben oder nicht
                io.to(gameId).emit('round_result', {
                    gameId,
                    ...result.roundResult,
                    nextQuestion: result.nextQuestion,
                    gameStatus: result.game.status,
                    forcedByTimeout: true  // Neues Flag zur Kennzeichnung von Timeout-erzwungenen Rundenwechseln
                });

                // Spielende-Logik
                if (result.game.status === GameStatus.FINISHED) {
                    io.to(gameId).emit('game_over', result.game);
                    gameRooms.delete(gameId);
                }
                
                callback?.({ 
                    success: true,
                    bothAnswered: true // Wir behandeln es, als hätten beide geantwortet
                });
            } catch (error: any) {
                console.error(`Error in answer_timeout for game ${gameId}:`, error);
                callback?.({ error: error.message || 'Fehler beim Verarbeiten des Timeouts.' });
            }
        });

        // Hilfsfunktion zum Verwalten von Spielräumen
        function addSocketToGameRoom(gameId: string, socketId: string) {
            if (!gameRooms.has(gameId)) {
                gameRooms.set(gameId, new Set());
            }
            gameRooms.get(gameId)?.add(socketId);
        }
        function removeSocketFromGameRoom(gameId: string, socketId: string) {
            gameRooms.get(gameId)?.delete(socketId);
            if (gameRooms.get(gameId)?.size === 0) {
                gameRooms.delete(gameId);
            }
        }
    });

    // Aufräum-Intervall für abgelaufene Spielsuchen (alle 5 Minuten)
    const cleanupInterval = setInterval(async () => {
        try {
            // Finde und breche alle PENDING Spiele ab, die älter als 10 Minuten sind
            const staleTime = new Date(Date.now() - 10 * 60 * 1000); // 10 Minuten
            
            const staleGames = await prisma.game.findMany({
                where: {
                    status: GameStatus.PENDING,
                    player2Id: null,
                    createdAt: { lt: staleTime }
                }
            });
            
            for (const game of staleGames) {
                await prisma.game.update({
                    where: { id: game.id },
                    data: { status: GameStatus.CANCELLED }
                });
                console.log(`Stale game ${game.id} auto-cancelled after 10 minutes`);
            }
            
            // Entferne inaktive Sucher nach 5 Minuten
            const now = Date.now();
            for (const [userId, timestamp] of activeSeekers.entries()) {
                if (now - timestamp > 5 * 60 * 1000) { // 5 Minuten
                    activeSeekers.delete(userId);
                    console.log(`Removed inactive seeker ${userId} from queue`);
                }
            }
        } catch (error) {
            console.error('Error in cleanup interval:', error);
        }
    }, 5 * 60 * 1000); // 5 Minuten

    // Cleanup bei Server-Shutdown
    return () => {
        clearInterval(cleanupInterval);
    };
}