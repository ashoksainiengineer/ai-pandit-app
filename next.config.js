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
  async rewrites() {
    return [
      {
        source: '/api/stream/:path*',
        destination: 'http://localhost:8080/api/stream/:path*',
      },
      {
        source: '/api/queue/:path*',
        destination: 'http://localhost:8080/api/queue/:path*',
      },
      {
        source: '/api/health/backend',
        destination: 'http://localhost:8080/api/health',
      }
    ];
  },
};

module.exports = nextConfig;