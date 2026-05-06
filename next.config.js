/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['firebase/auth', 'firebase/firestore', 'firebase/analytics']
  }
};

module.exports = nextConfig;
