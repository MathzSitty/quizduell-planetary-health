// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { Role } from '../src/types/enums';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

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

    // Kategorisiere bestehende Fragen nach Schwierigkeit
    const questionsData = [
        // EASY Fragen - Grundwissen
        {
            text: 'Welches ist das am häufigsten vorkommende Treibhausgas in der Erdatmosphäre, das maßgeblich zur globalen Erwärmung beiträgt?',
            optionA: 'Methan (CH4)',
            optionB: 'Lachgas (N2O)',
            optionC: 'Kohlendioxid (CO2)',
            optionD: 'Fluorierte Gase (F-Gase)',
            correctOption: 'C',
            difficulty: 'EASY',
            category: 'Planetary Health',
            source: 'https://www.c2es.org/content/main-greenhouse-gases/',
            authorId: adminUser.id,
        },
        {
            text: 'Was misst die Keeling-Kurve?',
            optionA: 'Die Dicke der Ozonschicht',
            optionB: 'Die Konzentration von Kohlendioxid (CO2) in der Atmosphäre',
            optionC: 'Den durchschnittlichen globalen Meeresspiegelanstieg',
            optionD: 'Die jährliche globale Durchschnittstemperatur',
            correctOption: 'B',
            difficulty: 'EASY',
            category: 'Planetary Health',
            source: 'https://keelingcurve.ucsd.edu/',
            authorId: adminUser.id,
        },
        {
            text: 'Was ist die Hauptursache für die Versauerung der Ozeane?',
            optionA: 'Ölverschmutzung durch Tankerunfälle',
            optionB: 'Einleitung von Industrieabwässern',
            optionC: 'Aufnahme von Kohlendioxid (CO2) aus der Atmosphäre',
            optionD: 'Plastikmüll in den Meeren',
            correctOption: 'C',
            difficulty: 'EASY',
            category: 'Planetary Health',
            source: 'https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-acidification',
            authorId: adminUser.id,
        },

        // MEDIUM Fragen - Vertieftes Wissen
        {
            text: 'Welches Treibhausgas hat das höchste globale Erwärmungspotenzial (GWP) über einen Zeitraum von 100 Jahren?',
            optionA: 'Kohlendioxid (CO2)',
            optionB: 'Methan (CH4)',
            optionC: 'Lachgas (N2O)',
            optionD: 'Schwefelhexafluorid (SF6)',
            correctOption: 'D',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://ifeaa.com/sulfur-hexafluoride-sf6-the-most-potent-greenhouse-gas/',
            authorId: adminUser.id,
        },
        {
            text: 'Was versteht man unter dem Begriff "Planetary Health"?',
            optionA: 'Die ausschließliche Gesundheit von Pflanzen und Tieren.',
            optionB: 'Die Gesundheit der menschlichen Zivilisation und der Zustand der natürlichen Systeme, von denen sie abhängt.',
            optionC: 'Die Erforschung außerirdischer Ökosysteme.',
            optionD: 'Ein neues Fitnessprogramm mit Fokus auf Outdoor-Aktivitäten.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(15)61038-8/fulltext',
            authorId: adminUser.id,
        },
        {
            text: 'Was ist ein "Tipping Point" (Kipppunkt) im Klimasystem?',
            optionA: 'Der Punkt, an dem die globale Durchschnittstemperatur zu sinken beginnt.',
            optionB: 'Ein Grenzwert, bei dessen Überschreitung sich das Klima abrupt und unumkehrbar verändert.',
            optionC: 'Der Zeitpunkt, an dem alle Länder klimaneutral werden.',
            optionD: 'Ein jährliches Treffen von Klimaexperten.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.ipcc.ch/sr15/chapter/chapter-1/',
            authorId: adminUser.id,
        },

        // HARD Fragen - Expertenwissen
        {
            text: 'Welche Rolle spielt die planetare Belastungsgrenze (Planetary Boundary) "Klimawandel" im Konzept der planetaren Grenzen?',
            optionA: 'Sie ist die einzige Grenze, die bereits überschritten wurde.',
            optionB: 'Sie ist eine von mehreren kritischen Grenzen, deren Überschreitung die Stabilität des Erdsystems gefährden kann.',
            optionC: 'Sie hat den geringsten Einfluss auf die menschliche Gesundheit.',
            optionD: 'Sie kann durch technologische Innovationen leicht wieder in einen sicheren Bereich gebracht werden.',
            correctOption: 'B',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.stockholmresilience.org/research/planetary-boundaries/the-nine-planetary-boundaries.html',
            authorId: adminUser.id,
        },
        {
            text: 'Was ist der primäre Mechanismus, durch den der Verlust der Artenvielfalt die Stabilität von Ökosystemen beeinträchtigen kann?',
            optionA: 'Es führt zu einer Zunahme von Raubtieren.',
            optionB: 'Es verringert die genetische Vielfalt und damit die Anpassungsfähigkeit an Umweltveränderungen und reduziert die Redundanz wichtiger ökologischer Funktionen.',
            optionC: 'Es erhöht die Konkurrenz zwischen den verbleibenden Arten.',
            optionD: 'Es führt immer zu einer Zunahme der Biomasseproduktion.',
            correctOption: 'B',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.nature.com/scitable/knowledge/library/biodiversity-and-ecosystem-stability-17059965/',
            authorId: adminUser.id,
        },
        {
            text: 'Wie beeinflusst die Versauerung der Ozeane die Fähigkeit des Meerwassers, CO2 aus der Atmosphäre aufzunehmen?',
            optionA: 'Sie erhöht die Aufnahmekapazität deutlich.',
            optionB: 'Sie hat keinen Einfluss auf die Aufnahmekapazität.',
            optionC: 'Sie kann die Fähigkeit des Ozeans, weiteres CO2 aufzunehmen, verringern.',
            optionD: 'Sie führt dazu, dass der Ozean CO2 schneller wieder an die Atmosphäre abgibt.',
            correctOption: 'C',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.pmel.noaa.gov/co2/story/Ocean+Acidification',
            authorId: adminUser.id,
        },
    ];

    for (const q of questionsData) {
        await prisma.question.upsert({
            where: { text: q.text },
            update: {
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                correctOption: q.correctOption,
                category: q.category,
                source: q.source,
                difficulty: q.difficulty as any, // TypeScript cast
                authorId: q.authorId,
            },
            create: q as any,
        });
    }

    console.log(`Seeded ${questionsData.length} questions with difficulty levels.`);
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