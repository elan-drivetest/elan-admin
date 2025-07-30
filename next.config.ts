import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dev-static-files-elan-car-app.s3.ca-central-1.amazonaws.com',
        port: '',
        pathname: '/files/**',
      },
      // Add production S3 bucket if different
      {
        protocol: 'https',
        hostname: 'static-files-elan-car-app.s3.ca-central-1.amazonaws.com',
        port: '',
        pathname: '/files/**',
      },
      // You can also allow all S3 subdomains if needed
      {
        protocol: 'https',
        hostname: '*.s3.ca-central-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // FIX: Add the new hostname from the error message
      {
        protocol: 'https',
        hostname: 'www.chnspart.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Your other config options...
};

export default nextConfig;