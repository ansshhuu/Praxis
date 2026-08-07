/** @type {import('next').NextConfig} */
const nextConfig = {
  // Document extraction libraries are Node-only and load their own assets at
  // runtime (worker scripts, OCR language data) — bundling them breaks that.
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx', 'tesseract.js'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
