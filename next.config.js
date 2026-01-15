/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['swisseph'],
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;