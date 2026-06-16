"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import Image from "next/image";
import {
  ArrowRight,
  Timer,
  AlertTriangle,
  Monitor,
} from "lucide-react";

export default function FreeScanPage() {
  const { dark } = useTheme();
  const d = dark;

  return (
    <div className={`antialiased min-h-screen ${d ? "bg-[#111111] text-white" : "bg-white text-gray-900"}`}>

      {/* ── Hero ── */}
      {/* Hero fills one viewport so the "Start Quick Scan" CTA + hero image
          land in the same frame instead of below a tall empty band. */}
      <section className={`min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-8 py-8 md:py-12 ${d ? "bg-[#111111]" : "bg-gray-50"}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f97316]/20 text-[#f97316] text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-[#f97316]" />
              Free Individual Plan
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
              Awareness 1A:<br />
              The First Step to<br />
              <span className="text-[#f97316]">Clarity.</span>
            </h1>
            <p className={`text-sm leading-relaxed mb-8 max-w-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
              Experience the precision of the Clinical Architect Framework at zero cost. Designed for individual professionals seeking immediate baseline visibility into their operational health.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link href="/pages/generaltest"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold transition">
                Start Quick Scan <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Image placeholder */}
          <div className={`rounded-2xl overflow-hidden ${d ? "bg-[#1a1a1a] border border-white/10" : "bg-gray-100 border border-gray-200"}`} style={{ minHeight: "300px" }}>
            <Image
              src="/images/freescan1.png"
              alt="Hero Image"
              width={500}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Quick Scan Toolkit ── */}
      <section className={`px-4 sm:px-6 md:px-8 py-8 md:py-12 ${d ? "bg-[#1a1a1a]" : "bg-gray-100"}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${d ? "text-white" : "text-gray-900"}`}>The Quick Scan Toolkit</h2>
          <p className={`text-sm mb-10 ${d ? "text-gray-400" : "text-gray-600"}`}>Essential diagnostics for the modern architect.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* 15-Minute Express Audit card */}
            <div className={`rounded-2xl p-5 md:p-8 border ${d ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"}`}>
              <div className="w-10 h-10 rounded-xl bg-[#00ffaa]/20 flex items-center justify-center mb-6">
                <Timer className="w-5 h-5 text-[#00ffaa]" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${d ? "text-white" : "text-gray-900"}`}>15-Minute Express Audit</h3>
              <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                Our proprietary algorithmic assessment identifies core structural gaps in record time. No integration required—just pure clinical analysis.
              </p>
            </div>

            {/* Health Score metric card */}
            <div className="rounded-2xl p-5 md:p-8 bg-[#00ffaa] flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-4">Current Metric</p>
              <p className="text-4xl sm:text-5xl md:text-8xl font-extrabold text-gray-900 leading-none mb-2">84</p>
              <p className="text-xl font-bold text-gray-900 mb-3">Health Score</p>
              <p className="text-xs text-gray-700 max-w-xs">
                A singular, authoritative metric reflecting your overall alignment with the Clinical Architect Framework.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Risk Priority Matrix + Report Overview ── */}
      <section className={`px-4 sm:px-6 md:px-8 py-8 md:py-12 ${d ? "bg-[#1a1a1a]" : "bg-gray-100"}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Risk Priority Matrix */}
          <div className={`rounded-2xl p-4 md:p-6 border ${d ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-4 h-4 text-[#00ffaa]" />
              <p className="text-sm font-bold text-[#00ffaa]">Risk Priority Matrix</p>
            </div>
            <div className="space-y-3">
              {[
                { num: "01", title: "Operational Friction",  desc: "High latency in decision pipelines."              },
                { num: "02", title: "Protocol Drift",        desc: "Deviation from core architectural standards."     },
                { num: "03", title: "Resilience Deficit",    desc: "Lack of redundancy in critical workflows."        },
              ].map(({ num, title, desc }) => (
                <div key={num} className={`flex items-start gap-3 p-4 rounded-xl ${d ? "bg-[#1a1a1a]" : "bg-gray-50"}`}>
                  <span className={`text-xs font-bold ${d ? "text-gray-500" : "text-gray-400"}`}>{num}</span>
                  <div>
                    <p className={`text-sm font-semibold ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                    <p className={`text-xs ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Overview */}
          <div className={`rounded-2xl p-4 md:p-6 border ${d ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"}`}>
            <h3 className={`text-xl font-bold mb-2 ${d ? "text-white" : "text-gray-900"}`}>Report Overview</h3>
            <p className={`text-sm leading-relaxed mb-4 ${d ? "text-gray-400" : "text-gray-600"}`}>
              A distilled, executive summary delivered directly to your dashboard. Clean typography for effortless consumption.
            </p>
            {/* Progress bars */}
            <div className="flex gap-2 mb-6">
              <div className="h-1.5 w-16 rounded-full bg-[#00ffaa]" />
              <div className="h-1.5 w-8 rounded-full bg-[#00ffaa]/40" />
            </div>
            {/* Tablet image placeholder */}
            <div className={`rounded-xl overflow-hidden relative ${d ? "bg-[#1a1a1a] border border-white/10" : "bg-gray-100 border border-gray-200"}`} style={{ minHeight: "160px" }}>
              <Image
                src="/images/freescan2.png"
                alt="Tablet Image"
                width={500}
                height={160}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className={`px-4 sm:px-6 md:px-8 py-10 md:py-14 text-center ${d ? "bg-[#111111]" : "bg-white"}`}>
        <div className="max-w-2xl mx-auto">
          <h2 className={`text-2xl md:text-4xl font-extrabold mb-4 ${d ? "text-white" : "text-gray-900"}`}>
            Ready for a Clinical Appraisal?
          </h2>
          <p className={`text-sm mb-10 ${d ? "text-gray-400" : "text-gray-600"}`}>
            No credit card, no commitment. Just the data you need to understand your current operational standing.
          </p>
          <div className="flex items-center justify-center gap-6 mb-6">
            <Link href="/pages/generaltest"
              className="px-8 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition">
              Start Assessment
            </Link>
            <Link href="/pricing"
              className="text-sm font-semibold text-[#f97316] hover:underline transition">
              Compare All Plans
            </Link>
          </div>
          <p className={`text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>
            Trusted by 12,000+ individual architects worldwide.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`px-4 sm:px-6 md:px-8 py-10 border-t ${d ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>PICA</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {["Terms","Privacy","Documentation","Contact"].map((item) => (
              <Link key={item} href="#" className={`text-xs transition hover:opacity-70 ${d ? "text-gray-400" : "text-gray-500"}`}>{item}</Link>
            ))}
          </div>
          <p className={`text-xs ${d ? "text-gray-600" : "text-gray-400"}`}>
            © 2024 PICA Editorial SaaS. The Clinical Architect Framework.
          </p>
        </div>
      </footer>
    </div>
  );
}