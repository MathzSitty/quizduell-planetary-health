// backend/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean; // To distinguish programmer errors from operational errors
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    // Log more detailed errors for development
    if (process.env.NODE_ENV === 'development') {
        console.error('ERROR 💥', err);
    }

    // Handle specific Prisma errors (optional, but can be useful)
    if (err.name === 'PrismaClientKnownRequestError') {
        // Example: Unique constraint violation
        // @ts-ignore // Prisma error codes are specific
        if (err.code === 'P2002') {
            err.statusCode = 409; // Conflict
            // @ts-ignore
            const target = err.meta?.target as string[] | undefined;
            err.message = `Ein Eintrag mit diesem Wert für '${target?.join(', ')}' existiert bereits.`;
        }
    }
    if (err.name === 'PrismaClientValidationError') {
        err.statusCode = 400; // Bad Request
        err.message = `Ungültige Eingabe: ${err.message.substring(err.message.lastIndexOf('\n'))}`;
    }


    res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Optionally send stack in dev
    });
};