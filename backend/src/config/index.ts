// backend/src/config/index.ts
import dotenv from 'dotenv';

dotenv.config(); // Load .env file

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5001,
    jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    databaseUrl: process.env.DATABASE_URL,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    initialAdmin: {
        email: process.env.INITIAL_ADMIN_EMAIL,
        password: process.env.INITIAL_ADMIN_PASSWORD,
        name: process.env.INITIAL_ADMIN_NAME,
        uniHandle: process.env.INITIAL_ADMIN_UNIHANDLE,
    },
};

if (!config.databaseUrl) {
    console.error('FATAL ERROR: DATABASE_URL is not defined.');
    // process.exit(1); // In a real app, you might exit if critical configs are missing
}
if (config.jwtSecret === 'fallback_secret_key_for_dev_only' && config.env !== 'development') {
    console.warn('WARNING: JWT_SECRET is using a fallback value. Set a strong secret in production!');
}


export default config;