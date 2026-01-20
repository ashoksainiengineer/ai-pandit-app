/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['swisseph'],
    workerThreads: false,
    webpackBuildWorker: false,
    cpus: 1
  },
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;