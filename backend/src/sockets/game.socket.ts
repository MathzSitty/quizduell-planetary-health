// Dateipfad: d:\quizduell-planetary-health\backend\src\sockets\game.socket.ts
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
import { verifyToken } from '../utils/jwt.util'; // Importiere verifyToken

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
    // Socket.IO Middleware für Authentifizierung
    io.use(async (socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (token && typeof token === 'string') {
            try {
                const decoded = verifyToken(token);
                if (decoded && decoded.userId) {
                    socket.data.userId = decoded.userId;
                    userSockets.set(decoded.userId, socket.id); // Speichere userId -> socketId Mapping
                    console.log(`Socket ${socket.id} authenticated for user ${decoded.userId}`);
                    next();
                } else {
                    console.log(`Socket ${socket.id} authentication failed: Invalid token or userId missing in token.`);
                    next(new Error('Authentication error: Invalid token.'));
                }
            } catch (error) {
                console.error(`Socket ${socket.id} authentication error during token verification:`, error);
                next(new Error('Authentication error: Token verification failed.'));
            }
        } else {
            console.log(`Socket ${socket.id} authentication failed: No token provided.`);
            next(new Error('Authentication error: Token is required.'));
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

                        // Spieler 1 (Ersteller)
                        const player1SocketId = userSockets.get(game.player1Id);
                        if (player1SocketId) {
                            // Für Player 1 bleibt alles beim alten
                            const gameForPlayer1 = {
                                ...joinedGameData
                            };
                            
                            // Den aktuellen Spieler (player2) vollständig laden
                            const opponentUser = await prisma.user.findUnique({
                                where: { id: socket.data.userId },
                                select: { id: true, name: true, uniHandle: true }
                            });
                            io.to(player1SocketId).emit('player_joined', { 
                                game: gameForPlayer1,
                                opponent: opponentUser
                            });
                            io.to(player1SocketId).emit('game_started', { 
                                game: gameForPlayer1, 
                                questions,
                                timeLimit: QUESTION_TIME_LIMIT_SECONDS 
                            });
                        }
                        
                        // Spieler 2 (Beitretender)
                        const player2SocketId = userSockets.get(socket.data.userId);
                        if (player2SocketId) {
                            // Für Player 2 müssen wir eine neue Ansicht erstellen
                            // Hole Daten für beide Spieler
                            const player1User = await prisma.user.findUnique({
                                where: { id: game.player1Id },
                                select: { id: true, name: true, uniHandle: true }
                            });
                            
                            const player2User = await prisma.user.findUnique({
                                where: { id: socket.data.userId },
                                select: { id: true, name: true, uniHandle: true }
                            });
                            
                            // Erstelle eine neue Ansicht für Spieler 2, bei der die Spieler getauscht sind
                            const gameForPlayer2 = {
                                ...joinedGameData,
                                player1Id: joinedGameData.player2Id,
                                player2Id: joinedGameData.player1Id,
                                player1: player2User,  // Player2 wird zu Player1 für die Ansicht
                                player2: player1User   // Player1 wird zu Player2 für die Ansicht
                            };
                            
                            io.to(player2SocketId).emit('player_joined', { 
                                game: gameForPlayer2,
                                opponent: player1User
                            });
                            io.to(player2SocketId).emit('game_started', { 
                                game: gameForPlayer2, 
                                questions,
                                timeLimit: QUESTION_TIME_LIMIT_SECONDS 
                            });
                        }
                        
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

        // Im submit_answer Event
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
                if (isAnswerComplete) {
                    // Für Spieler 1
                    const player1SocketId = userSockets.get(result.game.player1Id);
                    if (player1SocketId) {
                        io.to(player1SocketId).emit('round_result', {
                            gameId,
                            ...result.roundResult,
                            nextQuestion: result.nextQuestion,
                            gameStatus: result.game.status
                        });
                    }

                    // Für Spieler 2 - Punkte vertauschen
                    if (result.game.player2Id) {  // Prüfe, dass player2Id nicht null ist
                        const player2SocketId = userSockets.get(result.game.player2Id);
                        if (player2SocketId) {
                            const player2Result = {
                                ...result.roundResult,
                                player1Answer: result.roundResult.player2Answer,
                                player2Answer: result.roundResult.player1Answer,
                                player1Correct: result.roundResult.player2Correct,
                                player2Correct: result.roundResult.player1Correct,
                                player1CurrentScore: result.roundResult.player2CurrentScore,
                                player2CurrentScore: result.roundResult.player1CurrentScore
                            };

                            io.to(player2SocketId).emit('round_result', {
                                gameId,
                                ...player2Result,
                                nextQuestion: result.nextQuestion,
                                gameStatus: result.game.status
                            });
                        }
                    }

                    // Wenn die Runde oder das Spiel beendet ist
                    if (result.game.status === GameStatus.FINISHED) {
                        io.to(gameId).emit('game_over', result.game);
                        // Räume aufräumen
                        gameRooms.delete(gameId);
                    }
                }

                callback({ 
                    success: true, 
                    currentScore: socket.data.userId === result.game.player1Id ? 
                        result.game.player1Score : result.game.player2Score,
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

        // Auch im answer_timeout Event die gleiche Logik implementieren:
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

                // Für Spieler 1
                const player1SocketId = userSockets.get(result.game.player1Id);
                if (player1SocketId) {
                    io.to(player1SocketId).emit('round_result', {
                        gameId,
                        ...result.roundResult,
                        nextQuestion: result.nextQuestion,
                        gameStatus: result.game.status,
                        forcedByTimeout: true
                    });
                }

                // Für Spieler 2 - Punkte vertauschen
                if (result.game.player2Id) {  // Prüfe, dass player2Id nicht null ist
                    const player2SocketId = userSockets.get(result.game.player2Id);
                    if (player2SocketId) {
                        const player2Result = {
                            ...result.roundResult,
                            player1Answer: result.roundResult.player2Answer,
                            player2Answer: result.roundResult.player1Answer,
                            player1Correct: result.roundResult.player2Correct,
                            player2Correct: result.roundResult.player1Correct,
                            player1CurrentScore: result.roundResult.player2CurrentScore,
                            player2CurrentScore: result.roundResult.player1CurrentScore
                        };

                        io.to(player2SocketId).emit('round_result', {
                            gameId,
                            ...player2Result,
                            nextQuestion: result.nextQuestion,
                            gameStatus: result.game.status,
                            forcedByTimeout: true
                        });
                    }
                }

                // Spielende-Logik
                if (result.game.status === GameStatus.FINISHED) {
                    io.to(gameId).emit('game_over', result.game);
                    gameRooms.delete(gameId);
                }

                callback?.({ success: true });
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