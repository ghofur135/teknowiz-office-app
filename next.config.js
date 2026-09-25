const path = require('path');
const pkg = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
