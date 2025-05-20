// backend/src/config/index.ts
import dotenv from 'dotenv';

dotenv.config(); // Load .env file

const config = {
  // Node Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001', 10),
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/quizduell_db?schema=public',
  
  // JWT Config
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_replace_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Frontend URL (für CORS und Reset-Links)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Email-Konfiguration - vereinfacht, da wir nur Ethereal verwenden
  emailFrom: process.env.EMAIL_FROM || 'noreply@planetary-health-quiz.de',
  
  // Admin user settings (for initial setup)
  initialAdmin: {
    email: process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'SecurePassword123!',
    name: process.env.INITIAL_ADMIN_NAME || 'Admin',
    uniHandle: process.env.INITIAL_ADMIN_UNIHANDLE || 'HS-Admin',
  }
};

export default config;