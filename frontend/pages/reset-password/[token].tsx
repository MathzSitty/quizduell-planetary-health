// frontend/pages/reset-password/[token].tsx
import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { KeyRound, Check, AlertTriangle } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Überprüfung der Passwortvalidität
  const validatePassword = () => {
    if (password.length < 8) {
      return 'Das Passwort muss mindestens 8 Zeichen lang sein.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Das Passwort muss mindestens einen Großbuchstaben enthalten.';
    }
    if (!/[a-z]/.test(password)) {
      return 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten.';
    }
    if (!/\d/.test(password)) {
      return 'Das Passwort muss mindestens eine Zahl enthalten.';
    }
    if (password !== confirmPassword) {
      return 'Die Passwörter stimmen nicht überein.';
    }
    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword
      });
      setIsSuccess(true);
      toast.success('Passwort erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.');
      // Nach 3 Sekunden zur Login-Seite weiterleiten
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Falls kein Token vorhanden ist
  if (router.isReady && !token) {
    return (
      <div className="min-h-[calc(100vh-15rem)] flex items-center justify-center">
        <div className="card max-w-md w-full p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-textPrimary mb-2">Ungültiger Link</h2>
          <p className="text-textSecondary mb-6">
            Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
          </p>
          <Link href="/forgot-password" className="text-primary hover:text-primary-dark">
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Passwort zurücksetzen | Planetary Health Quiz</title>
      </Head>
      <div className="min-h-[calc(100vh-15rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 card">
          {!isSuccess ? (
            <>
              <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-textPrimary">
                  Neues Passwort festlegen
                </h2>
                <p className="mt-2 text-center text-sm text-textSecondary">
                  Bitte geben Sie Ihr neues Passwort ein.
                </p>
              </div>
              
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                  {error}
                </div>
              )}
              
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="password" className="form-label">Neues Passwort</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="form-input"
                    placeholder="Sicheres Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-textSecondary mt-1">
                    Mindestens 8 Zeichen mit Großbuchstaben, Kleinbuchstaben und Zahlen.
                  </p>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="form-label">Passwort bestätigen</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="form-input"
                    placeholder="Passwort wiederholen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    leftIcon={<KeyRound size={18} />}
                  >
                    Passwort zurücksetzen
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-green-500 mb-4">
                <Check className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Passwort zurückgesetzt</h3>
              <p className="text-textSecondary mb-6">
                Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden in wenigen Sekunden zur
                Anmeldeseite weitergeleitet.
              </p>
              <Link href="/login" className="text-primary hover:text-primary-dark transition-colors">
                Sofort zur Anmeldeseite
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}