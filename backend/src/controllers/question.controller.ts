// backend/src/controllers/question.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
    createQuestionService,
    getAllQuestionsService,
    getQuestionByIdService,
    updateQuestionService,
    deleteQuestionService,
    getRandomQuestionsService,
} from '../services/question.service';

export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorId = req.user?.id;
        if (!authorId) {
            return res.status(403).json({ message: 'Nur authentifizierte Benutzer können Fragen erstellen.' });
        }
        const question = await createQuestionService(req.body, authorId);
        res.status(201).json({ status: 'success', data: { question } });
    } catch (error) {
        next(error);
    }
};

export const getAllQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const category = req.query.category as string | undefined;
        const difficulty = req.query.difficulty as string | undefined; // NEU: Schwierigkeits-Filter

        const result = await getAllQuestionsService(page, limit, category, difficulty as any);
        res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        next(error);
    }
};

export const getQuestionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const question = await getQuestionByIdService(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Frage nicht gefunden.' });
        }
        res.status(200).json({ status: 'success', data: { question } });
    } catch (error) {
        next(error);
    }
};

export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const question = await updateQuestionService(req.params.id, req.body);
        if (!question) {
            return res.status(404).json({ message: 'Frage nicht gefunden oder Update fehlgeschlagen.' });
        }
        res.status(200).json({ status: 'success', data: { question } });
    } catch (error) {
        next(error);
    }
};

export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await deleteQuestionService(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const getRandomQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = req.query.count ? parseInt(req.query.count as string, 10) : 5;
        const category = req.query.category as string | undefined;
        const difficulty = req.query.difficulty as string | undefined; // NEU: Schwierigkeits-Filter
        
        const questions = await getRandomQuestionsService(count, category, difficulty as any);
        res.status(200).json({ status: 'success', data: { questions } });
    } catch (error) {
        next(error);
    }
};