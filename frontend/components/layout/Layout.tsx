// frontend/components/layout/Layout.tsx
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast'; // Für Benachrichtigungen

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            <footer className="bg-textPrimary text-neutral-light py-6 text-center">
                <p>© {new Date().getFullYear()} Planetary Health QuizDuell. Ein Hochschulprojekt.</p>
            </footer>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 5000,
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                }}
            />
        </div>
    );
};

export default Layout;