/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出（GitHub Pages / Vercel / 任意静态托管）
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
