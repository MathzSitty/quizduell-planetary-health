// Dateipfad: d:\quizduell-planetary-health\frontend\pages\register.tsx
// frontend/pages/register.tsx
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { User } from 'lucide-react';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [uniHandle, setUniHandle] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        // Basis-Validierung
        if (!name || !email || !password || !confirmPassword) {
            setError('Bitte alle Pflichtfelder ausfüllen.');
            setIsLoading(false);
            return;
        }
        
        // Passwörter übereinstimmend?
        if (password !== confirmPassword) {
            setError('Die Passwörter stimmen nicht überein.');
            setIsLoading(false);
            return;
        }
        
        // Name/Benutzername (einfache Prüfung)
        if (name.length < 3 || name.length > 30) {
            setError('Der Name muss zwischen 3 und 30 Zeichen lang sein.');
            setIsLoading(false);
            return;
        }
        
        // Einfache Email-Validierung (zusätzlich zur HTML5-Validierung)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            setIsLoading(false);
            return;
        }
        
        // Verbesserte Passwort-Validierung
        if (password.length < 8) {
            setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
            setIsLoading(false);
            return;
        }
        
        if (!/\d/.test(password)) {
            setError('Das Passwort muss mindestens eine Zahl enthalten.');
            setIsLoading(false);
            return;
        }
        
        if (!/[A-Z]/.test(password)) {
            setError('Das Passwort muss mindestens einen Großbuchstaben enthalten.');
            setIsLoading(false);
            return;
        }
        
        if (!/[a-z]/.test(password)) {
            setError('Das Passwort muss mindestens einen Kleinbuchstaben enthalten.');
            setIsLoading(false);
            return;
        }
        
        // Wenn alle Validierungen bestanden wurden, sende die Registrierungsanfrage
        try {
            await register(name, email, password, uniHandle);
            // Weiterleitung erfolgt im AuthContext
        } catch (err: any) {
            console.error("Registration failed:", err);
            setError(err.message || 'Ein Fehler ist bei der Registrierung aufgetreten.');
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Registrierung | Planetary Health Quiz</title>
            </Head>
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
                <div className="text-center mb-6">
                    <User className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="mt-2 text-3xl font-bold">Registrierung</h1>
                    <p className="text-textSecondary">Erstellen Sie ein neues Konto</p>
                </div>

                {error && (
                    <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="form-label">Name *</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-input"
                            placeholder="Ihr Name"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="form-label">E-Mail *</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="beispiel@domain.de"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="uniHandle" className="form-label">Uni-Kennung (optional)</label>
                        <input
                            id="uniHandle"
                            type="text"
                            value={uniHandle}
                            onChange={(e) => setUniHandle(e.target.value)}
                            className="form-input"
                            placeholder="z.B. HKA"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="form-label">Passwort *</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            placeholder="Sicheres Passwort"
                            required
                        />
                        <p className="text-xs text-textSecondary mt-1">
                            Mindestens 8 Zeichen mit Großbuchstaben, Kleinbuchstaben und Zahlen.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="form-label">Passwort bestätigen *</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-input"
                            placeholder="Passwort wiederholen"
                            required
                        />
                    </div>
                    <Button 
                        type="submit"
                        className="w-full" 
                        isLoading={isLoading}
                        disabled={isLoading}>
                        Registrieren
                    </Button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-textSecondary">
                        Bereits registriert? <Link href="/login" className="text-primary hover:text-primary-dark transition-colors">Anmelden</Link>
                    </p>
                </div>
            </div>
        </>
    );
}