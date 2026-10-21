/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  staticPageGenerationTimeout: 10,
  typescript: { ignoreBuildErrors: true },
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: ['localhost', '192.168.0.109', '192.168.1.133', '192.168.0.100'],
};
export default nextConfig;
