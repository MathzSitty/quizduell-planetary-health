// backend/src/routes/user.routes.ts
import { Router } from 'express';
import { getLeaderboard, getUserProfile } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware'; // protect für Profile, die sensible Daten enthalten könnten

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/profile/:id', protect, getUserProfile); // Profil eines bestimmten Users

export default router;