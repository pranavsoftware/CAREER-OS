import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
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
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Accept-CH',
          value: 'Sec-CH-UA-Model, Sec-CH-UA-Platform, Save-Data, Downlink, ECT, RTT',
        },
      ],
    },
    {
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
  ],
};

export default nextConfig;
