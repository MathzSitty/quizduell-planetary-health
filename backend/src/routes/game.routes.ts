// backend/src/routes/game.routes.ts
import express from 'express';
import { 
    createGame, 
    findAndJoinGame, 
    getGameDetails, 
    getUserRecentGames,
    createSoloGame,
    submitAnswer // NEU: Submit Answer Controller importieren
} from '../controllers/game.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Authentifizierung für alle Game-Routen
router.use(protect);

// Spiel erstellen (PvP)
router.post('/', createGame);

// NEU: Solo-Spiel erstellen
router.post('/solo', createSoloGame);

// NEU: Antwort submitten (für Solo- und PvP-Spiele)
router.post('/:id/answer', submitAnswer);

// Offenes Spiel finden und beitreten (PvP)
router.post('/join', findAndJoinGame);

// Letzte Spiele eines Benutzers abrufen
router.get('/recent', getUserRecentGames);

// Spieldetails abrufen
router.get('/:id', getGameDetails);

export default router;