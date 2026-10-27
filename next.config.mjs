import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,

  experimental: {
    agentUpgrade: 'security',
  },

  // Trailing slash ensures iOS Safari & PWA deep links resolve correctly
  trailingSlash: false,

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      'react-router-dom': path.resolve(__dirname, 'src/lib/router-compat.jsx'),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      'react-router-dom': './src/lib/router-compat.jsx',
    },
  },

  // Expose Render AI service URL to server-side API routes
  env: {
    AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
  },

  headers: async () => [
    {
      // Security & client-hint headers for all routes
      source: '/(.*)',
      headers: [
        {
          key: 'Accept-CH',
          value: 'Sec-CH-UA-Model, Sec-CH-UA-Platform, Save-Data, Downlink, ECT, RTT',
        },
        {
          // Required for iOS PWA / Add to Home Screen full-screen mode
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
    {
      // Service worker must not be cached
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
        {
          key: 'Content-Type',
          value: 'application/javascript; charset=utf-8',
        },
      ],
    },
    {
      // Allow AI service (Render) to be called cross-origin from API routes
      source: '/api/(.*)',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization',
        },
      ],
    },
  ],
};

export default nextConfig;
