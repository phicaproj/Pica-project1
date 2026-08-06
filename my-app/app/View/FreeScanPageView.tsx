"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import Image from "next/image";
import {
  ArrowRight,
  Timer,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function FreeScanPage() {
  const { dark } = useTheme();
  const d = dark;

  return (
    <div className={`antialiased min-h-screen transition-colors duration-300 ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>

      {/* ── Hero ── */}
      <section className={`relative min-h-[calc(100vh-50px)] flex items-center py-12 lg:py-16 px-6 lg:px-8 overflow-hidden ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
        {d && <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full items-center relative z-10">
          <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-7 px-4 sm:px-6 lg:px-0 lg:pr-6">
            <div className="inline-flex self-center lg:self-start items-center gap-2 px-4 py-1.5 rounded-full bg-[#f97316]/10 border border-[#f97316]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#f97316]">
                Free Business Scan
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-center lg:text-left">
              The First Step to <span className="text-[#f97316]">Clarity.</span>
            </h1>
            <p className={`text-base md:text-lg leading-relaxed max-w-lg text-center lg:text-left mx-auto lg:mx-0 ${d ? "text-gray-400" : "text-gray-600"}`}>
              Get a clear, honest read on your business at zero cost. Built for founders and entrepreneurs who want immediate visibility into where their business stands today.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 pt-2 w-full max-w-md lg:max-w-none">
              <Link href="/pages/generaltest"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-base font-bold transition-all text-center shadow-lg shadow-orange-500/20 hover:scale-[1.03] active:scale-95">
                Start Free Scan <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Image placeholder */}
          <div className="relative w-full h-[320px] sm:h-[480px] lg:h-[580px]">
            <Image
              src="/images/landing1.png"
              alt="Quick Scan Preview"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </section>

      {/* ── Quick Scan Toolkit ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-3">
            <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>The Quick Scan Toolkit</h2>
            <p className={`text-sm md:text-base ${d ? "text-gray-400" : "text-gray-600"}`}>Essential diagnostics for the modern founder.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* 15-Minute Express Audit card */}
            <div className={`group rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#0d1117] border-white/10 hover:border-teal-500/30" : "bg-white border-gray-200 shadow-sm hover:shadow-md"}`}>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-teal-500/20 transition-all duration-200">
                <Timer className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${d ? "text-white" : "text-gray-900"}`}>15-Minute Express Audit</h3>
              <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                Our assessment identifies the core gaps in your business in record time. No setup required—just clear, honest analysis.
              </p>
            </div>

            {/* Health Score metric card */}
            <div className="rounded-2xl p-8 bg-teal-400 flex flex-col items-center justify-center text-center shadow-lg shadow-teal-400/10 transition-transform duration-300 hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-2">Metric</p>
              <p className="text-6xl md:text-7xl font-black text-gray-900 leading-none mb-3">84</p>
              <p className="text-lg font-bold text-gray-900 mb-2">Sample Health Score Baseline</p>
              <p className="text-xs text-gray-800 max-w-xs leading-relaxed">
                A singular, authoritative metric reflecting your overall alignment with the Business Resilience Framework.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Risk Priority Matrix + Report Overview ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-100"}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

          {/* Risk Priority Matrix */}
          <div className={`rounded-2xl p-6 lg:p-8 border ${d ? "bg-[#161b22] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
              <AlertTriangle className="w-5 h-5 text-teal-400" />
              <p className="text-sm font-bold uppercase tracking-wider text-teal-400">Risk Priority Matrix</p>
            </div>
            <div className="space-y-4">
              {[
                {
                  num: "01",
                  tag: "CRITICAL",
                  tagColor: "text-rose-400 bg-rose-400/10 border border-rose-500/20",
                  title: "Decisions are taking too long to make",
                  desc: "High latency in decision pipelines slows execution and stalls growth."
                },
                {
                  num: "02",
                  tag: "CRITICAL",
                  tagColor: "text-rose-400 bg-rose-400/10 border border-rose-500/20",
                  title: "Process Drift",
                  desc: "You've drifted from the processes and standards that used to work."
                },
                {
                  num: "03",
                  tag: "ADVISORY",
                  tagColor: "text-amber-400 bg-amber-400/10 border border-amber-500/20",
                  title: "Resilience Gaps",
                  desc: "Lack of backup plans or redundancy in critical workflows."
                },
              ].map(({ num, tag, tagColor, title, desc }) => (
                <div key={num} className={`flex items-start gap-4 p-4 rounded-xl transition-colors duration-200 ${d ? "bg-[#0d1117]/80 hover:bg-[#0d1117]" : "bg-gray-50 hover:bg-gray-100/80"}`}>
                  <span className={`text-xs font-bold ${d ? "text-gray-500" : "text-gray-400"}`}>{num}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${tagColor}`}>
                        {tag}
                      </span>
                      <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                    </div>
                    <p className={`text-xs ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Overview */}
          <div className={`rounded-2xl p-6 lg:p-8 border flex flex-col justify-between ${d ? "bg-[#161b22] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
            <div className="space-y-4">
              <h3 className={`text-xl font-bold ${d ? "text-white" : "text-gray-900"}`}>Report Overview</h3>
              <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                A distilled, executive summary delivered directly to your dashboard. Clean typography for effortless consumption.
              </p>
              {/* Progress bars */}
              <div className="flex gap-2">
                <div className="h-1.5 w-16 rounded-full bg-teal-400 shadow-sm shadow-teal-400/20" />
                <div className="h-1.5 w-8 rounded-full bg-teal-400/30" />
              </div>
            </div>
            {/* Tablet image placeholder */}
            <div className={`mt-6 rounded-2xl overflow-hidden relative border ${d ? "bg-[#0d1117] border-white/5" : "bg-gray-50 border-gray-200"}`} style={{ minHeight: "160px" }}>
              <Image
                src="/images/freescan2.png"
                alt="Distilled Report Summary Preview"
                fill
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 text-center border-t ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className={`text-3xl md:text-5xl font-black leading-tight ${d ? "text-white" : "text-gray-900"}`}>
            Ready to Diagnose Your Business?
          </h2>
          <p className={`text-sm md:text-base ${d ? "text-gray-400" : "text-gray-600"}`}>
            No credit card, no commitment. Just the data you need to understand your current operational standing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/pages/generaltest"
              className="px-8 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition-all shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95">
              Start Free Scan
            </Link>
            <Link href="/pages/pricing"
              className="px-8 py-4 rounded-xl text-sm font-bold border transition-all hover:bg-white/5 active:scale-95 border-white/10 text-teal-400 hover:text-teal-300">
              Compare All Plans
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`px-6 py-12 border-t text-xs ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-200"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/favicon.png"
              alt="Beauvision"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            <span className={`text-sm font-bold tracking-tight ${d ? "text-white" : "text-gray-900"}`}>
              Beauvision
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {[
              { label: "Privacy Policy", href: "/data-policy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Documentation", href: "/documentation" },
              { label: "Contact Support", href: "#" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className={`transition hover:opacity-70 ${d ? "text-gray-400" : "text-gray-500"}`}>
                {label}
              </Link>
            ))}
          </div>
          <p className={d ? "text-gray-500" : "text-gray-400"}>
            © Beauvision 2026. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}