// backend/src/routes/game.routes.ts
import express from 'express';
import { 
    createGame, 
    findAndJoinGame, 
    getGameDetails, 
    getUserRecentGames 
} from '../controllers/game.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Authentifizierung für alle Game-Routen
router.use(protect);

// Spiel erstellen
router.post('/', createGame);

// Offenes Spiel finden und beitreten
router.post('/join', findAndJoinGame);

// Letzte Spiele eines Benutzers abrufen
// Wichtig: Dieser Endpunkt muss vor dem /:id Endpunkt stehen, 
// damit '/recent' nicht als ID interpretiert wird
router.get('/recent', getUserRecentGames);

// Spieldetails abrufen
router.get('/:id', getGameDetails);

export default router;