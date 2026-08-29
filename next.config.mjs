const nextConfig = {
  // Vercel's builder expects its own default output layout, not the
  // standalone server bundle self-hosted platforms (Render, Docker) need.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx', 'tesseract.js', 'chromadb'],
  // tesseract.js spawns a worker_threads worker whose script does a runtime-relative
  // require('..'); Next's file tracer can't follow that, so it drops files from the
  // standalone output and OCR routes crash with "Cannot find module '..'" in production.
  // Forcing the whole package into the trace for every route that can trigger OCR fixes it.
  outputFileTracingIncludes: {
    '/api/documents/[id]/process': ['./node_modules/tesseract.js/**/*'],
    '/api/resumes/screen': ['./node_modules/tesseract.js/**/*'],
    '/api/vision/analyze': ['./node_modules/tesseract.js/**/*'],
    '/api/vision/ocr': ['./node_modules/tesseract.js/**/*'],
  },
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
