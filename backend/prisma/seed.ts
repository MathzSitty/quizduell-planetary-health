// backend/prisma/seed.ts
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { Role } from '../src/types/enums';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config(); // Lade .env Variablen für das Seed-Skript

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'changeme'; // Hole aus .env
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
            // Optional: Update existing admin if needed
            password: hashedPassword, // Update password if it changed
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

    const questionsData = [
        { text: 'Welcher Sektor ist weltweit für den größten Anteil an Treibhausgasemissionen verantwortlich, die durch menschliche Aktivitäten verursacht werden?', optionA: 'Globaler Transportsektor (Flug, Schiff, Straße)', optionB: 'Industrielle Prozesse und Produktnutzung', optionC: 'Energieerzeugung (Strom & Wärme aus fossilen Brennstoffen)', optionD: 'Landwirtschaft, Forstwirtschaft und andere Landnutzung (AFOLU)', correctOption: 'C', category: 'Klima', authorId: adminUser.id },
        { text: 'Was beschreibt das Konzept der "Planetary Boundaries" (Planetare Grenzen) am besten?', optionA: 'Die maximal zulässige Anzahl von Menschen auf der Erde, um Überbevölkerung zu vermeiden.', optionB: 'Geografische Grenzen zwischen Nationalstaaten, die für den Umweltschutz relevant sind.', optionC: 'Neun wissenschaftlich definierte ökologische Belastungsgrenzen der Erde, deren Überschreitung die Stabilität des Erdsystems gefährdet.', optionD: 'Die äußersten Grenzen des Sonnensystems, die von Menschen mit aktueller Technologie erreicht werden können.', correctOption: 'C', category: 'Planetary Health', authorId: adminUser.id },
        { text: 'Welche der folgenden Aussagen über Biodiversitätsverlust ist FALSCH?', optionA: 'Er bedroht die globale Nahrungsmittelsicherheit durch den Verlust von Bestäubern und genetischer Vielfalt.', optionB: 'Er hat nachweislich keine direkten Auswirkungen auf die Entstehung und Verbreitung von Zoonosen (Krankheiten, die von Tieren auf Menschen übertragen werden).', optionC: 'Er wird maßgeblich durch Habitatzerstörung, Übernutzung natürlicher Ressourcen, Umweltverschmutzung und den Klimawandel beschleunigt.', optionD: 'Er kann die Widerstandsfähigkeit (Resilienz) von Ökosystemen gegenüber Störungen wie Dürren oder Überschwemmungen schwächen.', correctOption: 'B', category: 'Biodiversität', authorId: adminUser.id },
        { text: 'Was ist ein zentrales Merkmal des "One Health"-Ansatzes?', optionA: 'Ein Fokus ausschließlich auf die Verbesserung der menschlichen Krankenhausversorgung und Medizintechnik.', optionB: 'Die Erkenntnis, dass die Gesundheit von Menschen, Tieren und Ökosystemen untrennbar miteinander verbunden ist und integrierte Lösungsansätze erfordert.', optionC: 'Die Entwicklung einer universellen globalen Krankenversicherung, die alle Menschen weltweit abdeckt.', optionD: 'Die Forschung nach einem einzigen "Wundermittel", das die häufigsten Krankheiten bei Mensch und Tier heilen kann.', correctOption: 'B', category: 'Gesundheitssysteme', authorId: adminUser.id },
        { text: 'Wie viel Prozent der globalen Landfläche (ohne Antarktis und Grönland) sind laut einer Studie von 2020 noch als ökologisch intakte Wildnisgebiete einzustufen?', optionA: 'Ungefähr 52%', optionB: 'Ungefähr 38%', optionC: 'Weniger als 25% (ca. 23%)', optionD: 'Nur noch etwa 10%', correctOption: 'C', category: 'Landnutzung', authorId: adminUser.id },
        { text: 'Welches der folgenden Treibhausgase hat das höchste Treibhauspotenzial (Global Warming Potential, GWP) über einen Zeitraum von 100 Jahren im Vergleich zu CO2 (GWP=1)?', optionA: 'Methan (CH4)', optionB: 'Distickstoffoxid (Lachgas, N2O)', optionC: 'Schwefelhexafluorid (SF6)', optionD: 'Fluorchlorkohlenwasserstoffe (FCKW, z.B. R-12)', correctOption: 'C', category: 'Klima', authorId: adminUser.id },
    ];

    for (const q of questionsData) {
        // Using upsert to avoid duplicate questions if seed is run multiple times
        // It will create if text doesn't exist, or update if it does (though update block is empty here)
        await prisma.question.upsert({
            where: { text: q.text }, // Requires @unique on text field
            update: {
                // Update fields if question already exists, e.g. options or category
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                correctOption: q.correctOption,
                category: q.category,
                authorId: q.authorId, // Ensure author is correctly linked
            },
            create: q,
        });
    }
    console.log(`Seeded ${questionsData.length} questions.`);

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