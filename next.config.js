/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['firebase/auth', 'firebase/firestore', 'firebase/analytics']
  },
  output: undefined, // Remove static export to allow SSR
};

module.exports = nextConfig;
