"use client";

import Link from "next/link";

// Shared placeholder for legal documents that are drafted but not yet published.
// Used by /terms and /data-policy so the signup consent links resolve to a
// real page instead of a 404 while the final copy is being finalised.
export default function LegalComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0d1117] px-4 py-16 text-center">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#161b22] px-8 py-12">
        <span className="inline-block rounded-full border border-[#f97316]/30 bg-[#f97316]/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#f97316]">
          Coming soon
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-400">
          We&apos;re putting the finishing touches on this document. It will be
          available here shortly. If you have any questions in the meantime,
          please reach out to our support team.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/Auth/signup"
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-gray-300 transition hover:bg-white/5"
          >
            Back to sign up
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-[#f97316] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#ea6a0c]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
