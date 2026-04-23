"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CheckCircle, Globe, Shield } from "lucide-react";

export default function PricingPage() {
  const [dark, setDark] = useState(true);
  const [scale, setScale] = useState<"Small Business" | "Medium Business">("Small Business");
  const d = dark;

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/pages/about" },
    { label: "Pricing", href: "/pages/pricing", active: true },
  ];

  return (
    <div className={`min-h-screen ${d ? "bg-[#111111] text-white" : "bg-white text-gray-900"}`}>
      <Navbar dark={dark} setDark={setDark} navItems={navItems} isFixed={false} />

      {/* ── Hero ── */}
      <section className={`px-8 py-16 ${d ? "bg-[#111111]" : "bg-gray-50"}`}>
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-md border border-white/20 text-xs font-semibold uppercase tracking-widest text-gray-300 mb-6">
            Strategic Intelligence
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-4 max-w-xl">
            Architectural Pricing for<br />
            <span className="text-[#00ffaa]">African Enterprise.</span>
          </h1>
          <p className={`text-sm leading-relaxed mb-8 max-w-lg ${d ? "text-gray-400" : "text-gray-600"}`}>
            Choose a framework designed to scale with your organizational complexity. From solo ventures to multi-layered conglomerates.
          </p>

          {/* Scale toggle */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Organization Scale</p>
            <div className="flex items-center gap-2">
              {(["Small Business","Medium Business"] as const).map((s) => (
                <button key={s} onClick={() => setScale(s)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition ${
                    scale === s
                      ? d ? "bg-white/10 border-white/30 text-white" : "bg-gray-900 border-gray-900 text-white"
                      : d ? "border-white/10 text-gray-400 hover:border-white/20" : "border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className={`px-8 pb-20 ${d ? "bg-[#111111]" : "bg-gray-50"}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6 items-start">

          {/* Layer 01 — Free Scan */}
          <div className={`rounded-2xl p-8 border ${d ? "bg-[#1a2535] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Layer 01</p>
            <h3 className={`text-3xl font-extrabold mb-6 ${d ? "text-white" : "text-gray-900"}`}>Free Scan</h3>
            <ul className="space-y-3 mb-10">
              {["Core business health check","Focus: < 10 Employees","Basic PDF Performance Summary"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-[#00ffaa] flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <Link href="/pages/freescan" className={`block w-full py-3.5 rounded-xl text-sm font-semibold border transition text-center ${d ? "border-white/20 text-white hover:bg-white/5" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
              Start Scanning
            </Link>
          </div>

          {/* Layer 02 — Full Diagnostic (featured) */}
          <div className="rounded-2xl p-8 bg-[#2a3f2a] border border-[#00ffaa]/30 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00ffaa] text-gray-900 text-xs font-extrabold px-4 py-1 rounded-full uppercase tracking-wider">
              Most Selected
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Layer 02</p>
            <h3 className="text-3xl font-extrabold text-white mb-4">Full Diagnostic</h3>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-white">$249</span>
              <span className="text-sm text-gray-400 ml-1">/ yearly</span>
            </div>
            <ul className="space-y-3 mb-8">
              {["Deep-dive structural audit","Growth roadmap (36 months)","Compliance & Risk assessment","Detailed Insight PDF Package"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-[#00ffaa] flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <Link href="/pages/fulldiagnostic" className="block w-full py-3.5 rounded-xl text-sm font-bold bg-[#f97316] hover:bg-[#ea6c0a] text-white transition text-center">
              Get Diagnostic
            </Link>
          </div>

          {/* Layer 03 — Intelligence */}
          <div className="rounded-2xl p-8 bg-[#2a3520] border border-[#4a6030]/40">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Layer 03</p>
            <h3 className="text-3xl font-extrabold text-white mb-4">Intelligence</h3>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-white">$1,200</span>
              <span className="text-sm text-gray-400 ml-1">/ yearly</span>
            </div>
            <ul className="space-y-3 mb-8">
              {["Advanced Analytics Dashboard","Medium: > 10 Employees Focus","Real-time market volatility alerts","API access for custom CRM"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-[#00ffaa] flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <button className={`w-full py-3.5 rounded-xl text-sm font-bold border transition ${d ? "bg-[#1a2010] border-white/10 text-white hover:bg-white/5" : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"}`}>
              Contact Expert
            </button>
          </div>
        </div>
      </section>

      {/* ── PICA Advantage ── */}
      <section className={`px-8 py-16 ${d ? "bg-[#111111]" : "bg-white"}`}>
        <div className="max-w-6xl mx-auto">
          <div className={`rounded-2xl p-10 border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
            <div className="grid grid-cols-2 gap-12">
              {/* Left */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffaa] mb-3">The PICA Advantage</p>
                <h2 className={`text-2xl font-bold mb-6 ${d ? "text-white" : "text-gray-900"}`}>
                  Why organizations transition to PICA Intelligence.
                </h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00ffaa]/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-[#00ffaa]" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>Pan-African Context</p>
                      <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                        Our algorithms are trained on local market dynamics, currency shifts, and logistical nuances of 54 nations.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00ffaa]/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-[#00ffaa]" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>Compliance-First Design</p>
                      <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                        Automated checks against regional trade agreements and localized tax frameworks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "94%",    label: "Accuracy in Predictive Scaling"  },
                  { value: "12k+",   label: "Enterprises Audited"             },
                  { value: "<2hr",   label: "Assessment Turnaround"           },
                  { value: "Tier 4", label: "Data Security Protocols"         },
                ].map(({ value, label }) => (
                  <div key={label} className={`rounded-xl p-5 border-l-4 border-[#00ffaa] ${d ? "bg-[#0d1117]" : "bg-white"}`}>
                    <p className={`text-2xl font-extrabold mb-1 ${d ? "text-white" : "text-gray-900"}`}>{value}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`px-8 py-8 border-t ${d ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>PICA</p>
          <div className="flex items-center gap-8">
            {["Privacy Policy","Terms of Service","Contact Support","Documentation"].map((item) => (
              <Link key={item} href="#" className={`text-xs transition hover:opacity-70 ${d ? "text-gray-400" : "text-gray-500"}`}>{item}</Link>
            ))}
          </div>
          <p className={`text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>
            © 2024 PICA Editorial SaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}