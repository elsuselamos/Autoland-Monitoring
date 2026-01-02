/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Optimize output
  output: 'standalone',
  swcMinify: true,

  // Optimize compilation
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize fonts
  optimizeFonts: true,

  // Performance: Preconnect to external domains
  asyncHeaders: async () => {
    return [
      {
        source: '/fonts.googleapis.com',
        headers: [
          {
            key: 'preconnect',
            value: '1',
          },
        ],
      },
    ]
  },

  // Performance: Compress responses
  compress: true,

  // Performance: Enable experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Performance: Bundle analyzer (optional - uncomment to analyze)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
  //     config.plugins.push(new BundleAnalyzerPlugin({
  //       analyzerMode: 'static',
  //       reportFilename: '../analyze/client.html',
  //     }))
  //   }
  //   return config
  // },

  // Performance: Reduce build output size
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    }

    return config
  },

  // Security: Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig


