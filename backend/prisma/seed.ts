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
        // Die 20 Fragen mit Quellen
        { text: 'Welches Konzept beschreibt die wissenschaftliche Analyse der menschlichen Gesundheit und der Gesundheit der natürlichen Systeme der Erde als eng miteinander verbunden?', optionA: 'Ökologischer Fußabdruck', optionB: 'Nachhaltige Entwicklung', optionC: 'Planetary Health', optionD: 'Biodiversitätsschutz', correctOption: 'C', category: 'Planetary Health', source: 'https://www.planetaryhealthalliance.org/planetary-health', authorId: adminUser.id },
        
        { text: 'Welches der folgenden Treibhausgase hat das höchste "Global Warming Potential" (GWP) über einen Zeitraum von 100 Jahren pro Molekül, auch wenn es in geringeren Konzentrationen als CO2 vorkommt?', optionA: 'Kohlendioxid (CO2)', optionB: 'Methan (CH4)', optionC: 'Distickstoffmonoxid (N2O)', optionD: 'Schwefelhexafluorid (SF6)', correctOption: 'D', category: 'Klima', source: 'https://www.epa.gov/ghgemissions/understanding-global-warming-potentials', authorId: adminUser.id },
        
        { text: 'Was versteht man unter "Biodiversitäts-Hotspots"?', optionA: 'Regionen mit der höchsten Anzahl an Zoos und botanischen Gärten.', optionB: 'Gebiete mit einer außergewöhnlich hohen Konzentration endemischer Arten, die stark bedroht sind.', optionC: 'Orte, an denen regelmäßig neue Tierarten entdeckt werden.', optionD: 'Beliebte Touristenziele in Naturschutzgebieten.', correctOption: 'B', category: 'Biodiversität', source: 'https://www.conservation.org/priorities/biodiversity-hotspots', authorId: adminUser.id },
        
        { text: 'Welcher Sektor ist weltweit einer der größten Verursacher von Entwaldung, insbesondere im Amazonasgebiet?', optionA: 'Papierindustrie', optionB: 'Städtische Expansion', optionC: 'Viehzucht (insbesondere für Rindfleisch und Sojaanbau für Tierfutter)', optionD: 'Bergbau', correctOption: 'C', category: 'Landnutzung', source: 'https://www.worldwildlife.org/magazine/issues/summer-2018/articles/what-are-the-biggest-drivers-of-tropical-deforestation', authorId: adminUser.id },
        
        { text: 'Was ist das Hauptziel des Pariser Klimaabkommens?', optionA: 'Die globale Erwärmung auf deutlich unter 2 Grad Celsius, möglichst auf 1,5 Grad Celsius, gegenüber dem vorindustriellen Niveau zu begrenzen.', optionB: 'Den Einsatz fossiler Brennstoffe bis 2030 weltweit vollständig zu beenden.', optionC: 'Alle Länder zu verpflichten, ihre CO2-Emissionen jährlich um 5 % zu senken.', optionD: 'Ein globales Handelssystem für Emissionszertifikate einzuführen.', correctOption: 'A', category: 'Klima', source: 'https://unfccc.int/process-and-meetings/the-paris-agreement/the-paris-agreement', authorId: adminUser.id },
        
        { text: 'Welche der folgenden Alltagshandlungen hat oft den größten positiven Impact auf die Reduktion des persönlichen CO2-Fußabdrucks im Bereich Ernährung?', optionA: 'Nur noch Leitungswasser statt Wasser aus Plastikflaschen trinken.', optionB: 'Reduktion des Konsums von rotem Fleisch und Milchprodukten.', optionC: 'Ausschließlich Bio-Produkte kaufen.', optionD: 'Lebensmittelverschwendung komplett vermeiden.', correctOption: 'B', category: 'Ernährung', source: 'https://science.org/doi/10.1126/science.aaq0216', authorId: adminUser.id },
        
        { text: 'Was versteht man unter "Mikroplastik"?', optionA: 'Plastikmüll, der kleiner als 5 Millimeter ist.', optionB: 'Spezielle Kunststoffe, die in Mikroskopen verwendet werden.', optionC: 'Biologisch abbaubare Kunststoffe.', optionD: 'Kunststoffe, die nur aus einem einzigen Polymertyp bestehen.', correctOption: 'A', category: 'Umweltverschmutzung', source: 'https://www.nationalgeographic.org/encyclopedia/microplastics/', authorId: adminUser.id },
        
        { text: 'Welches der "Sustainable Development Goals" (SDGs) der UN befasst sich explizit mit Maßnahmen zum Klimaschutz?', optionA: 'SDG 7: Bezahlbare und saubere Energie', optionB: 'SDG 12: Nachhaltige/r Konsum und Produktion', optionC: 'SDG 13: Maßnahmen zum Klimaschutz', optionD: 'SDG 15: Leben an Land', correctOption: 'C', category: 'Nachhaltige Entwicklung', source: 'https://sdgs.un.org/goals/goal13', authorId: adminUser.id },
        
        { text: 'Was ist der "Erdüberlastungstag" (Earth Overshoot Day)?', optionA: 'Der Tag, an dem die weltweite Nachfrage nach ökologischen Ressourcen und Dienstleistungen in einem bestimmten Jahr das übersteigt, was die Erde in diesem Jahr regenerieren kann.', optionB: 'Ein internationaler Feiertag, um auf Umweltprobleme aufmerksam zu machen.', optionC: 'Der Tag, an dem die globale Durchschnittstemperatur einen kritischen Wert überschreitet.', optionD: 'Der letzte Tag im Jahr, an dem noch fossile Brennstoffe legal gefördert werden dürfen.', correctOption: 'A', category: 'Ressourcenverbrauch', source: 'https://www.overshootday.org/', authorId: adminUser.id },
        
        { text: 'Welche Auswirkung hat die Versauerung der Ozeane primär auf Meeresorganismen?', optionA: 'Sie führt zu einem verstärkten Algenwachstum.', optionB: 'Sie erschwert die Bildung von Kalkschalen und Skeletten bei Organismen wie Korallen und Muscheln.', optionC: 'Sie erhöht die Wassertemperatur und führt zu Korallenbleiche.', optionD: 'Sie verbessert die Sauerstoffaufnahme für Fische.', correctOption: 'B', category: 'Ozeane', source: 'https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-acidification', authorId: adminUser.id },
        
        { text: 'Welcher der folgenden Bereiche ist KEIN Kernprinzip der Kreislaufwirtschaft (Circular Economy)?', optionA: 'Abfallvermeidung und Wiederverwendung von Produkten.', optionB: 'Maximierung des Rohstoffabbaus zur Sicherung der Versorgung.', optionC: 'Reparatur und Aufarbeitung von Gütern.', optionD: 'Recycling von Materialien am Ende ihrer Nutzungsdauer.', correctOption: 'B', category: 'Nachhaltiges Wirtschaften', source: 'https://ellenmacarthurfoundation.org/topics/circular-economy-introduction/overview', authorId: adminUser.id },
        
        { text: '"Fast Fashion" ist ein Geschäftsmodell der Modeindustrie. Welches ist ein typisches Merkmal mit negativen Umweltauswirkungen?', optionA: 'Verwendung langlebiger, hochwertiger Materialien.', optionB: 'Kurze Produktionszyklen und häufig wechselnde Kollektionen, die zu Überproduktion und Textilmüll führen.', optionC: 'Fokus auf zeitlose Designs, die lange getragen werden können.', optionD: 'Hohe Preise, die den Wert der Kleidung widerspiegeln.', correctOption: 'B', category: 'Konsum', source: 'https://www.unep.org/news-and-stories/story/putting-brakes-fast-fashion', authorId: adminUser.id },
        
        { text: 'Was ist eine der Hauptursachen für den Verlust von Bestäuberinsekten wie Bienen und Schmetterlingen?', optionA: 'Zunahme von gentechnisch veränderten Pflanzen.', optionB: 'Verlust von Lebensräumen und Nahrungsquellen durch intensive Landwirtschaft und Pestizideinsatz.', optionC: 'Übermäßige Honigernte durch Imker.', optionD: 'Klimawandel-bedingte Zunahme von Stürmen.', correctOption: 'B', category: 'Biodiversität', source: 'https://www.ipbes.net/assessment-reports/pollinators', authorId: adminUser.id },
        
        { text: 'Welche Rolle spielen Moore und Feuchtgebiete im globalen Kohlenstoffkreislauf?', optionA: 'Sie sind unbedeutend, da sie nur kleine Flächen bedecken.', optionB: 'Sie sind wichtige Kohlenstoffquellen, da sie viel Methan freisetzen.', optionC: 'Sie sind extrem effiziente Kohlenstoffsenken, die große Mengen Kohlenstoff im Torf speichern.', optionD: 'Sie wandeln atmosphärischen Stickstoff in Kohlenstoff um.', correctOption: 'C', category: 'Ökosysteme', source: 'https://www.ramsar.org/sites/default/files/documents/library/bn7e.pdf', authorId: adminUser.id },
        
        { text: 'Was beschreibt der Begriff "virtuelles Wasser" im Zusammenhang mit einem Produkt (z.B. einem T-Shirt oder einem Kilogramm Rindfleisch)?', optionA: 'Der Wasseranteil, der direkt im Produkt enthalten ist.', optionB: 'Die gesamte Wassermenge, die bei der Herstellung des Produkts entlang der gesamten Wertschöpfungskette verbraucht wurde.', optionC: 'Das Wasser, das zur Reinigung des Produkts während seiner Lebensdauer benötigt wird.', optionD: 'Wasser, das durch digitale Technologien simuliert wird.', correctOption: 'B', category: 'Ressourcenverbrauch', source: 'https://waterfootprint.org/en/water-footprint/national-water-footprint/', authorId: adminUser.id },
        
        { text: 'Welche der folgenden Energiequellen gilt als erneuerbar UND verursacht bei der Stromerzeugung direkt keine Treibhausgasemissionen?', optionA: 'Erdgas', optionB: 'Kernenergie', optionC: 'Windenergie', optionD: 'Kohle mit CO2-Abscheidung und -Speicherung (CCS)', correctOption: 'C', category: 'Energie', source: 'https://www.iea.org/fuels-and-technologies/renewables', authorId: adminUser.id },
        
        { text: 'Was ist ein wesentlicher Vorteil von "Urban Gardening" oder städtischer Landwirtschaft für die Umwelt und das soziale Leben in Städten?', optionA: 'Es ersetzt vollständig die Notwendigkeit von Supermärkten.', optionB: 'Es kann zur Reduktion von Transportwegen für Lebensmittel, zur Verbesserung des Mikroklimas und zur Stärkung der Gemeinschaft beitragen.', optionC: 'Es löst das Problem der globalen Lebensmittelknappheit.', optionD: 'Es ist die profitabelste Form der Landwirtschaft.', correctOption: 'B', category: 'Nachhaltige Städte', source: 'https://www.fao.org/urban-agriculture/en/', authorId: adminUser.id },
        
        { text: 'Welches Problem wird durch den übermäßigen Einsatz von Stickstoffdüngern in der Landwirtschaft maßgeblich verursacht?', optionA: 'Ozonloch-Erweiterung', optionB: 'Versauerung der Böden und Eutrophierung von Gewässern (z.B. Algenblüten).', optionC: 'Erhöhte Schwermetallbelastung im Boden.', optionD: 'Verringerung der Bodenfruchtbarkeit durch Austrocknung.', correctOption: 'B', category: 'Landwirtschaft', source: 'https://www.epa.gov/nutrientpollution/sources-and-solutions-agriculture', authorId: adminUser.id },
        
        { text: 'Was ist der Hauptzweck von Umweltzonen in Städten, wie sie auch in Deutschland existieren?', optionA: 'Die Erhebung von zusätzlichen Steuern für Autofahrer.', optionB: 'Die Reduktion der Lärmbelästigung durch Verkehr.', optionC: 'Die Verbesserung der Luftqualität durch Ausschluss von Fahrzeugen mit hohen Schadstoffemissionen.', optionD: 'Die Förderung des Fahrradverkehrs durch autofreie Bereiche.', correctOption: 'C', category: 'Luftqualität', source: 'https://www.umweltbundesamt.de/themen/luft/luftschadstoffe/feinstaub/umweltzonen-deutschland', authorId: adminUser.id },
        
        { text: 'Welche der folgenden Aussagen über die Auswirkungen des globalen Flugverkehrs auf das Klima ist am zutreffendsten?', optionA: 'Flugverkehr hat nur einen minimalen Einfluss auf das Klima, da Flugzeuge sehr effizient sind.', optionB: 'Neben CO2-Emissionen tragen auch andere Emissionen in großer Höhe (z.B. Stickoxide, Wasserdampf, Kondensstreifen) signifikant zur Klimaerwärmung bei.', optionC: 'Die Klimawirkung des Flugverkehrs wird durch die niedrigen Temperaturen in Reiseflughöhe neutralisiert.', optionD: 'Der Flugverkehr ist nur für die lokale Luftverschmutzung an Flughäfen relevant.', correctOption: 'B', category: 'Mobilität', source: 'https://www.atmosfair.de/de/fliegen_und_klima/flugverkehr_und_klima/klimawirkung_flugverkehr/', authorId: adminUser.id },
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
                source: q.source, // Wichtig: Source-Feld auch beim Update aktualisieren
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