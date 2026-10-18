/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  staticPageGenerationTimeout: 10,
  typescript: { ignoreBuildErrors: true },
  devIndicators: false,
};
export default nextConfig;
