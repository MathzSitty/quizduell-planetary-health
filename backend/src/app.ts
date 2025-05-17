// backend/src/app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import config from './config';
import mainRouter from './routes'; // Will be created
import { errorMiddleware } from './middleware/error.middleware';

// Initialize Prisma Client
export const prisma = new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'], // Optional: for debugging Prisma queries
});

const app = express();

// Middleware
app.use(
    cors({
        origin: config.frontendUrl, // Allow requests from frontend
        credentials: true, // Allow cookies/authorization headers
    }),
);
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Backend is healthy and running!',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api', mainRouter);

// Catch-all for non-existing API routes
app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ message: `API Endpunkt ${req.originalUrl} nicht gefunden.` });
});


// Global Error Handling Middleware (must be last)
app.use(errorMiddleware);

export default app;