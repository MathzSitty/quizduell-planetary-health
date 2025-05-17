// backend/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import questionRoutes from './question.routes';
import gameRoutes from './game.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes); // Beinhaltet /leaderboard und /profile/:id
router.use('/questions', questionRoutes);
router.use('/games', gameRoutes);

export default router;