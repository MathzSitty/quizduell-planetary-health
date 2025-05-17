// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser); // Route, um den eingeloggten User zu prüfen

export default router;