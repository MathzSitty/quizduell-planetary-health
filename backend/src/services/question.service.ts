// backend/src/services/question.service.ts
import { PrismaClient, Question } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

interface QuestionInput {
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string; // 'A', 'B', 'C', or 'D'
    category?: string;
    source?: string; // Quellenfeld hinzugefügt
}

export const createQuestionService = async (input: QuestionInput, authorId: string): Promise<Question> => {
    const { text, optionA, optionB, optionC, optionD, correctOption, category, source } = input;

    if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
        throw new AppError('Ungültige korrekte Option. Muss A, B, C oder D sein.', 400);
    }

    return prisma.question.create({
        data: {
            text,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
            category: category || null,
            source: source || null, // Quelle hinzufügen
            authorId,
        },
    });
};

export const getAllQuestionsService = async (page = 1, limit = 10, category?: string): Promise<{ questions: Question[], total: number,totalPages: number, currentPage: number }> => {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (category) {
        whereClause.category = {
            contains: category,
            mode: 'insensitive'
        };
    }

    const questions = await prisma.question.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, id: true } } },
    });
    const total = await prisma.question.count({ where: whereClause });
    return {
        questions,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
    };
};

export const getQuestionByIdService = async (id: string): Promise<Question | null> => {
    return prisma.question.findUnique({
        where: { id },
        include: { author: { select: { name: true, id: true } } },
    });
};

export const updateQuestionService = async (id: string, input: Partial<QuestionInput>): Promise<Question | null> => {
    if (input.correctOption && !['A', 'B', 'C', 'D'].includes(input.correctOption)) {
        throw new AppError('Ungültige korrekte Option für Update.', 400);
    }
    // Verhindere, dass authorId direkt geändert wird
    const { authorId, ...updateData } = input as any;

    return prisma.question.update({
        where: { id },
        data: updateData,
    });
};

export const deleteQuestionService = async (id: string): Promise<Question | null> => {
    // 1. Zuerst prüfen, ob die Frage in aktiven Spielen verwendet wird
    const gameRoundsWithQuestion = await prisma.gameRound.findMany({
        where: { questionId: id },
        include: { game: true }
    });

    const activeGames = gameRoundsWithQuestion.filter(
        gr => gr.game.status === 'ACTIVE' || gr.game.status === 'PENDING'
    );

    // Wenn die Frage in aktiven Spielen verwendet wird, Löschung verweigern
    if (activeGames.length > 0) {
        throw new AppError(
            `Diese Frage kann nicht gelöscht werden, da sie in ${activeGames.length} aktiven Spielen verwendet wird.`,
            400
        );
    }

    // 2. Für beendete oder abgebrochene Spiele, die GameRounds löschen
    await prisma.gameRound.deleteMany({
        where: { questionId: id }
    });

    // 3. Schließlich die Frage selbst löschen
    return prisma.question.delete({
        where: { id }
    });
};

export const getRandomQuestionsService = async (count: number, category?: string): Promise<Question[]> => {
    const whereClause: any = {};
    if (category) {
        whereClause.category = category;
    }

    const allQuestionsCount = await prisma.question.count({ where: whereClause });
    if (allQuestionsCount === 0) return [];
    if (count > allQuestionsCount) count = allQuestionsCount;

    const allQuestions = await prisma.question.findMany({ where: whereClause });

    // Fisher-Yates shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }
    return allQuestions.slice(0, count);
};