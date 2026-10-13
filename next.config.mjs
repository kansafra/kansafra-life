/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  staticPageGenerationTimeout: 3,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
