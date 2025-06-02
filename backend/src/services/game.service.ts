// backend/src/services/game.service.ts
import { PrismaClient, Game, Question, Difficulty } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { GameStatus } from '../types/enums';
import { getRandomQuestionsService, getQuestionsForSoloTraining } from './question.service';

const prisma = new PrismaClient();

// Anzahl der Fragen pro Spiel
export const QUESTIONS_PER_GAME = 5;

// Zeitlimit in Sekunden pro Frage
export const QUESTION_TIME_LIMIT_SECONDS = 30;

interface CreateGameInput {
    player1Id: string;
}

interface JoinGameInput {
    gameId: string;
    player2Id: string;
}

// NEU: Interface für Solo-Spiel-Erstellung
interface CreateSoloGameInput {
    player1Id: string;
    difficulty?: Difficulty;
}

export const createGameService = async (input: CreateGameInput): Promise<Game> => {
    const { player1Id } = input;

    return prisma.game.create({
        data: {
            player1Id,
            status: GameStatus.PENDING,
            player1Score: 0,
            player2Score: 0,
            currentQuestionIdx: 0,
        },
        include: { player1: { select: { id: true, name: true, uniHandle: true } } }
    });
};

// NEU: Solo-Spiel erstellen
export const createSoloGameService = async (input: CreateSoloGameInput): Promise<Game> => {
    const { player1Id, difficulty } = input;

    // Hole Fragen basierend auf Schwierigkeit
    const questions = await getQuestionsForSoloTraining(QUESTIONS_PER_GAME, difficulty);
    
    if (questions.length < QUESTIONS_PER_GAME) {
        throw new AppError(
            `Nicht genügend Fragen verfügbar. Benötigt: ${QUESTIONS_PER_GAME}, Verfügbar: ${questions.length}${
                difficulty ? ` (Schwierigkeit: ${difficulty})` : ''
            }.`, 
            503
        );
    }

    return prisma.game.create({
        data: {
            player1Id,
            player2Id: null, // Kein zweiter Spieler = Solo-Modus
            status: GameStatus.ACTIVE, // Solo-Spiele starten sofort
            player1Score: 0,
            player2Score: 0,
            currentQuestionIdx: 0,
            isSolo: true, // Solo-Modus Flag
            difficulty: difficulty || null, // Schwierigkeit für Solo-Spiele
            rounds: {
                create: questions.map((q, index) => ({
                    questionId: q.id,
                    roundNumber: index + 1,
                })),
            }
        },
        include: {
            player1: { select: { id: true, name: true, uniHandle: true } },
            rounds: { 
                include: { question: true }, 
                orderBy: { roundNumber: 'asc' } 
            }
        }
    });
};

export const findOpenGameService = async (excludePlayerId: string): Promise<Game | null> => {
    return prisma.game.findFirst({
        where: {
            status: GameStatus.PENDING,
            player1Id: { not: excludePlayerId },
            player2Id: null,
            isSolo: false, // NEU: Nur PvP-Spiele für Matchmaking
        },
        include: { player1: { select: { id: true, name: true, uniHandle: true } } },
        orderBy: { createdAt: 'asc' },
    });
};

export const joinGameService = async (input: JoinGameInput): Promise<Game & { questions: Question[] }> => {
    const { gameId, player2Id } = input;

    // Lade das Spiel und prüfe, ob es noch offen ist
    const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
            rounds: { include: { question: true }, orderBy: { roundNumber: 'asc' } }
        }
    });

    if (!game || game.status !== GameStatus.PENDING || game.player2Id || game.isSolo) {
        throw new AppError('Spiel nicht mehr verfügbar.', 400);
    }

    // Hole Fragen, falls noch keine Runden existieren
    let questionsForGame: Question[] = [];
    if (game.rounds.length === 0) {
        questionsForGame = await getRandomQuestionsService(QUESTIONS_PER_GAME);
    } else {
        questionsForGame = game.rounds.map(r => r.question);
    }

    if (questionsForGame.length < QUESTIONS_PER_GAME) {
        await prisma.game.update({ where: {id: gameId}, data: { status: GameStatus.CANCELLED }});
        throw new AppError(`Nicht genügend Fragen (${questionsForGame.length}/${QUESTIONS_PER_GAME}) für ein neues Spiel verfügbar. Bitte Admin kontaktieren.`, 503);
    }

    const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
            player2Id,
            status: GameStatus.ACTIVE,
            currentQuestionIdx: 0,
            rounds: game.rounds.length === 0 ? {
                create: questionsForGame.map((q: Question, index: number) => ({
                    questionId: q.id,
                    roundNumber: index + 1,
                })),
            } : undefined
        },
        include: {
            player1: { select: { id: true, name: true, uniHandle: true } },
            player2: { select: { id: true, name: true, uniHandle: true } },
            rounds: { include: { question: true }, orderBy: { roundNumber: 'asc' } }
        }
    });

    // @ts-ignore
    return { ...updatedGame, questions: updatedGame.rounds.map(r => r.question) };
};

export const getGameDetailsService = async (gameId: string, userId: string): Promise<Game | null> => {
    const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
            player1: { select: { id: true, name: true, uniHandle: true, score: true } },
            player2: { select: { id: true, name: true, uniHandle: true, score: true } },
            rounds: {
                orderBy: { roundNumber: 'asc' },
                include: {
                    question: {
                        select: { 
                            id: true, 
                            text: true, 
                            optionA: true, 
                            optionB: true, 
                            optionC: true, 
                            optionD: true, 
                            category: true,
                            source: true,
                            difficulty: true // NEU: Schwierigkeit einschließen
                        }
                    }
                }
            },
            winner: { select: { id: true, name: true }}
        }
    });

    if (!game) return null;
    
    // Solo-Spiele benötigen kein Player-Swapping
    if (game.isSolo) return game;
    
    // Wenn der anfragende User Spieler 2 ist, tausche die Spieler für die Ansicht
    if (game.player2Id === userId) {
        const p1Score = game.player1Score;
        const p2Score = game.player2Score;
        
        return {
            ...game,
            player1Id: game.player2Id,
            player2Id: game.player1Id,
            player1: game.player2,
            player2: game.player1,
            player1Score: p2Score,
            player2Score: p1Score
        } as typeof game;
    }
    
    return game;
};

// NEU: Solo-Antwort-Service
export const submitSoloAnswerService = async (
    gameId: string,
    userId: string,
    roundNumber: number,
    selectedOption: string | null
): Promise<{ game: Game, roundResult: any, nextQuestion: Question | null }> => {
    const isTimeout = selectedOption === null;
    const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { rounds: { include: { question: true }, orderBy: {roundNumber: 'asc'} } }
    });

    if (!game || game.status !== GameStatus.ACTIVE || !game.isSolo) {
        throw new AppError('Solo-Spiel nicht gefunden oder nicht aktiv.', 404);
    }
    if (game.player1Id !== userId) {
        throw new AppError('Du bist nicht Teil dieses Spiels.', 403);
    }
    if (roundNumber - 1 !== game.currentQuestionIdx) {
        throw new AppError('Antwort für falsche Runde.', 400);
    }

    const currentRound = game.rounds.find(r => r.roundNumber === roundNumber);
    if (!currentRound) {
        throw new AppError('Runde nicht gefunden.', 404);
    }

    if (currentRound.player1AnsweredOption !== null) {
        throw new AppError('Du hast bereits für diese Runde geantwortet.', 400);
    }

    const isCorrect = !isTimeout && selectedOption === currentRound.question.correctOption;

    const updatedRound = await prisma.gameRound.update({
        where: { id: currentRound.id },
        data: {
            player1AnsweredOption: isTimeout ? null : selectedOption,
            player1Correct: isCorrect,
        },
        include: { question: true }
    });

    // Punktevergabe für Solo-Spiel
    const roundScore = isCorrect ? 1 : 0;
    const newScore = game.player1Score + roundScore;

    let gameUpdateData: any = {
        player1Score: newScore,
    };

    let roundResultForSocket: any = {
        gameId: gameId,
        roundNumber: updatedRound.roundNumber,
        questionId: updatedRound.questionId,
        player1Answer: updatedRound.player1AnsweredOption,
        player2Answer: null, // Kein zweiter Spieler im Solo-Modus
        correctOption: updatedRound.question.correctOption,
        player1Correct: updatedRound.player1Correct,
        player2Correct: null,
        player1CurrentScore: newScore,
        player2CurrentScore: 0,
        gameStatus: 'ACTIVE'
    };

    let nextQuestionForSocket: Question | null = null;

    // Nächste Frage oder Spielende
    if (game.currentQuestionIdx + 1 < game.rounds.length) {
        gameUpdateData.currentQuestionIdx = game.currentQuestionIdx + 1;
        gameUpdateData.status = GameStatus.ACTIVE;
        const nextRound = game.rounds.find(r => r.roundNumber === gameUpdateData.currentQuestionIdx + 1);
        if (nextRound) {
            nextQuestionForSocket = nextRound.question;
            roundResultForSocket.nextQuestion = nextQuestionForSocket;
        }
    } else {
        // Solo-Spiel beendet
        gameUpdateData.status = GameStatus.FINISHED;
        gameUpdateData.winnerId = game.player1Id; // Spieler ist immer der "Gewinner" im Solo-Modus
        roundResultForSocket.gameStatus = 'FINISHED';

        // Update User total score
        await prisma.user.update({ 
            where: { id: game.player1Id }, 
            data: { score: { increment: roundScore } } 
        });
    }

    const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: gameUpdateData,
        include: {
            player1: { select: { id: true, name: true } },
            player2: { select: { id: true, name: true } },
            rounds: { include: { question: true }, orderBy: {roundNumber: 'asc'} },
            winner: { select: { id: true, name: true } }
        }
    });

    return { game: updatedGame, roundResult: roundResultForSocket, nextQuestion: nextQuestionForSocket };
};

export const submitAnswerService = async (
    gameId: string,
    userId: string,
    roundNumber: number,
    selectedOption: string | null
): Promise<{ game: Game, roundResult: any, nextQuestion: Question | null }> => {
    // Prüfe zuerst, ob es ein Solo-Spiel ist
    const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { isSolo: true }
    });

    if (game?.isSolo) {
        return submitSoloAnswerService(gameId, userId, roundNumber, selectedOption);
    }

    // Bestehende PvP-Logik...
    const isTimeout = selectedOption === null;
    const fullGame = await prisma.game.findUnique({
        where: { id: gameId },
        include: { rounds: { include: { question: true }, orderBy: {roundNumber: 'asc'} } }
    });

    if (!fullGame || fullGame.status !== GameStatus.ACTIVE) {
        throw new AppError('Spiel nicht gefunden oder nicht aktiv.', 404);
    }
    if (fullGame.player1Id !== userId && fullGame.player2Id !== userId) {
        throw new AppError('Du bist nicht Teil dieses Spiels.', 403);
    }
    if (roundNumber -1 !== fullGame.currentQuestionIdx) {
        throw new AppError('Antwort für falsche Runde oder Runde bereits beantwortet.', 400);
    }

    const currentRound = fullGame.rounds.find(r => r.roundNumber === roundNumber);
    if (!currentRound) {
        throw new AppError('Runde nicht gefunden.', 404);
    }

    const isPlayer1 = fullGame.player1Id === userId;
    let updateData: any = {};

    if (isPlayer1) {
        if (currentRound.player1AnsweredOption) throw new AppError('Du hast bereits für diese Runde geantwortet.', 400);
        updateData.player1AnsweredOption = isTimeout ? null : selectedOption;
        updateData.player1Correct = isTimeout ? false : selectedOption === currentRound.question.correctOption;
    } else {
        if (currentRound.player2AnsweredOption) throw new AppError('Du hast bereits für diese Runde geantwortet.', 400);
        updateData.player2AnsweredOption = isTimeout ? null : selectedOption;
        updateData.player2Correct = isTimeout ? false : selectedOption === currentRound.question.correctOption;
    }

    const updatedRound = await prisma.gameRound.update({
        where: { id: currentRound.id },
        data: updateData,
        include: { question: true }
    });

    const bothAnswered = (isPlayer1 && updatedRound.player2AnsweredOption !== null) ||
        (!isPlayer1 && updatedRound.player1AnsweredOption !== null) ||
        (updatedRound.player1AnsweredOption !== null && updatedRound.player2AnsweredOption !== null);

    const shouldProgressRound = bothAnswered || isTimeout;

    let gameUpdateData: any = {};
    let roundResultForSocket: any = {
        roundNumber: updatedRound.roundNumber,
        questionId: updatedRound.questionId,
        player1Answer: updatedRound.player1AnsweredOption,
        player2Answer: updatedRound.player2AnsweredOption,
        correctOption: updatedRound.question.correctOption,
        player1Correct: updatedRound.player1Correct,
        player2Correct: updatedRound.player2Correct,
        player1CurrentScore: fullGame.player1Score,
        player2CurrentScore: fullGame.player2Score,
    };
    let nextQuestionForSocket: Question | null = null;

    if (shouldProgressRound) {
        let p1RoundScore = 0;
        let p2RoundScore = 0;
        if (updatedRound.player1Correct && !updatedRound.player2Correct) {
            p1RoundScore = 1;
        } else if (!updatedRound.player1Correct && updatedRound.player2Correct) {
            p2RoundScore = 1;
        }
        gameUpdateData.player1Score = fullGame.player1Score + p1RoundScore;
        gameUpdateData.player2Score = fullGame.player2Score + p2RoundScore;
        roundResultForSocket.player1CurrentScore = gameUpdateData.player1Score;
        roundResultForSocket.player2CurrentScore = gameUpdateData.player2Score;

        if (fullGame.currentQuestionIdx + 1 < fullGame.rounds.length) {
            gameUpdateData.currentQuestionIdx = fullGame.currentQuestionIdx + 1;
            gameUpdateData.status = GameStatus.ACTIVE;
            const nextRound = fullGame.rounds.find(r => r.roundNumber === gameUpdateData.currentQuestionIdx + 1);
            if (nextRound) nextQuestionForSocket = nextRound.question;
        } else {
            gameUpdateData.status = GameStatus.FINISHED;
            if (gameUpdateData.player1Score > gameUpdateData.player2Score) {
                gameUpdateData.winnerId = fullGame.player1Id;
            } else if (gameUpdateData.player2Score > gameUpdateData.player1Score) {
                gameUpdateData.winnerId = fullGame.player2Id;
            }

            if (fullGame.player1Id) await prisma.user.update({ where: { id: fullGame.player1Id }, data: { score: { increment: gameUpdateData.player1Score } } });
            if (fullGame.player2Id) await prisma.user.update({ where: { id: fullGame.player2Id }, data: { score: { increment: gameUpdateData.player2Score } } });
        }
    }

    const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: gameUpdateData,
        include: {
            player1: { select: { id: true, name: true } },
            player2: { select: { id: true, name: true } },
            rounds: { include: { question: true }, orderBy: {roundNumber: 'asc'} },
            winner: { select: { id: true, name: true } }
        }
    });

    return { game: updatedGame, roundResult: roundResultForSocket, nextQuestion: nextQuestionForSocket };
};

export const forfeitGameService = async (gameId: string, forfeitingPlayerId: string): Promise<Game> => {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new AppError('Spiel nicht gefunden.', 404);
    if (game.status !== GameStatus.ACTIVE && game.status !== GameStatus.PENDING) {
        throw new AppError('Spiel kann nicht aufgegeben werden.', 400);
    }

    // Solo-Spiele können einfach beendet werden
    if (game.isSolo) {
        return prisma.game.update({
            where: { id: gameId },
            data: {
                status: GameStatus.CANCELLED,
                winnerId: null,
            },
            include: {
                player1: { select: { id: true, name: true } },
                player2: { select: { id: true, name: true } },
                winner: { select: { id: true, name: true } }
            }
        });
    }

    // PvP-Logik bleibt unverändert
    let winnerId = null;
    if (game.player1Id === forfeitingPlayerId && game.player2Id) {
        winnerId = game.player2Id;
    } else if (game.player2Id === forfeitingPlayerId && game.player1Id) {
        winnerId = game.player1Id;
    }

    return prisma.game.update({
        where: { id: gameId },
        data: {
            status: GameStatus.CANCELLED,
            winnerId: winnerId,
        },
        include: {
            player1: { select: { id: true, name: true } },
            player2: { select: { id: true, name: true } },
            winner: { select: { id: true, name: true } }
        }
    });
};

export const getUserRecentGamesService = async (userId: string, limit: number = 5): Promise<Game[]> => {
    return prisma.game.findMany({
        where: {
            OR: [
                { player1Id: userId },
                { player2Id: userId }
            ],
            status: {
                in: [GameStatus.FINISHED, GameStatus.CANCELLED]
            }
        },
        orderBy: {
            updatedAt: 'desc'
        },
        take: limit,
        include: {
            player1: { select: { id: true, name: true, uniHandle: true } },
            player2: { select: { id: true, name: true, uniHandle: true } },
            winner: { select: { id: true, name: true } }
        }
    });
};