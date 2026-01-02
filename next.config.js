/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config) => {
    // Fix for pdfjs-dist in Next.js
    config.resolve.alias.canvas = false

    return config
  },
}

module.exports = nextConfig

