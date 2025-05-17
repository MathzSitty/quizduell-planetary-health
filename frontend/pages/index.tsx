// frontend/pages/index.tsx
import Head from 'next/head';
import Link from 'next/link';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, Trophy, Info } from 'lucide-react';

export default function HomePage() {
    const { user } = useAuth();

    return (
        <>
            <Head>
                <title>Planetary Health QuizDuell</title>
            </Head>
            <div className="text-center py-10">
                <header className="mb-12">
                    <h1 className="text-5xl font-bold text-primary mb-4 animate-fadeIn">
                        Planetary Health QuizDuell
                    </h1>
                    <p className="text-xl text-textSecondary max-w-2xl mx-auto">
                        Teste dein Wissen über Umwelt, Gesundheit und die Zukunft unseres Planeten in spannenden Duellen!
                    </p>
                </header>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                    <div className="card hover:shadow-xl transition-shadow">
                        <Gamepad2 size={48} className="text-secondary mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold mb-2 text-textPrimary">Spielen & Lernen</h2>
                        <p className="text-textSecondary mb-4">
                            Fordere andere Spieler heraus oder spiele gegen die Zeit. Erweitere dein Wissen spielerisch.
                        </p>
                        <Link href={user ? "/game" : "/register"}>
                            <Button variant="secondary" size="lg">
                                {user ? "Neues Spiel starten" : "Jetzt Registrieren & Spielen"}
                            </Button>
                        </Link>
                    </div>
                    <div className="card hover:shadow-xl transition-shadow">
                        <Trophy size={48} className="text-accent mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold mb-2 text-textPrimary">Werde zum Champion</h2>
                        <p className="text-textSecondary mb-4">
                            Sammle Punkte, steige im Leaderboard auf und zeige, was du drauf hast!
                        </p>
                        <Link href="/leaderboard">
                            <Button variant="outline" className="border-accent text-accent hover:bg-accent/10" size="lg">
                                Zum Leaderboard
                            </Button>
                        </Link>
                    </div>
                </div>

                <section className="mt-16 p-6 bg-primary/10 rounded-lg">
                    <h2 className="text-3xl font-semibold text-primary mb-6 flex items-center justify-center">
                        <Info size={32} className="mr-3" /> Was ist Planetary Health?
                    </h2>
                    <div className="text-left max-w-3xl mx-auto space-y-4 text-textSecondary">
                        <p>
                            Planetary Health ist ein Konzept, das die untrennbare Verbindung zwischen der Gesundheit
                            des Menschen und der Gesundheit unseres Planeten Erde betont. Es erkennt an, dass
                            menschliche Aktivitäten tiefgreifende Auswirkungen auf die natürlichen Systeme haben,
                            von denen unser Wohlergehen abhängt – saubere Luft und Wasser, fruchtbare Böden,
                            ein stabiles Klima und biologische Vielfalt.
                        </p>
                        <p>
                            Dieses Quiz soll das Bewusstsein für diese Zusammenhänge schärfen und Wissen
                            zu wichtigen Themen wie Klimawandel, Biodiversitätsverlust, nachhaltige Ernährung
                            und Gesundheitssysteme vermitteln.
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
}