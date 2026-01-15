/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['swisseph'],
    workerThreads: false,
    cpus: 1
  },
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;