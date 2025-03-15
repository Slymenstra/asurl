/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle Node.js modules that are imported in client components
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace Node.js modules with empty modules when running in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        os: false,
        path: false,
        stream: require.resolve('stream-browserify'),
        http: false,
        https: false,
        zlib: false,
        child_process: false,
        dns: false,
        'fs-extra': false,
        'aws-sdk': false,
        'mongodb-client-encryption': false,
        'timers/promises': false,
        bcrypt: false,
        mongoose: false,
        mongodb: false,
      };
    }
    
    // Add rules to handle server-only modules
    config.module.rules.push({
      test: /node_modules\/bcrypt|node_modules\/mongodb|node_modules\/@auth\/mongodb-adapter/,
      use: 'null-loader',
    });
    
    return config;
  },
  
  // Set browser/server boundaries explicitly
  serverExternalPackages: [
    'bcrypt',
    'mongodb',
    'mongoose',
    '@auth/mongodb-adapter'
  ],
  
  // Enable strict mode
  reactStrictMode: true,
  
  // Configure images domain for better performance
  images: {
    domains: ['www.gravatar.com', 'lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
};

module.exports = nextConfig; 