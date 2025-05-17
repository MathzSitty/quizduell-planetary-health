// backend/src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { getLeaderboardService, getUserProfileService } from '../services/user.service';

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        const leaderboard = await getLeaderboardService(limit);
        res.status(200).json({
            status: 'success',
            data: {
                leaderboard,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id; // ID des Benutzers, dessen Profil angefordert wird
        // Hier könntest du eine Berechtigungsprüfung einbauen:
        // Ist der anfragende Benutzer (req.user.id) derselbe wie userId oder ein Admin?
        // Für ein öffentliches Leaderboard-Profil ist das vielleicht nicht nötig.

        const profile = await getUserProfileService(userId);
        if (!profile) {
            return res.status(404).json({ message: 'Benutzerprofil nicht gefunden.' });
        }

        // Wenn es das eigene Profil ist oder Admin, zeige E-Mail, sonst nicht.
        // Diese Logik ist hier vereinfacht.
        const showEmail = req.user && (req.user.id === userId || req.user.role === 'ADMIN');
        if (!showEmail && profile.email) {
            delete profile.email;
        }


        res.status(200).json({
            status: 'success',
            data: {
                profile,
            },
        });
    } catch (error) {
        next(error);
    }
};