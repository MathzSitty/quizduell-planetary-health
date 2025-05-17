// backend/src/services/game.service.ts
import { PrismaClient, Game, Question, User } from '@prisma/client';
import { GameStatus } from '../types/enums';
import { AppError } from '../utils/AppError';
import { getRandomQuestionsService } from './question.service'; // Import hinzugefügt

const prisma = new PrismaClient();
const QUESTIONS_PER_GAME = 5; // Anzahl der Fragen pro Spiel

interface CreateGameInput {
    player1Id: string;
}

interface JoinGameInput {
    gameId: string;
    player2Id: string;
}

export const createGameService = async (input: CreateGameInput): Promise<Game> => {
    const { player1Id } = input;
    // Prüfen, ob der Spieler bereits ein offenes Spiel hat (optional)
    // const existingGame = await prisma.game.findFirst({
    //   where: { player1Id, status: GameStatus.PENDING }
    // });
    // if (existingGame) throw new AppError('Du hast bereits ein offenes Spiel.', 400);

    return prisma.game.create({
        data: {
            player1Id,
            status: GameStatus.PENDING,
        },
        include: { player1: { select: { id: true, name: true, uniHandle: true } } },
    });
};

export const findOpenGameService = async (excludePlayerId: string): Promise<Game | null> => {
    return prisma.game.findFirst({
        where: {
            status: GameStatus.PENDING,
            player1Id: { not: excludePlayerId }, // Nicht das eigene Spiel beitreten
            player2Id: null, // Sicherstellen, dass noch kein zweiter Spieler da ist
        },
        include: { player1: { select: { id: true, name: true, uniHandle: true } } },
        orderBy: { createdAt: 'asc' }, // Ältestes offenes Spiel zuerst
    });
};

export const joinGameService = async (input: JoinGameInput): Promise<Game & { questions: Question[] }> => {
    const { gameId, player2Id } = input;
    const game = await prisma.game.findUnique({ where: { id: gameId } });

    if (!game) {
        throw new AppError('Spiel nicht gefunden.', 404);
    }
    if (game.status !== GameStatus.PENDING) {
        throw new AppError('Spiel ist nicht mehr offen zum Beitreten.', 400);
    }
    if (game.player1Id === player2Id) {
        throw new AppError('Du kannst nicht deinem eigenen Spiel beitreten.', 400);
    }
    if (game.player2Id) {
        throw new AppError('Dieses Spiel hat bereits einen zweiten Spieler.', 400);
    }

    const questionsForGame = await getRandomQuestionsService(QUESTIONS_PER_GAME);
    if (questionsForGame.length < QUESTIONS_PER_GAME) {
        // Nicht genügend Fragen in der DB. Man könnte das Spiel abbrechen oder mit weniger Fragen starten.
        // Hier brechen wir ab, um Konsistenz zu wahren.
        await prisma.game.update({ where: {id: gameId}, data: { status: GameStatus.CANCELLED }});
        throw new AppError(`Nicht genügend Fragen (${questionsForGame.length}/${QUESTIONS_PER_GAME}) für ein neues Spiel verfügbar. Bitte Admin kontaktieren.`, 503);
    }

    const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
            player2Id,
            status: GameStatus.ACTIVE,
            currentQuestionIdx: 0, // Spiel startet mit der ersten Frage
            // Erstelle die GameRounds für dieses Spiel
            rounds: {
                create: questionsForGame.map((q: Question, index: number) => ({
                    questionId: q.id,
                    roundNumber: index + 1,
                })),
            }
        },
        include: {
            player1: { select: { id: true, name: true, uniHandle: true } },
            player2: { select: { id: true, name: true, uniHandle: true } },
            rounds: { include: { question: true }, orderBy: { roundNumber: 'asc'} }, // Runden mit Fragen laden
        },
    });
    // @ts-ignore // Prisma Typen sind manchmal knifflig mit includes
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
                    question: { // Wähle nur die benötigten Felder der Frage
                        select: { id: true, text: true, optionA: true, optionB: true, optionC: true, optionD: true, category: true }
                    }
                }
            },
            winner: { select: { id: true, name: true }}
        }
    });

    if (!game) return null;
    // Sicherheitscheck: Nur Spieler des Spiels dürfen Details sehen (oder Admins)
    // if (game.player1Id !== userId && game.player2Id !== userId /* && req.user.role !== 'ADMIN' */) {
    //     throw new AppError('Du bist nicht Teil dieses Spiels.', 403);
    // }
    return game;
};

export const submitAnswerService = async (
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

    if (!game || game.status !== GameStatus.ACTIVE) {
        throw new AppError('Spiel nicht gefunden oder nicht aktiv.', 404);
    }
    if (game.player1Id !== userId && game.player2Id !== userId) {
        throw new AppError('Du bist nicht Teil dieses Spiels.', 403);
    }
    if (roundNumber -1 !== game.currentQuestionIdx) { // roundNumber ist 1-basiert, currentQuestionIdx 0-basiert
        throw new AppError('Antwort für falsche Runde oder Runde bereits beantwortet.', 400);
    }

    const currentRound = game.rounds.find(r => r.roundNumber === roundNumber);
    if (!currentRound) {
        throw new AppError('Runde nicht gefunden.', 404);
    }

    const isPlayer1 = game.player1Id === userId;
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

    // WICHTIG: Prüfen, ob beide Spieler geantwortet haben ODER ob ein Timeout aufgetreten ist
    const bothAnswered = (isPlayer1 && updatedRound.player2AnsweredOption !== null) ||
        (!isPlayer1 && updatedRound.player1AnsweredOption !== null) ||
        (updatedRound.player1AnsweredOption !== null && updatedRound.player2AnsweredOption !== null);

    // Bei Timeout immer zur nächsten Runde gehen, auch wenn der andere Spieler nicht geantwortet hat
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
        player1CurrentScore: game.player1Score,
        player2CurrentScore: game.player2Score,
    };
    let nextQuestionForSocket: Question | null = null;

    if (shouldProgressRound) {
        // Punktevergabe
        let p1RoundScore = 0;
        let p2RoundScore = 0;
        if (updatedRound.player1Correct && !updatedRound.player2Correct) {
            p1RoundScore = 1;
        } else if (!updatedRound.player1Correct && updatedRound.player2Correct) {
            p2RoundScore = 1;
        }

        gameUpdateData.player1Score = game.player1Score + p1RoundScore;
        gameUpdateData.player2Score = game.player2Score + p2RoundScore;
        roundResultForSocket.player1CurrentScore = gameUpdateData.player1Score;
        roundResultForSocket.player2CurrentScore = gameUpdateData.player2Score;

        // Nächste Frage oder Spielende
        if (game.currentQuestionIdx + 1 < game.rounds.length) {
            gameUpdateData.currentQuestionIdx = game.currentQuestionIdx + 1;
            gameUpdateData.status = GameStatus.ACTIVE; // Bleibt aktiv für nächste Frage
            const nextRound = game.rounds.find(r => r.roundNumber === gameUpdateData.currentQuestionIdx + 1);
            if (nextRound) nextQuestionForSocket = nextRound.question;
        } else { // Letzte Frage beantwortet
            gameUpdateData.status = GameStatus.FINISHED;
            if (gameUpdateData.player1Score > gameUpdateData.player2Score) {
                gameUpdateData.winnerId = game.player1Id;
            } else if (gameUpdateData.player2Score > gameUpdateData.player1Score) {
                gameUpdateData.winnerId = game.player2Id;
            } // Unentschieden: winnerId bleibt null

            // Update User total scores
            if (game.player1Id) await prisma.user.update({ where: { id: game.player1Id }, data: { score: { increment: gameUpdateData.player1Score } } });
            if (game.player2Id) await prisma.user.update({ where: { id: game.player2Id }, data: { score: { increment: gameUpdateData.player2Score } } });
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

    let winnerId = null;
    if (game.player1Id === forfeitingPlayerId && game.player2Id) {
        winnerId = game.player2Id;
    } else if (game.player2Id === forfeitingPlayerId && game.player1Id) {
        winnerId = game.player1Id;
    }

    return prisma.game.update({
        where: { id: gameId },
        data: {
            status: GameStatus.CANCELLED, // Oder FINISHED mit Gewinner
            winnerId: winnerId,
        },
        include: {
            player1: { select: { id: true, name: true } },
            player2: { select: { id: true, name: true } },
            winner: { select: { id: true, name: true } }
        }
    });
};