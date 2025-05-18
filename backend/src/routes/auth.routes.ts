// Dateipfad: d:\quizduell-planetary-health\backend\src\routes\auth.routes.ts
// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { loginRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Rate Limiting für Login und Register
router.post('/register', loginRateLimit(5), registerUser);
router.post('/login', loginRateLimit(10), loginUser);
router.get('/me', protect, getCurrentUser);

export default router;