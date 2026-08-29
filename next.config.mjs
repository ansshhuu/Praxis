// next-auth/react reads NEXTAUTH_URL at import time via `url ?? defaultUrl`,
// which does not catch an empty string - an empty NEXTAUTH_URL crashes
// `new URL('')` during static prerendering (e.g. /_not-found) before any
// page code runs. Force a non-empty fallback so that can't happen.
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
}

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
