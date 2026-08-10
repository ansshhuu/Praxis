const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx', 'tesseract.js'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
