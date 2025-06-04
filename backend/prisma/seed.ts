import { PrismaClient } from '@prisma/client';
import { Role } from '../src/types/enums';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'changeme';
    const adminName = process.env.INITIAL_ADMIN_NAME || 'Admin User';
    const adminUniHandle = process.env.INITIAL_ADMIN_UNIHANDLE || 'HS-Admin';

    if (adminPassword === 'changeme' || adminPassword.length < 8) {
        console.warn(
            'WARNING: Initial admin password is weak or default. Please set a strong INITIAL_ADMIN_PASSWORD in your .env file.',
        );
    }
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            role: Role.ADMIN,
        },
        create: {
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            role: Role.ADMIN,
            uniHandle: adminUniHandle,
        },
    });
    console.log(`Created/updated admin user: ${adminUser.email}`);

    // WICHTIG: Lösche in der richtigen Reihenfolge wegen Foreign Key Constraints
    console.log('Deleting existing data...');
    
    // 1. Lösche GameRounds zuerst (sie referenzieren Questions)
    await prisma.gameRound.deleteMany({});
    console.log('Deleted all game rounds.');
    
    // 2. Lösche Games (sie referenzieren Users, aber Users bleiben bestehen)
    await prisma.game.deleteMany({});
    console.log('Deleted all games.');
    
    // 3. Jetzt können wir sicher alle Fragen löschen
    await prisma.question.deleteMany({});
    console.log('Deleted all existing questions.');

    // Lade Fragendaten aus JSON-Datei
    const questionsPath = path.join(__dirname, 'data', 'questions.json');
    const questionsRaw = fs.readFileSync(questionsPath, 'utf-8');
    const questionsData = JSON.parse(questionsRaw);

    // Füge die neuen Fragen hinzu
    for (const q of questionsData) {
        await prisma.question.create({
            data: {
                ...q,
                authorId: adminUser.id
            } as any,
        });
    }

    console.log(`Seeded ${questionsData.length} new questions with difficulty levels.`);
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });