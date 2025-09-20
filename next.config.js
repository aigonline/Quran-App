/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Image optimization
  images: {
    domains: [
      'download.quranicaudio.com',
      'server8.mp3quran.net',
      'api.alquran.cloud'
    ],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize builds
  swcMinify: true,
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_NAME: 'Quran App',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig