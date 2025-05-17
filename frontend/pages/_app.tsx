// frontend/pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import Layout from '../components/layout/Layout'; // Pfad anpassen, falls Layout woanders ist

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <AuthProvider>
            <SocketProvider>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </SocketProvider>
        </AuthProvider>
    );
}
export default MyApp;