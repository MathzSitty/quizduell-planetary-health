/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#b85c38', // Warmes Rostrot
                    dark: '#9c4222', // Dunkleres Rostrot
                },
                secondary: {
                    DEFAULT: '#d4a373', // Goldgelb
                    dark: '#c68b59', // Dunkleres Goldgelb
                },
                accent: {
                    DEFAULT: '#e26d5c', // Kürbis-Orange
                    dark: '#c14f3d', // Dunkleres Orange
                },
                neutral: {
                    light: '#f2efe9', // Helles Creme
                    DEFAULT: '#ddbea9', // Mittleres Beige
                    dark: '#a98467', // Braun
                },
                background: '#faf6f1', // Warmer cremefarbener Hintergrund
                surface: '#ffffff', // Weiß für Karten
                textPrimary: '#594a3c', // Dunkelbraun für Text
                textSecondary: '#6b5e50', // Mittleres Braun für Sekundärtext
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                pulseOnce: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                }
            },
            animation: {
                fadeIn: 'fadeIn 0.5s ease-out',
                pulseOnce: 'pulseOnce 0.5s ease-in-out',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
};