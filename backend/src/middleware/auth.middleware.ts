// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { prisma } from '../app'; // Import prisma instance from app.ts
import { Role } from '../types/enums';

// Extend Express Request type to include 'user'
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: Role;
            };
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Nicht autorisiert, kein Token vorhanden.' });
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ message: 'Nicht autorisiert, Token ungültig.' });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!currentUser) {
            return res.status(401).json({ message: 'Nicht autorisiert, Benutzer existiert nicht mehr.' });
        }

        // Hier ist die Korrektur - wir konvertieren den String zu Role Enum
        req.user = {
            id: currentUser.id,
            role: currentUser.role as Role,  // Typkonvertierung von string zu Role
        };

        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ message: 'Nicht autorisiert, Token ungültig.' });
    }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Setzt voraus, dass protect Middleware zuerst ausgeführt wurde
    if (req.user && req.user.role === Role.ADMIN) {
        next();
    } else {
        res.status(403).json({ message: 'Zugriff verweigert. Nur Administratoren.' });
    }
};