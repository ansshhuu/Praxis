const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx', 'tesseract.js', 'chromadb'],
  async redirects() {
    return [
      { source: '/resumes', destination: '/hr', permanent: true },
      { source: '/resumes/:path*', destination: '/hr', permanent: true },
      { source: '/documents/resumes', destination: '/hr', permanent: true },
      { source: '/documents/resumes/:path*', destination: '/hr', permanent: true },
      { source: '/documents/screening', destination: '/hr', permanent: true },
      { source: '/documents/screening/:path*', destination: '/hr', permanent: true },
    ]
  },
}

export default nextConfig
