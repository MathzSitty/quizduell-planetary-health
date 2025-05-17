// backend/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { registerUserService, loginUserService } from '../services/auth.service';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, uniHandle } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, E-Mail und Passwort sind erforderlich."});
        }
        const result = await registerUserService({ name, email, password, uniHandle });
        res.status(201).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error); // Übergibt den Fehler an die errorMiddleware
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "E-Mail und Passwort sind erforderlich."});
        }
        const result = await loginUserService({ email, password });
        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // req.user wird von der 'protect' Middleware gesetzt
        if (!req.user) {
            return res.status(401).json({ message: 'Nicht authentifiziert.' });
        }
        // Hier könntest du den User frisch aus der DB laden, wenn mehr Details benötigt werden
        // Für dieses Beispiel nehmen wir an, req.user enthält genug Infos oder wir laden sie hier.
        // const user = await prisma.user.findUnique({ where: { id: req.user.id }});
        // if (!user) return res.status(401).json({ message: 'Benutzer nicht gefunden.' });

        res.status(200).json({
            status: 'success',
            data: {
                user: req.user // Enthält id und role aus dem Token/DB-Check in `protect`
            },
        });
    } catch (error) {
        next(error);
    }
};