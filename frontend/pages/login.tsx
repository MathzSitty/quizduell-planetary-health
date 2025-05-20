// frontend/pages/login.tsx
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/'); // Wenn bereits eingeloggt, zur Startseite
        }
    }, [user, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            // Hier könnte man spezifischere Fehler pro Feld anzeigen
            alert('Bitte E-Mail und Passwort eingeben.');
            return;
        }
        await login(email, password);
        // Weiterleitung erfolgt im AuthContext bei Erfolg
    };

    if (user) return null; // Verhindert kurzes Aufblitzen der Login-Seite

    return (
        <>
            <Head>
                <title>Login - QuizDuell</title>
            </Head>
            <div className="min-h-[calc(100vh-15rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 card">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-textPrimary">
                            Anmelden
                        </h2>
                        <p className="mt-2 text-center text-sm text-textSecondary">
                            Oder{' '}
                            <Link href="/register" className="font-medium text-primary hover:text-primary-dark">
                                erstelle einen neuen Account
                            </Link>
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <Input
                            id="email"
                            label="E-Mail Adresse"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="max@beispiel.de"
                        />
                        <Input
                            id="password"
                            label="Passwort"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ihr Passwort"
                        />
                        
                        {/* Passwort vergessen Link */}
                        <div className="flex items-center justify-between mt-2">
                            <div className="text-sm">
                                <Link href="/forgot-password" className="text-primary hover:text-primary-dark">
                                    Passwort vergessen?
                                </Link>
                            </div>
                        </div>
                        
                        <div>
                            <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading} leftIcon={<LogIn size={18} />}>
                                Login
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}