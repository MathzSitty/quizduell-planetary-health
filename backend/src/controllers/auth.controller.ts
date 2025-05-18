// Dateipfad: d:\quizduell-planetary-health\backend\src\controllers\auth.controller.ts
// backend/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { registerUserService, loginUserService } from '../services/auth.service';
import { isValidEmail, validateUsername, validatePassword, validateUniHandle } from '../utils/validation.util';
import { AppError } from '../utils/AppError';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, uniHandle } = req.body;
        
        // Basis-Validierung
        if (!name || !email || !password) {
            throw new AppError("Name, E-Mail und Passwort sind erforderlich.", 400);
        }
        
        // E-Mail-Validierung
        if (!isValidEmail(email)) {
            throw new AppError("Bitte geben Sie eine gültige E-Mail-Adresse ein.", 400);
        }
        
        // Benutzername-Validierung
        const nameValidation = validateUsername(name);
        if (!nameValidation.valid) {
            throw new AppError(nameValidation.message || "Ungültiger Benutzername.", 400);
        }
        
        // Uni-Kürzel validieren (HINZUFÜGEN/ÜBERPRÜFEN) !!!
        if (uniHandle) {
            const uniHandleValidation = validateUniHandle(uniHandle);
            if (!uniHandleValidation.valid) {
                throw new AppError(uniHandleValidation.message || "Ungültiges Uni-Kürzel.", 400);
            }
        }
        
        // Passwort-Validierung
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            throw new AppError(passwordValidation.message || "Ungültiges Passwort.", 400);
        }
        
        // Wenn alle Validierungen bestanden wurden, registriere den Benutzer
        const result = await registerUserService({ name, email, password, uniHandle });
        res.status(201).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new AppError("E-Mail und Passwort sind erforderlich.", 400);
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
        if (!req.user) {
            return res.status(401).json({ message: 'Nicht authentifiziert.' });
        }
        res.json({ status: 'success', data: req.user });
    } catch (error) {
        next(error);
    }
};