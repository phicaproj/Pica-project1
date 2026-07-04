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
      <section className={`relative min-h-[calc(100vh-50px)] lg:h-[calc(100vh-50px)] flex items-center py-6 md:py-8 px-6 lg:px-8 overflow-hidden ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
        {d && <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full relative z-10">
          <div className="space-y-4 py-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f97316]/10 border border-[#f97316]/20">
              <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#f97316]">
                Free Individual Plan
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
              Awareness 1A: <br />
              The First Step to <span className="text-[#f97316]">Clarity.</span>
            </h1>
            <p className={`text-sm leading-relaxed max-w-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
              Experience the precision of the Clinical Architect Framework at zero cost. Designed for individual professionals seeking immediate baseline visibility into their operational health.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link href="/pages/generaltest"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition-all text-center shadow-lg shadow-orange-500/20 active:scale-95">
                Start Quick Scan <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Image placeholder */}
          <div className={`relative rounded-3xl overflow-hidden border shadow-2xl w-full h-[95%] my-auto ${d ? "border-white/10 shadow-black/40 bg-[#161b22]" : "border-gray-200 shadow-gray-200/55 bg-white"}`} style={{ minHeight: "350px" }}>
            <Image
              src="/images/freescan1.png"
              alt="Quick Scan Preview"
              fill
              priority
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* ── Quick Scan Toolkit ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-3">
            <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>The Quick Scan Toolkit</h2>
            <p className={`text-sm md:text-base ${d ? "text-gray-400" : "text-gray-600"}`}>Essential diagnostics for the modern architect.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* 15-Minute Express Audit card */}
            <div className={`group rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#0d1117] border-white/10 hover:border-teal-500/30" : "bg-white border-gray-200 shadow-sm hover:shadow-md"}`}>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-teal-500/20 transition-all duration-200">
                <Timer className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${d ? "text-white" : "text-gray-900"}`}>15-Minute Express Audit</h3>
              <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                Our proprietary algorithmic assessment identifies core structural gaps in record time. No integration required—just pure clinical analysis.
              </p>
            </div>

            {/* Health Score metric card */}
            <div className="rounded-2xl p-8 bg-teal-400 flex flex-col items-center justify-center text-center shadow-lg shadow-teal-400/10 transition-transform duration-300 hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-2">Platform Metric</p>
              <p className="text-6xl md:text-7xl font-black text-gray-900 leading-none mb-3">84</p>
              <p className="text-lg font-bold text-gray-900 mb-2">Health Score Baseline</p>
              <p className="text-xs text-gray-800 max-w-xs leading-relaxed">
                A singular, authoritative metric reflecting your overall alignment with the Clinical Architect Framework.
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
                { num: "01", title: "Operational Friction",  desc: "High latency in decision pipelines."              },
                { num: "02", title: "Protocol Drift",        desc: "Deviation from core architectural standards."     },
                { num: "03", title: "Resilience Deficit",    desc: "Lack of redundancy in critical workflows."        },
              ].map(({ num, title, desc }) => (
                <div key={num} className={`flex items-start gap-4 p-4 rounded-xl transition-colors duration-200 ${d ? "bg-[#0d1117]/80 hover:bg-[#0d1117]" : "bg-gray-50 hover:bg-gray-100/80"}`}>
                  <span className={`text-xs font-bold ${d ? "text-gray-500" : "text-gray-400"}`}>{num}</span>
                  <div>
                    <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                    <p className={`text-xs mt-1 ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
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
            Ready for a Clinical Appraisal?
          </h2>
          <p className={`text-sm md:text-base ${d ? "text-gray-400" : "text-gray-600"}`}>
            No credit card, no commitment. Just the data you need to understand your current operational standing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/pages/generaltest"
              className="px-8 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition-all shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95">
              Start Assessment
            </Link>
            <Link href="/pages/pricing"
              className="px-8 py-4 rounded-xl text-sm font-bold border transition-all hover:bg-white/5 active:scale-95 border-white/10 text-teal-400 hover:text-teal-300">
              Compare All Plans
            </Link>
          </div>
          <p className={`text-[10px] uppercase font-bold tracking-wider pt-2 ${d ? "text-gray-500" : "text-gray-400"}`}>
            Trusted by 12,000+ individual architects worldwide.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`py-12 px-6 border-t text-center text-xs ${d ? "bg-[#0d1117] border-white/5 text-gray-500" : "bg-white border-gray-200 text-gray-400"}`}>
        <div className="max-w-7xl mx-auto space-y-4">
          <p className="font-bold text-sm tracking-wider text-teal-400">Beauvision</p>
          <p>
            © Beauvision 2026. All rights reserved. Powered by{" "}
            <a href="https://sundimension.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-400 transition-colors">SunDimension</a>
          </p>
        </div>
      </footer>
    </div>
  );
}