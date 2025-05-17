// backend/src/services/user.service.ts
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export const getLeaderboardService = async (limit = 10): Promise<Partial<User>[]> => {
    return prisma.user.findMany({
        orderBy: {
            score: 'desc',
        },
        take: limit,
        select: { // Wähle nur die benötigten Felder aus
            id: true,
            name: true,
            uniHandle: true,
            score: true,
            role: true, // Optional, falls du Admins anders anzeigen willst
        },
    });
};

export const getUserProfileService = async (userId: string): Promise<Partial<User> | null> => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true, // Nur wenn der User sein eigenes Profil abruft oder Admin ist
            uniHandle: true,
            score: true,
            role: true,
            createdAt: true,
            // Füge hier ggf. Relationen hinzu, z.B. gespielte Spiele
        }
    });
};