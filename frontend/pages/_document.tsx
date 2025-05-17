// frontend/pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="de">
            <Head>
                {/* Hier können globale Meta-Tags, Font-Links etc. platziert werden */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <meta name="description" content="Ein Quizduell zu Planetary Health Themen." />
                <link rel="icon" href="/favicon.ico" /> {/* Stelle sicher, dass du ein Favicon hast */}
            </Head>
            <body>
            <Main />
            <NextScript />
            </body>
        </Html>
    );
}