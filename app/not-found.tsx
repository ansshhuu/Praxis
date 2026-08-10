import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#FAF8F5] px-6 text-center">
      <p className="text-[13px] font-bold tracking-[0.14em] text-[#D4A017] uppercase">404</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-3 max-w-md text-[15px] text-neutral-600">
        The link may be out of date, or the page may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-125"
        >
          Back to Praxis
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-[#FACC15] hover:bg-[#FFFAEC] hover:text-[#D4A017]"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  )
}
