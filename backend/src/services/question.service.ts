// backend/src/services/question.service.ts
import { PrismaClient, Question } from '@prisma/client';
import { AppError } from '../utils/AppError'; // Angenommen, AppError existiert

const prisma = new PrismaClient();

interface QuestionInput {
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string; // 'A', 'B', 'C', or 'D'
    category?: string;
}

export const createQuestionService = async (input: QuestionInput, authorId: string): Promise<Question> => {
    const { text, optionA, optionB, optionC, optionD, correctOption, category } = input;

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
            authorId,
        },
    });
};

export const getAllQuestionsService = async (page = 1, limit = 10, category?: string): Promise<{ questions: Question[], total: number,totalPages: number, currentPage: number }> => {
    const skip = (page - 1) * limit;
    const whereClause: any = {};
    if (category) {
        whereClause.category = {
            contains: category, // oder equals, je nach Anforderung
            mode: 'insensitive' // Groß-/Kleinschreibung ignorieren
        };
    }

    const questions = await prisma.question.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, id: true } } }, // Autor-Infos mitladen
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
    // Verhindere, dass authorId direkt geändert wird, falls nicht gewünscht
    const { authorId, ...updateData } = input as any; // authorId aus input entfernen

    return prisma.question.update({
        where: { id },
        data: updateData,
    });
};

export const deleteQuestionService = async (id: string): Promise<Question | null> => {
    // Prüfe, ob die Frage in aktiven Spielen verwendet wird, bevor du sie löschst (komplexer)
    // Fürs Erste: direkt löschen
    return prisma.question.delete({
        where: { id },
    });
};

export const getRandomQuestionsService = async (count: number, category?: string): Promise<Question[]> => {
    const whereClause: any = {};
    if (category) {
        whereClause.category = category;
    }

    const allQuestionsCount = await prisma.question.count({ where: whereClause });
    if (allQuestionsCount === 0) return [];
    if (count > allQuestionsCount) count = allQuestionsCount; // Nicht mehr anfordern als vorhanden

    // Einfache Methode für zufällige Fragen (nicht perfekt für große Datensätze, aber für Quiz OK)
    // Besser wäre eine DB-spezifische RANDOM() Funktion, aber Prisma unterstützt das nicht direkt universell.
    // Alternative: Alle IDs laden, shufflen, dann die ersten 'count' nehmen.
    const allQuestions = await prisma.question.findMany({ where: whereClause });

    // Fisher-Yates shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }
    return allQuestions.slice(0, count);
};