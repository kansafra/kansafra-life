/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  staticPageGenerationTimeout: 10,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },  // ← الإضافة الجديدة
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
};
export default nextConfig;
