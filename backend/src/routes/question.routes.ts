// backend/src/routes/question.routes.ts
import { Router } from 'express';
import {
    createQuestion,
    getAllQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getRandomQuestions,
} from '../controllers/question.controller';
import { protect, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// Admin-Routen für CRUD-Operationen
router.route('/')
    .post(protect, authorizeAdmin, createQuestion) // Nur Admins können Fragen erstellen
    .get(getAllQuestions); // Alle können Fragen sehen (für Admin-Panel und ggf. für User-Auswahl)

router.route('/:id')
    .get(getQuestionById)
    .put(protect, authorizeAdmin, updateQuestion) // Nur Admins können Fragen bearbeiten
    .delete(protect, authorizeAdmin, deleteQuestion); // Nur Admins können Fragen löschen

// Route für das Spiel, um zufällige Fragen zu bekommen
router.get('/game/random', protect, getRandomQuestions); // Spieler müssen eingeloggt sein, um Fragen zu laden

export default router;