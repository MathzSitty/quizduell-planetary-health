// Dateipfad: d:\quizduell-planetary-health\backend\src\middleware\rate-limit.middleware.ts
import { Request, Response, NextFunction } from 'express';

// Einfache In-Memory-Implementierung (für Produktionsumgebungen besser Redis verwenden)
const ipRequests = new Map<string, { count: number, resetTime: number }>();

export const loginRateLimit = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        
        if (!ipRequests.has(ip)) {
            ipRequests.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const request = ipRequests.get(ip)!;
        
        // Zeitfenster zurücksetzen, wenn die Zeit abgelaufen ist
        if (now > request.resetTime) {
            request.count = 1;
            request.resetTime = now + windowMs;
            return next();
        }
        
        // Max Anfragen erreicht
        if (request.count >= maxRequests) {
            return res.status(429).json({
                status: 'error',
                message: `Zu viele Anfragen. Bitte versuchen Sie es in ${Math.ceil((request.resetTime - now) / 1000 / 60)} Minuten erneut.`
            });
        }
        
        // Anfragezähler erhöhen und fortfahren
        request.count++;
        return next();
    };
};