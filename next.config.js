/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    unoptimized: true,
  },
  
  // Moved from experimental to root level (Next.js 15+)
  serverExternalPackages: ['swisseph'],
  
  experimental: {
    cpus: 1
  },
  
  productionBrowserSourceMaps: false,
  
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
