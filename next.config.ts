import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  images: {
    remotePatterns: [new URL('https://storage.googleapis.com/**')],
    unoptimized: true
  }
}

export default nextConfig
