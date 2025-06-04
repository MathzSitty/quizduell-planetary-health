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

    // NEUE FRAGENBASIS - Vollständig ersetzt
    const questionsData = [
        // LEICHTE FRAGEN
        {
            text: 'Was versteht man unter dem Begriff "Nachhaltigkeit" im ursprünglichen Sinne?',
            optionA: 'Maximale Ressourcennutzung zur wirtschaftlichen Effizienz',
            optionB: 'Verzicht auf jegliche Nutzung natürlicher Ressourcen',
            optionC: 'Nutzung von Ressourcen in einer Weise, die ihre Regeneration ermöglicht',
            optionD: 'Ausschließliche Konzentration auf technologische Innovationen',
            correctOption: 'C',
            difficulty: 'EASY',
            category: 'Planetary Health',
            source: 'https://www.bpb.de/shop/zeitschriften/izpb/umweltpolitik-287/8983/leitbild-der-nachhaltigen-entwicklung/',
            authorId: adminUser.id,
        },
        {
            text: 'Welche Definition von nachhaltiger Entwicklung wurde 1987 von der Brundtland-Kommission vorgeschlagen?',
            optionA: 'Entwicklung, die ausschließlich wirtschaftliches Wachstum fördert',
            optionB: 'Entwicklung, die die Bedürfnisse der Gegenwart befriedigt, ohne die Möglichkeiten künftiger Generationen zu gefährden',
            optionC: 'Entwicklung, die auf technologische Innovationen fokussiert',
            optionD: 'Entwicklung, die nur ökologische Aspekte berücksichtigt',
            correctOption: 'B',
            difficulty: 'EASY',
            category: 'Planetary Health',
            source: 'https://www.bpb.de/shop/zeitschriften/izpb/umweltpolitik-287/8983/leitbild-der-nachhaltigen-entwicklung/',
            authorId: adminUser.id,
        },
        {
            text: 'Was ist die Kernbotschaft des Konzepts "Planetary Health"?',
            optionA: 'Die menschliche Gesundheit hat Vorrang vor der Gesundheit des Planeten.',
            optionB: 'Technologischer Fortschritt allein kann alle Umweltprobleme lösen.',
            optionC: 'Die Gesundheit der Menschen ist untrennbar mit der Gesundheit der planetaren Ökosysteme verbunden.',
            optionD: 'Planetare Gesundheit konzentriert sich ausschließlich auf die Auswirkungen des Klimawandels.',
            correctOption: 'C',
            difficulty: 'EASY',
            category: 'Planetary Health',
            source: 'https://www.planetaryhealthalliance.org/planetary-health',
            authorId: adminUser.id,
        },
        {
            text: 'Was versteht man unter dem Begriff "ökologischer Fußabdruck"?',
            optionA: 'Die Gesamtfläche an Wald, die weltweit noch vorhanden ist.',
            optionB: 'Ein Maß für die Menge an Treibhausgasen, die eine Person oder Aktivität verursacht.',
            optionC: 'Die Fläche auf der Erde, die notwendig ist, um den Lebensstil und Lebensstandard eines Menschen (oder einer Bevölkerungsgruppe) dauerhaft zu ermöglichen, einschließlich der Flächen zur Bereitstellung von Ressourcen und zur Aufnahme von Abfällen.',
            optionD: 'Die Anzahl der Tier- und Pflanzenarten in einem bestimmten Ökosystem.',
            correctOption: 'C',
            difficulty: 'EASY',
            category: 'Planetary Health',
            source: 'https://www.footprintnetwork.org/our-work/ecological-footprint/',
            authorId: adminUser.id,
        },
        {
            text: 'Was ist der Hauptzweck des Übereinkommens von Paris (Pariser Abkommen)?',
            optionA: 'Die weltweite Förderung fossiler Brennstoffe zu regulieren.',
            optionB: 'Den globalen Temperaturanstieg in diesem Jahrhundert deutlich unter 2 Grad Celsius über dem vorindustriellen Niveau zu halten und Anstrengungen zu unternehmen, den Anstieg auf 1,5 Grad Celsius zu begrenzen.',
            optionC: 'Ein globales System für den Handel mit Emissionszertifikaten einzurichten.',
            optionD: 'Den Schutz der biologischen Vielfalt in Entwicklungsländern zu finanzieren.',
            correctOption: 'B',
            difficulty: 'EASY',
            category: 'Planetary Health',
            source: 'https://unfccc.int/process-and-meetings/the-paris-agreement',
            authorId: adminUser.id,
        },
        {
            text: 'Was sind die Hauptziele der Agenda 2030 für nachhaltige Entwicklung (Sustainable Development Goals, SDGs)?',
            optionA: 'Ausschließlich die Bekämpfung des Klimawandels und der Schutz der Umwelt.',
            optionB: 'Die Förderung des Wirtschaftswachstums in Industrieländern.',
            optionC: 'Ein universeller Aufruf zum Handeln, um Armut zu beenden, den Planeten zu schützen und sicherzustellen, dass bis 2030 alle Menschen in Frieden und Wohlstand leben, basierend auf 17 miteinander verknüpften Zielen.',
            optionD: 'Die Stärkung der militärischen Sicherheit weltweit.',
            correctOption: 'C',
            difficulty: 'EASY',
            category: 'Planetary Health',
            source: 'https://sdgs.un.org/goals',
            authorId: adminUser.id,
        },

        // MITTLERE FRAGEN
        {
            text: 'Welche gesundheitlichen Auswirkungen hat der Klimawandel laut WHO?',
            optionA: 'Reduktion von Atemwegserkrankungen',
            optionB: 'Keine signifikanten Auswirkungen',
            optionC: 'Zunahme von Krankheiten durch extreme Wetterereignisse',
            optionD: 'Verbesserung der allgemeinen Gesundheit',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health',
            authorId: adminUser.id,
        },
        {
            text: 'Welche Rolle spielen Moore im Klimaschutz?',
            optionA: 'Sie sind unwichtig für den Klimaschutz',
            optionB: 'Sie speichern große Mengen CO₂',
            optionC: 'Sie erhöhen den CO₂-Ausstoß',
            optionD: 'Sie dienen ausschließlich der Landwirtschaft',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.umweltbundesamt.de/bild/treibhausgas-emissionen-aus-mooren',
            authorId: adminUser.id,
        },
        {
            text: 'Was beschreibt der Begriff "One Health"?',
            optionA: 'Ein Gesundheitsprogramm für Einzelpersonen',
            optionB: 'Ein Ansatz, der die Gesundheit von Menschen, Tieren und Ökosystemen gemeinsam betrachtet',
            optionC: 'Ein Tiergesundheitsprogramm der WHO',
            optionD: 'Eine Initiative zur Förderung von Einzelgesundheitsdaten',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.who.int/health-topics/one-health#tab=tab_1',
            authorId: adminUser.id,
        },
        {
            text: 'Welche Auswirkungen hat der Klimawandel auf die Verbreitung von Mücken und damit verbundenen Krankheiten?',
            optionA: 'Keine Auswirkungen',
            optionB: 'Reduktion der Mückenpopulationen',
            optionC: 'Ausbreitung von Mücken in neue Gebiete und Zunahme von Krankheiten wie Dengue und Malaria',
            optionD: 'Verringerung der Krankheitsübertragung',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health',
            authorId: adminUser.id,
        },
        {
            text: 'Welche direkten gesundheitlichen Folgen hat der Klimawandel laut WHO?',
            optionA: 'Verbesserung der Luftqualität',
            optionB: 'Zunahme von Hitzestress, Malaria, Durchfall und Mangelernährung',
            optionC: 'Reduktion von Infektionskrankheiten',
            optionD: 'Keine signifikanten gesundheitlichen Auswirkungen',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health',
            authorId: adminUser.id,
        },
        {
            text: 'Welche Ziele hat Deutschland laut Bundes-Klimaschutzgesetz bis 2045?',
            optionA: 'Reduktion der Emissionen um 50% gegenüber 1990',
            optionB: 'Erreichen der Netto-Treibhausgasneutralität',
            optionC: 'Verdopplung der Emissionen',
            optionD: 'Keine spezifischen Ziele',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.umweltbundesamt.de/daten/klima/treibhausgasminderungsziele-deutschlands',
            authorId: adminUser.id,
        },
        {
            text: 'Welche Organisation hat den Begriff "One Health" definiert?',
            optionA: 'UNESCO',
            optionB: 'IPCC',
            optionC: 'WHO',
            optionD: 'Greenpeace',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.who.int/health-topics/one-health#tab=tab_1',
            authorId: adminUser.id,
        },
        {
            text: 'Was versteht man unter dem Konzept der "planetaren Grenzen"?',
            optionA: 'Die maximal tolerierbare Umweltverschmutzung in städtischen Gebieten.',
            optionB: 'Die Grenzen des Wirtschaftswachstums auf einem endlichen Planeten.',
            optionC: 'Wissenschaftlich definierte Belastungsgrenzen für neun kritische Erdsystemprozesse, deren Überschreitung die Stabilität der Erde gefährden kann.',
            optionD: 'Die politischen Grenzen zwischen Nationen im Kontext globaler Umweltabkommen.',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.stockholmresilience.org/research/planetary-boundaries.html',
            authorId: adminUser.id,
        },
        {
            text: 'Warum ist Transdisziplinarität ein entscheidender Ansatz im Kontext von Planetary Health?',
            optionA: 'Um die Forschungskosten zu senken.',
            optionB: 'Um die Komplexität der Zusammenhänge zwischen menschlicher Gesundheit und planetaren Systemen aus verschiedenen Perspektiven zu verstehen und Lösungen zu entwickeln.',
            optionC: 'Um die Spezialisierung in einzelnen wissenschaftlichen Disziplinen zu fördern.',
            optionD: 'Um ausschließlich naturwissenschaftliche Daten zu erheben.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9917400/',
            authorId: adminUser.id,
        },
        {
            text: 'Welches ist ein Beispiel für die Auswirkungen des Biodiversitätsverlustes auf die menschliche Gesundheit, wie im Kontext von Planetary Health diskutiert?',
            optionA: 'Verbesserung der Luftqualität in Städten.',
            optionB: 'Erhöhtes Risiko für das Auftreten von Epidemien.',
            optionC: 'Geringere Anfälligkeit für Allergien.',
            optionD: 'Stabilere Nahrungsmittelproduktion weltweit.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.who.int/news-room/fact-sheets/detail/biodiversity-and-health',
            authorId: adminUser.id,
        },
        {
            text: 'Was ist die Hauptursache für die Versauerung der Ozeane?',
            optionA: 'Ölverschmutzung durch Tankerunfälle.',
            optionB: 'Einleitung von Industrieabwässern.',
            optionC: 'Die Aufnahme von überschüssigem Kohlendioxid (CO₂) aus der Atmosphäre.',
            optionD: 'Erwärmung der Ozeane durch den Klimawandel.',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-acidification',
            authorId: adminUser.id,
        },
        {
            text: 'Welcher Sektor ist laut IPCC einer der Hauptverursacher von Methan (CH₄)-Emissionen, einem potenten Treibhausgas?',
            optionA: 'Verkehrssektor',
            optionB: 'Industrielle Produktion',
            optionC: 'Landwirtschaft (insbesondere Viehzucht und Reisanbau)',
            optionD: 'Energieerzeugung aus fossilen Brennstoffen',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-7/',
            authorId: adminUser.id,
        },
        {
            text: 'Was versteht man unter "Klimagerechtigkeit"?',
            optionA: 'Die Forderung, dass alle Länder gleichermaßen für die Kosten des Klimawandels aufkommen.',
            optionB: 'Ein Rechtsansatz, um Unternehmen für Emissionsverursachung zu verklagen.',
            optionC: 'Die Anerkennung, dass die Auswirkungen des Klimawandels und die Verantwortung dafür ungleich verteilt sind, und die Notwendigkeit fairer Lösungen, die besonders vulnerable Gruppen berücksichtigen.',
            optionD: 'Ein Programm zur Förderung von grünen Technologien in Entwicklungsländern.',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.un.org/sustainabledevelopment/blog/2019/05/climate-justice/',
            authorId: adminUser.id,
        },
        {
            text: 'Wie wirkt sich der Klimawandel laut Berichten der WHO auf die Wasser- und Ernährungssicherheit aus?',
            optionA: 'Er führt zu einer gleichmäßigeren Verteilung der Wasserressourcen weltweit.',
            optionB: 'Er hat keine signifikanten Auswirkungen auf die Landwirtschaft.',
            optionC: 'Er verschärft Wasserknappheit in vielen Regionen und bedroht die Nahrungsmittelproduktion durch Dürren, Überschwemmungen und veränderte Anbaubedingungen.',
            optionD: 'Er verbessert die Ernteerträge in den meisten Regionen durch höhere CO₂-Konzentrationen.',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health',
            authorId: adminUser.id,
        },
        {
            text: 'Was ist ein Hauptziel der "Planetary Health Diet", die von der EAT-Lancet Kommission vorgeschlagen wurde?',
            optionA: 'Maximierung des Fleischkonsums zur Proteinversorgung.',
            optionB: 'Eine Ernährung, die sowohl die menschliche Gesundheit fördert als auch innerhalb der planetaren Grenzen nachhaltig ist, mit einem Fokus auf pflanzliche Nahrungsmittel.',
            optionC: 'Förderung von ausschließlich regionalen und saisonalen Lebensmitteln, unabhängig von deren Nährwert.',
            optionD: 'Reduktion der Kalorienaufnahme für alle Bevölkerungsgruppen weltweit.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://eatforum.org/eat-lancet-commission/',
            authorId: adminUser.id,
        },
        {
            text: 'Welchen direkten Einfluss hat die Abholzung von Wäldern auf den globalen Kohlenstoffkreislauf?',
            optionA: 'Sie führt zu einer erhöhten Aufnahme von CO₂ aus der Atmosphäre.',
            optionB: 'Sie hat keinen nennenswerten Einfluss auf den Kohlenstoffkreislauf.',
            optionC: 'Sie setzt das in den Bäumen und im Boden gespeicherte CO₂ frei und verringert die Fähigkeit der Erde, CO₂ aufzunehmen.',
            optionD: 'Sie führt primär zu einer Zunahme der lokalen Niederschläge.',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://rainforests.mongabay.com/09-carbon-cycle.html',
            authorId: adminUser.id,
        },
        {
            text: 'Was ist ein Beispiel für eine "Feedback-Schleife" im Klimasystem?',
            optionA: 'Die Zunahme von Solarenergieanlagen, die zu weniger CO₂-Emissionen führt.',
            optionB: 'Das Schmelzen von arktischem Meereis, wodurch dunkleres Ozeanwasser mehr Sonnenlicht absorbiert und die Erwärmung verstärkt wird.',
            optionC: 'Internationale Klimaverhandlungen, die zu Emissionsreduktionen führen.',
            optionD: 'Die Entwicklung dürreresistenter Pflanzensorten.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://climate.nasa.gov/nasa_science/science/',
            authorId: adminUser.id,
        },
        {
            text: 'Wie trägt Plastikverschmutzung zur Gefährdung der planetaren Gesundheit bei, über die direkte Schädigung von Meerestieren hinaus?',
            optionA: 'Plastik gibt bei seiner Zersetzung Nährstoffe an den Boden ab.',
            optionB: 'Mikroplastik kann in die Nahrungskette gelangen und potenziell gesundheitsschädliche Chemikalien transportieren; zudem werden bei der Herstellung und Entsorgung von Plastik Treibhausgase freigesetzt.',
            optionC: 'Plastik erhöht die Albedo der Erdoberfläche und wirkt so der Erwärmung entgegen.',
            optionD: 'Plastikverschmutzung hat keine über die Ästhetik hinausgehenden Auswirkungen auf die planetare Gesundheit.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.unep.org/plastic-pollution',
            authorId: adminUser.id,
        },
        {
            text: 'Welche Rolle spielen Korallenriffe für die marine Biodiversität und den Küstenschutz, und wie werden sie durch den Klimawandel bedroht?',
            optionA: 'Sie sind primär touristische Attraktionen ohne ökologische Bedeutung; der Klimawandel fördert ihr Wachstum.',
            optionB: 'Sie bieten Lebensraum für etwa ein Viertel aller Meereslebewesen und schützen Küsten vor Erosion; steigende Wassertemperaturen und Ozeanversauerung führen zur Korallenbleiche und zum Absterben.',
            optionC: 'Sie sind hauptsächlich für die Produktion von Sauerstoff im Meer verantwortlich; der Klimawandel hat kaum Auswirkungen auf sie.',
            optionD: 'Sie dienen als Nahrungsquelle für große Meeressäuger; der Klimawandel führt zu einer Vergrößerung ihrer Verbreitungsgebiete.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.noaa.gov/education/resource-collections/marine-life/coral-reef-ecosystems',
            authorId: adminUser.id,
        },
        {
            text: 'Wie beeinflusst die Urbanisierung die lokale Umwelt und das Klima?',
            optionA: 'Urbanisierung führt generell zu einer Verbesserung der Luftqualität und einer Abnahme der lokalen Temperaturen.',
            optionB: 'Städte haben keinen signifikanten Einfluss auf ihre lokale Umwelt oder das Klima.',
            optionC: 'Urbanisierung kann zu erhöhten lokalen Temperaturen (städtische Wärmeinseln), veränderter Luftzirkulation, erhöhter Luftverschmutzung und veränderten Niederschlagsmustern führen.',
            optionD: 'Urbanisierung führt zu einer Zunahme der biologischen Vielfalt in städtischen Gebieten.',
            correctOption: 'C',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-10/',
            authorId: adminUser.id,
        },
        {
            text: 'Welche gesundheitlichen Risiken sind laut WHO mit der Exposition gegenüber Luftverschmutzung durch Feinstaub (PM2.5) verbunden?',
            optionA: 'Hauptsächlich Hautreizungen und leichte Allergien.',
            optionB: 'Erhöhtes Risiko für Herz-Kreislauf-Erkrankungen, Atemwegserkrankungen (wie Asthma und COPD), Lungenkrebs und negative Auswirkungen auf die Schwangerschaft.',
            optionC: 'Ausschließlich psychische Erkrankungen wie Depressionen.',
            optionD: 'Keine signifikanten Gesundheitsrisiken bei kurzfristiger Exposition.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
            authorId: adminUser.id,
        },
        {
            text: 'Wie kann die Kreislaufwirtschaft (Circular Economy) zur Reduzierung von Umweltbelastungen und Treibhausgasemissionen beitragen?',
            optionA: 'Durch die Maximierung des Verbrauchs von Einwegprodukten.',
            optionB: 'Indem Produkte und Materialien so lange wie möglich in Gebrauch gehalten, wiederverwendet, repariert und recycelt werden, wodurch der Bedarf an neuen Rohstoffen, der Energieverbrauch und die Abfallmenge reduziert werden.',
            optionC: 'Durch die ausschließliche Konzentration auf die Abfallverbrennung zur Energiegewinnung.',
            optionD: 'Indem der internationale Handel mit Rohstoffen intensiviert wird.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://www.europarl.europa.eu/news/en/headlines/economy/20151201STO05603/circular-economy-definition-importance-and-benefits',
            authorId: adminUser.id,
        },
        {
            text: 'Was ist eine der Hauptfunktionen von Mangrovenwäldern im Kontext von Klimawandelanpassung und -minderung?',
            optionA: 'Sie sind eine Hauptquelle für die globale Holzproduktion.',
            optionB: 'Sie bieten effektiven Küstenschutz vor Stürmen und Meeresspiegelanstieg, speichern große Mengen an Kohlenstoff (Blue Carbon) und sind wichtige Habitate für die Biodiversität.',
            optionC: 'Sie tragen zur Versauerung der Küstengewässer bei.',
            optionD: 'Sie sind primär für die Süßwassergewinnung in Küstenregionen von Bedeutung.',
            correctOption: 'B',
            difficulty: 'MEDIUM',
            category: 'Planetary Health',
            source: 'https://ocean.si.edu/ocean-life/plants-algae/mangroves',
            authorId: adminUser.id,
        },

        // SCHWERE FRAGEN
        {
            text: 'Welche Rolle spielt Permafrost im Klimasystem und was passiert bei dessen Auftauen?',
            optionA: 'Permafrost speichert große Mengen an Wasser, dessen Freisetzung den Meeresspiegel ansteigen lässt.',
            optionB: 'Auftauender Permafrost hat keine signifikanten Auswirkungen auf das Klima.',
            optionC: 'Permafrostböden speichern riesige Mengen an organischem Kohlenstoff; beim Auftauen wird dieser durch Mikroben zersetzt und als CO₂ und Methan in die Atmosphäre freigesetzt, was die Erwärmung weiter verstärkt.',
            optionD: 'Permafrost reflektiert Sonnenlicht und kühlt die Arktis; sein Verschwinden führt zu geringerer Absorption von Sonnenenergie.',
            correctOption: 'C',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/',
            authorId: adminUser.id,
        },
        {
            text: 'Welcher Mechanismus erklärt, warum das Abschmelzen des Grönländischen Eisschildes nicht nur zum globalen Meeresspiegelanstieg beiträgt, sondern auch die Atlantische Meridionale Umwälzzirkulation (AMOC) beeinflussen und regionale Klimamuster verändern kann?',
            optionA: 'Das Schmelzwasser erhöht den Salzgehalt des Nordatlantiks und beschleunigt die AMOC.',
            optionB: 'Das zusätzliche Gewicht des Schmelzwassers drückt die Erdkruste nach unten.',
            optionC: 'Der Eintrag großer Mengen kalten Süßwassers in den Nordatlantik verringert Dichte und Salzgehalt des Oberflächenwassers, was die Tiefenwasserbildung und damit die AMOC abschwächen kann.',
            optionD: 'Das Schmelzwasser führt zu einer verstärkten Algenblüte, die der Atmosphäre CO₂ entzieht und die AMOC indirekt stärkt.',
            correctOption: 'C',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.ipcc.ch/srocc/',
            authorId: adminUser.id,
        },
        {
            text: 'Was versteht man unter dem "Kohlenstoffbudget" im Kontext der Klimaziele, und welche Unsicherheiten sind damit verbunden?',
            optionA: 'Die Menge an Kohlenstoff, die jährlich durch Aufforstung gebunden werden kann; Unsicherheiten betreffen die Wachstumsraten der Bäume.',
            optionB: 'Die geschätzte Gesamtmenge an CO₂, die noch in die Atmosphäre emittiert werden darf, um eine bestimmte globale Erwärmungsgrenze (z.B. 1,5°C) mit einer gewissen Wahrscheinlichkeit nicht zu überschreiten; Unsicherheiten ergeben sich aus der Klimasensitivität, Rückkopplungen und der Reaktion von Nicht-CO₂-Faktoren.',
            optionC: 'Das jährliche Budget, das Regierungen für Klimaschutzmaßnahmen bereitstellen; Unsicherheiten betreffen die wirtschaftliche Entwicklung.',
            optionD: 'Die Menge an Kohlenstoff, die in fossilen Brennstoffreserven noch vorhanden ist; Unsicherheiten betreffen die Genauigkeit der Reservenschätzungen.',
            correctOption: 'B',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.ipcc.ch/sr15/chapter/chapter-2/',
            authorId: adminUser.id,
        },
        {
            text: 'Wie unterscheidet sich der "Strahlungsantrieb" (Radiative Forcing) von verschiedenen Treibhausgasen und Aerosolen, und warum ist dies für das Verständnis des Klimawandels wichtig?',
            optionA: 'Alle Treibhausgase haben den gleichen Strahlungsantrieb; Aerosole spielen keine Rolle.',
            optionB: 'Der Strahlungsantrieb misst die Fähigkeit eines Gases, Infrarotstrahlung zu absorbieren, ist aber für alle Gase gleich stark. Aerosole erhöhen immer den Strahlungsantrieb.',
            optionC: 'Der Strahlungsantrieb ist ein Maß für die Veränderung der Energiebilanz der Erde durch einen externen Faktor. Verschiedene Gase (z.B. CO₂, CH₄, N₂O) haben unterschiedliche Strahlungsantriebe und Verweilzeiten in der Atmosphäre. Aerosole können sowohl einen positiven (erwärmenden) als auch einen negativen (kühlenden) Strahlungsantrieb haben, was die Gesamtbilanz komplex macht.',
            optionD: 'Der Strahlungsantrieb bezieht sich nur auf die Wirkung der Sonnenaktivität auf das Klima; Treibhausgase und Aerosole sind davon unabhängig.',
            correctOption: 'C',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
            authorId: adminUser.id,
        },
        {
            text: 'Erklären Sie das Konzept der "Klima-Kipppunkte" (Climate Tipping Points) und nennen Sie zwei Beispiele mit potenziell weitreichenden und schwer umkehrbaren Folgen.',
            optionA: 'Punkte, an denen das Klima kurzfristig stabiler wird; Beispiele sind erhöhte Wolkenbildung und Wüstenbegrünung.',
            optionB: 'Schwellenwerte im Erdsystem, bei deren Überschreitung eine kleine Änderung zu einer großen, oft unumkehrbaren qualitativen Veränderung im System führt. Beispiele sind das Abschmelzen des Grönländischen Eisschildes, das Absterben des Amazonas-Regenwaldes oder die Störung der Thermohalinen Zirkulation.',
            optionC: 'Politische Entscheidungen, die zu einer drastischen Reduktion von Emissionen führen; Beispiele sind das Pariser Abkommen und nationale Klimagesetze.',
            optionD: 'Die maximale Temperatur, die ein Ökosystem tolerieren kann, bevor einzelne Arten aussterben; Beispiele sind das Aussterben von Polarbären und Pinguinen.',
            correctOption: 'B',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-1/#1.4.6',
            authorId: adminUser.id,
        },
        {
            text: 'Welche Rolle spielt die Stickstoffkaskade (Nitrogen Cascade) für Umweltprobleme, die über den Klimawandel hinausgehen, und wie ist sie mit menschlichen Aktivitäten verbunden?',
            optionA: 'Die Stickstoffkaskade beschreibt den natürlichen Abbau von Stickstoff in der Atmosphäre, der die Luftqualität verbessert.',
            optionB: 'Menschliche Aktivitäten, insbesondere die Herstellung von synthetischem Dünger (Haber-Bosch-Verfahren) und die Verbrennung fossiler Brennstoffe, haben die Menge an reaktivem Stickstoff in der Umwelt drastisch erhöht. Dieser überschüssige Stickstoff bewegt sich durch verschiedene Ökosysteme (Atmosphäre, terrestrische Systeme, aquatische Systeme) und verursacht eine Kaskade von negativen Effekten, darunter Luftverschmutzung (Smog, Feinstaub), Wasserverschmutzung (Eutrophierung, Nitrat im Grundwasser), Verlust der Biodiversität und Beitrag zur Ozonlochbildung sowie indirekt zum Klimawandel (Lachgasemissionen).',
            optionC: 'Die Stickstoffkaskade ist ein Prozess, bei dem Stickstoff aus der Atmosphäre entfernt und sicher im Boden gespeichert wird, was die Bodenfruchtbarkeit erhöht.',
            optionD: 'Die Stickstoffkaskade bezieht sich auf die Freisetzung von Stickstoff bei Vulkanausbrüchen und deren Auswirkungen auf das globale Klima.',
            correctOption: 'B',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.epa.gov/nutrientpollution/problem',
            authorId: adminUser.id,
        },
        {
            text: 'Was sind die potenziellen Risiken und ethischen Implikationen von großskaligen Geoengineering-Technologien zur Bekämpfung des Klimawandels, wie z.B. Solar Radiation Management (SRM)?',
            optionA: 'SRM-Technologien sind risikofrei und bieten eine schnelle Lösung für den Klimawandel ohne ethische Bedenken.',
            optionB: 'Die Hauptrisiken sind hohe Kosten und geringe Effektivität; ethische Implikationen gibt es kaum.',
            optionC: 'Potenzielle Risiken umfassen unvorhersehbare Auswirkungen auf regionale Klimamuster (z.B. Niederschläge), Ozeanversauerung wird nicht adressiert, das Risiko eines "Termination Shock" (schnelle Erwärmung bei Abbruch der Maßnahmen), sowie Governance-Herausforderungen (wer entscheidet über den Einsatz?). Ethische Implikationen betreffen Gerechtigkeitsfragen (ungleiche Verteilung von Risiken und Nutzen), die potenzielle Ablenkung von Emissionsreduktionen und die Frage der Verantwortung gegenüber zukünftigen Generationen.',
            optionD: 'SRM-Technologien führen zu einer verstärkten Aufnahme von CO₂ durch die Ozeane und lösen damit das Problem der Ozeanversauerung.',
            correctOption: 'C',
            difficulty: 'HARD',
            category: 'Planetary Health',
            source: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-14/',
            authorId: adminUser.id,
        },
    ];

    // Füge die neuen Fragen hinzu
    for (const q of questionsData) {
        await prisma.question.create({
            data: q as any,
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