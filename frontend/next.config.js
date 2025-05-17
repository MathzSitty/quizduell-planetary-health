/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone', // Für Docker-Optimierung
};

module.exports = nextConfig;