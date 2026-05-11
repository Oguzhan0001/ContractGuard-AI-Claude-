/** @type {import('next').NextConfig} */
const nextConfig = {
  // PDF parse için server-side only
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

module.exports = nextConfig;
