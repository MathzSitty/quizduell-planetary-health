// frontend/pages/register.tsx
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [uniHandle, setUniHandle] = useState('');
    const [error, setError] = useState('');

    const { register, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !email || !password || !confirmPassword) {
            setError('Bitte alle Pflichtfelder ausfüllen.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }
        if (password.length < 6) {
            setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
            return;
        }
        await register(name, email, password, uniHandle);
        // Weiterleitung erfolgt im AuthContext
    };

    if (user) return null;

    return (
        <>
            <Head>
                <title>Registrieren - QuizDuell</title>
            </Head>
            <div className="min-h-[calc(100vh-15rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 card">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-textPrimary">
                            Neuen Account erstellen
                        </h2>
                        <p className="mt-2 text-center text-sm text-textSecondary">
                            Oder{' '}
                            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                                melde dich an, wenn du schon einen Account hast
                            </Link>
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                        <Input
                            id="name"
                            label="Name"
                            type="text"
                            autoComplete="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Max Mustermensch"
                        />
                        <Input
                            id="email-register" // Eindeutige ID, falls Login-Email auf gleicher Seite wäre
                            label="E-Mail Adresse"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="max@beispiel.de"
                        />
                        <Input
                            id="uniHandle"
                            label="Uni-Kürzel (optional)"
                            type="text"
                            value={uniHandle}
                            onChange={(e) => setUniHandle(e.target.value)}
                            placeholder="z.B. TUM, LMU"
                        />
                        <Input
                            id="password-register"
                            label="Passwort"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mind. 6 Zeichen"
                        />
                        <Input
                            id="confirm-password"
                            label="Passwort bestätigen"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Passwort wiederholen"
                        />
                        <div>
                            <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading} leftIcon={<UserPlus size={18} />}>
                                Registrieren
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}