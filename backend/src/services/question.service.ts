// backend/src/services/question.service.ts
import { PrismaClient, Question, Difficulty } from '@prisma/client';
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
    source?: string;
    difficulty?: Difficulty; // NEU: Schwierigkeitsgrad hinzufügen
}

export const createQuestionService = async (input: QuestionInput, authorId: string): Promise<Question> => {
    const { text, optionA, optionB, optionC, optionD, correctOption, category, source, difficulty } = input;

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
            source: source || null,
            difficulty: difficulty || 'MEDIUM', // Standard: MEDIUM
            authorId,
        },
    });
};

export const getAllQuestionsService = async (
    page = 1, 
    limit = 10, 
    category?: string,
    difficulty?: Difficulty // NEU: Schwierigkeits-Filter
): Promise<{ questions: Question[], total: number, totalPages: number, currentPage: number }> => {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    
    if (category) {
        whereClause.category = {
            contains: category,
            mode: 'insensitive'
        };
    }
    
    // NEU: Schwierigkeits-Filter
    if (difficulty) {
        whereClause.difficulty = difficulty;
    }

    const questions = await prisma.question.findMany({
        where: whereClause,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
    });

    const total = await prisma.question.count({ where: whereClause });
    const totalPages = Math.ceil(total / limit);

    return {
        questions,
        total,
        totalPages,
        currentPage: page,
    };
};

export const getQuestionByIdService = async (id: string): Promise<Question | null> => {
    return prisma.question.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

export const updateQuestionService = async (id: string, input: Partial<QuestionInput>): Promise<Question> => {
    const { text, optionA, optionB, optionC, optionD, correctOption, category, source, difficulty } = input;

    if (correctOption && !['A', 'B', 'C', 'D'].includes(correctOption)) {
        throw new AppError('Ungültige korrekte Option. Muss A, B, C oder D sein.', 400);
    }

    return prisma.question.update({
        where: { id },
        data: {
            ...(text && { text }),
            ...(optionA && { optionA }),
            ...(optionB && { optionB }),
            ...(optionC && { optionC }),
            ...(optionD && { optionD }),
            ...(correctOption && { correctOption }),
            ...(category !== undefined && { category: category || null }),
            ...(source !== undefined && { source: source || null }),
            ...(difficulty && { difficulty }), // NEU: Schwierigkeit updaten
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

export const deleteQuestionService = async (id: string): Promise<void> => {
    await prisma.question.delete({
        where: { id },
    });
};

// NEU: Erweiterte getRandomQuestionsService mit Schwierigkeits-Filter
export const getRandomQuestionsService = async (
    count: number, 
    category?: string,
    difficulty?: Difficulty, // NEU: Schwierigkeits-Filter
    excludeIds: string[] = []
): Promise<Question[]> => {
    const whereClause: any = {};
    
    if (category) {
        whereClause.category = {
            contains: category,
            mode: 'insensitive'
        };
    }
    
    // NEU: Schwierigkeits-Filter
    if (difficulty) {
        whereClause.difficulty = difficulty;
    }
    
    if (excludeIds.length > 0) {
        whereClause.id = { notIn: excludeIds };
    }

    // Prüfe, ob genügend Fragen verfügbar sind
    const availableQuestionsCount = await prisma.question.count({ where: whereClause });
    
    if (availableQuestionsCount < count) {
        throw new AppError(
            `Nicht genügend Fragen verfügbar. Benötigt: ${count}, Verfügbar: ${availableQuestionsCount}${
                difficulty ? ` (Schwierigkeit: ${difficulty})` : ''
            }${category ? ` (Kategorie: ${category})` : ''}.`, 
            503
        );
    }

    // Hole alle verfügbaren Fragen und mische sie
    const allQuestions = await prisma.question.findMany({
        where: whereClause,
        select: {
            id: true,
            text: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            correctOption: true,
            category: true,
            source: true,
            difficulty: true, // NEU: Difficulty einschließen
            authorId: true,   // FEHLER BEHOBEN: authorId hinzufügen
            author: {
                select: {
                    id: true,
                    name: true,
                },
            },
            createdAt: true,
            updatedAt: true,
        },
    });

    // Fragen mischen (Fisher-Yates Shuffle)
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    return allQuestions.slice(0, count);
};

export const getQuestionsForSoloTraining = async (
    count: number,
    difficulty?: Difficulty
): Promise<Question[]> => {
    return getRandomQuestionsService(count, undefined, difficulty);
};