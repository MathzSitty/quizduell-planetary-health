// backend/src/routes/game.routes.ts
import { Router } from 'express';
import {
    createGame,
    findAndJoinGame,
    getGameDetails,
} from '../controllers/game.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Diese Routen sind für das initiale Erstellen/Finden von Spielen.
// Die eigentliche Spielinteraktion (Antworten etc.) läuft über Sockets.
router.post('/find-or-create', protect, findAndJoinGame); // Kombinierte Route
router.post('/', protect, createGame); // Nur erstellen (wenn Client das Matchmaking macht)

router.get('/:id', protect, getGameDetails); // Details eines spezifischen Spiels abrufen

export default router;