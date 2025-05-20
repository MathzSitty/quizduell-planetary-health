// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { registerUser, loginUser, getCurrentUser, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { loginRateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Rate Limiting für Login und Register
router.post('/register', loginRateLimit(5), registerUser);
router.post('/login', loginRateLimit(10), loginUser);
router.get('/me', protect, getCurrentUser);

// Passwort vergessen & Zurücksetzen
router.post('/forgot-password', loginRateLimit(5), forgotPassword);
router.post('/reset-password/:token', loginRateLimit(5), resetPassword);

export default router;