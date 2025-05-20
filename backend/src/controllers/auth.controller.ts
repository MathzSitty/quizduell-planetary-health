// Dateipfad: d:\quizduell-planetary-health\backend\src\controllers\auth.controller.ts
// backend/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { registerUserService, loginUserService } from '../services/auth.service';
import { isValidEmail, validateUsername, validatePassword, validateUniHandle } from '../utils/validation.util';
import { AppError } from '../utils/AppError';
import { prisma } from '../app'; // Import prisma client
import config from '../config';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.util'; // Make sure to import your email utility
import { hashPassword } from '../utils/password.util';

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

// Zeigt nur den forgotPassword-Controller
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new AppError('Bitte geben Sie eine E-Mail-Adresse ein.', 400);
    }
    
    if (!isValidEmail(email)) {
      throw new AppError('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 400);
    }
    
    console.log(`Passwort-Reset angefordert für: ${email}`);
    
    // Generiere Reset-Token und speichere in der Datenbank
    const { resetToken } = await generatePasswordResetTokenService(email);
    
    // Erstelle Reset-URL
    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;
    console.log(`Reset-URL generiert: ${resetUrl}`);
    
    // Erstelle E-Mail-Inhalt
    const message = `
      <h1>Passwort zurücksetzen</h1>
      <p>Sie erhalten diese E-Mail, weil Sie (oder jemand anderes) ein neues Passwort für Ihr Konto angefordert haben.</p>
      <p>Bitte klicken Sie auf den folgenden Button, um Ihr Passwort zurückzusetzen:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #ddbea9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Passwort zurücksetzen</a>
      <p>Wenn Sie kein neues Passwort angefordert haben, ignorieren Sie diese E-Mail bitte.</p>
      <p>Der Link ist eine Stunde lang gültig.</p>
    `;
    
    try {
      await sendEmail({
        to: email,
        subject: 'Passwort zurücksetzen - Planetary Health Quiz',
        html: message,
      });
      
      console.log(`Reset-E-Mail gesendet an: ${email}`);
      
      res.status(200).json({
        status: 'success',
        message: 'Falls ein Account existiert, wurde eine E-Mail mit weiteren Anweisungen gesendet.',
      });
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', error);
      throw new AppError('Es gab ein Problem beim Senden der E-Mail. Bitte versuchen Sie es später noch einmal.', 500);
    }
  } catch (error) {
    next(error);
  }
};

async function generatePasswordResetTokenService(email: string): Promise<{ resetToken: string }> {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
        // For security, do not reveal if user does not exist
        return { resetToken: crypto.randomBytes(32).toString('hex') };
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Hash token for storage
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiry on user using Prisma
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: hashedToken,
            passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
    });

    return { resetToken };
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      throw new AppError('Bitte geben Sie ein neues Passwort ein.', 400);
    }
    
    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message || 'Ungültiges Passwort.', 400);
    }
    
    // Reset password using service
    await resetPasswordService(token, password);
    
    res.status(200).json({
      status: 'success',
      message: 'Passwort erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.'
    });
  } catch (error) {
    next(error);
  }
};

// Only keep this version of resetPasswordService and delete the duplicate
async function resetPasswordService(token: string, password: string): Promise<void> {
    // Hash the token to compare with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by reset token and check if token is not expired
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: {
                gt: new Date() // Check if token is not expired
            }
        }
    });

    if (!user) {
        throw new AppError('Token ist ungültig oder abgelaufen.', 400);
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user with new password and remove reset token fields
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        },
    });
}