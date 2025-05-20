// frontend/pages/forgot-password.tsx
import { FormEvent, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import apiClient from '../lib/apiClient';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      toast.success('Falls ein Account mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.');
    } catch (error) {
      // Die Fehlermeldung wird vom API-Client-Interceptor angezeigt
      console.error('Fehler bei Passwort-Reset-Anfrage:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Passwort vergessen | Planetary Health Quiz</title>
      </Head>
      <div className="min-h-[calc(100vh-15rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 card">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-textPrimary">
              Passwort vergessen?
            </h2>
            <p className="mt-2 text-center text-sm text-textSecondary">
              Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres Passworts zu erhalten.
            </p>
          </div>
          
          {!isSubmitted ? (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="form-label">E-Mail-Adresse</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  placeholder="max@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  leftIcon={<Mail size={18} />}
                >
                  Link senden
                </Button>
              </div>
              <div className="text-center mt-4">
                <Link href="/login" className="text-primary hover:text-primary-dark transition-colors">
                  Zurück zum Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="text-green-500 mb-4">
                <Mail className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">E-Mail gesendet</h3>
              <p className="text-textSecondary mb-6">
                Falls ein Account mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen des Passworts gesendet.
                Bitte prüfen Sie Ihr E-Mail-Postfach und folgen Sie den Anweisungen.
              </p>
              <Link href="/login" className="text-primary hover:text-primary-dark transition-colors">
                Zurück zum Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}