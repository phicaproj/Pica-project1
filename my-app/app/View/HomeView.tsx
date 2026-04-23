"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  Search,
  Target,
  BarChart2,
  Zap,
  Users,
  Briefcase,
  ShoppingCart,
  DollarSign,
  Settings,
  Shield,
  MapPin,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function HomePage() {
  const [dark, setDark] = useState(true);

  const d = dark;

  const navItems = [
    { label: "Home", href: "/", active: true },
    { label: "About", href: "/pages/about" },
    { label: "Pricing", href: "/pages/pricing" },
  ];

  return (
    <div className={d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}>
      <Navbar dark={dark} setDark={setDark} navItems={navItems} isFixed={true} />

      {/* ── Hero ── */}
      <section className={`relative pt-32 pb-20 px-8 overflow-hidden ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
        {/* Background glow */}
        {d && <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />}
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-teal-400 uppercase mb-4">Precision Business Intelligence</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Understand<br />
              Your<br />
              Business<br />
              <span className="text-teal-400">Before</span><br />
              You Try to Grow<br />
              It
            </h1>
            <p className={`text-sm leading-relaxed mb-8 max-w-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
              PICA provides Nigerian founders with the diagnostic clarity needed to identify blind spots, optimize operations, and scale with confidence.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/questions" className="px-6 py-3 rounded-lg bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold transition">
                Start Free Scan
              </Link>
              <Link href="#" className={`px-6 py-3 rounded-lg text-sm font-semibold border transition ${d ? "border-white/20 text-white hover:bg-white/5" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
                PICA Onboarding Guide
              </Link>
            </div>
          </div>

          {/* Right — Dashboard mockup with landing1 image */}
          <div className={`relative rounded-2xl overflow-hidden border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-100 border-gray-200"}`} style={{ minHeight: "340px" }}>
            <Image
              src="/images/landing1.png"
              alt="Dashboard Preview"
              width={500}
              height={340}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#0d1117]" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-teal-400 uppercase mb-3">Some Capabilities</p>
          <h2 className={`text-3xl font-bold mb-12 ${d ? "text-white" : "text-gray-900"}`}>Comprehensive Diagnostics for Businesses</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { icon: <Search className="w-6 h-6 text-teal-400" />, title: "Blind Spot Discovery", desc: "Identify structural weaknesses in your business model that standard accounting software misses." },
              { icon: <BarChart2 className="w-6 h-6 text-teal-400" />, title: "Performance Benchmarking", desc: "Compare your KPIs against top-performing Nigerian businesses in your specific sector." },
              { icon: <Zap className="w-6 h-6 text-teal-400" />, title: "Growth Readiness", desc: "Determine if your infrastructure is truly ready for high-velocity scaling without breaking." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className={`p-6 rounded-2xl border transition hover:border-teal-500/50 ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                <div className="mb-4">{icon}</div>
                <h3 className={`text-base font-bold mb-2 ${d ? "text-white" : "text-gray-900"}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three Layers ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#161b22]" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className={`text-3xl font-bold mb-3 ${d ? "text-white" : "text-gray-900"}`}>The Three Layers of Intelligence</h2>
          <p className={`text-sm ${d ? "text-gray-400" : "text-gray-600"}`}>From instant insights to deep-dive forensic analysis.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6">
          {/* Layer 01 - Free Scan */}
          <div className={`rounded-2xl p-6 border ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Layer 01</p>
            <h3 className={`text-lg font-bold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Free Scan</h3>
            <ul className="space-y-2 mb-6">
              {["15-Minute Audit", "Top-Level Health Score", "Top 3 Risk Factors"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <Link href="/pages/freescan" className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition text-center ${d ? "border-white/20 text-white hover:bg-white/5" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
              Start Scanning
            </Link>
          </div>

          {/* Layer 02 - Full Diagnostic (featured) */}
          <div className="rounded-2xl p-6 bg-[#1a2e1a] border border-teal-500/50 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f97316] text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
            <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-1">Layer 02</p>
            <h3 className="text-lg font-bold text-white mb-4">Full Diagnostic</h3>
            <ul className="space-y-2 mb-6">
              {["Complete 7-Pillar Review", "Gap Analysis Report", "Priority Roadmap"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <Link href="/pages/fulldiagnostic" className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#f97316] hover:bg-[#ea6c0a] text-white transition text-center block">
              Get Diagnostic
            </Link>
          </div>

          {/* Layer 03 - Intelligence */}
          <div className={`rounded-2xl p-6 border ${d ? "bg-[#1a2e20] border-teal-800/40" : "bg-green-50 border-green-200"}`}>
            <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-1">Layer 03</p>
            <h3 className={`text-lg font-bold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Intelligence</h3>
            <ul className="space-y-2 mb-6">
              {["Monthly Deep Dives", "Competitor Intelligence", "Board-Level Dashboards"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <button className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition ${d ? "border-teal-600 text-teal-400 hover:bg-teal-600/10" : "border-green-600 text-green-700 hover:bg-green-100"}`}>
              Contact Expert
            </button>
          </div>
        </div>
      </section>

      {/* ── 7 Pillars ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#0d1117]" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-16 items-start mb-12">
            <div>
              <p className="text-xs font-semibold tracking-widest text-teal-400 uppercase mb-3">Structural Foundation</p>
              <h2 className={`text-3xl font-bold ${d ? "text-white" : "text-gray-900"}`}>The 7 Pillars of Nigerian Business Resilience</h2>
            </div>
            <p className={`text-sm leading-relaxed pt-8 ${d ? "text-gray-400" : "text-gray-600"}`}>
              Every diagnostic explores these interconnected areas to build a bulletproof operation.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {[
              { icon: <Users className="w-6 h-6 text-teal-400" />, label: "Leadership & People" },
              { icon: <Briefcase className="w-6 h-6 text-teal-400" />, label: "Business Model" },
              { icon: <ShoppingCart className="w-6 h-6 text-teal-400" />, label: "Customer Acquisition" },
              { icon: <DollarSign className="w-6 h-6 text-teal-400" />, label: "Financial Health" },
              { icon: <Settings className="w-6 h-6 text-teal-400" />, label: "Operations" },
              { icon: <Shield className="w-6 h-6 text-teal-400" />, label: "Legal & Compliance" },
              { icon: <MapPin className="w-6 h-6 text-teal-400" />, label: "Product-Market Fit" },
            ].map(({ icon, label }) => (
              <div key={label} className={`flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition hover:border-teal-500/50 ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                {icon}
                <span className={`text-sm font-medium ${d ? "text-gray-300" : "text-gray-700"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data You Can Actually Use ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#161b22]" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-teal-400 uppercase mb-3">Output Quality</p>
            <h2 className={`text-3xl font-bold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Data You Can Actually Use</h2>
            <p className={`text-sm leading-relaxed mb-8 ${d ? "text-gray-400" : "text-gray-600"}`}>
              No generic advice. Our reports provide forensic-level detail on where your money is leaking and where your next 10x growth will come from.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#f97316] flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-semibold ${d ? "text-white" : "text-gray-900"}`}>Risk Identification</p>
                  <p className={`text-xs ${d ? "text-gray-400" : "text-gray-600"}`}>Immediate flags for legal or financial exposure unique to Nigeria.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#f97316] flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-semibold ${d ? "text-white" : "text-gray-900"}`}>Efficiency Multipliers</p>
                  <p className={`text-xs ${d ? "text-gray-400" : "text-gray-600"}`}>Actionable steps to increase margin without raising prices.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary Card */}
          <div className={`rounded-2xl border p-6 ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200 shadow"}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">DIAGNOSTIC REPORT V2.1</p>
              <p className="text-xs text-gray-500">Jan 28, 2025</p>
            </div>
            <h3 className={`text-base font-bold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Executive Summary</h3>
            <div className="flex items-center gap-8 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Risk Score</p>
                <p className="text-3xl font-extrabold text-[#f97316]">68%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Risk Profile</p>
                <p className="text-lg font-bold text-red-400">Moderate High</p>
              </div>
            </div>
            <div className={`rounded-xl p-3 mb-3 border-l-4 border-red-500 ${d ? "bg-red-500/10" : "bg-red-50"}`}>
              <p className="text-xs font-bold text-red-400 mb-1">CRITICAL: Cash-Flow Concentration</p>
              <p className="text-xs text-gray-400">60% of revenue derived from 3 B2B clients. Concentration exposure within 90 days.</p>
            </div>
            <div className={`rounded-xl p-3 border-l-4 border-yellow-500 ${d ? "bg-yellow-500/10" : "bg-yellow-50"}`}>
              <p className="text-xs font-bold text-yellow-400 mb-1">ADVISORY: Ops Optimization</p>
              <p className="text-xs text-gray-400">Inventory turnover may be improved by 30 days. Capital locked in lagoon stock.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Economy Section ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#0d1117]" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-16 items-center">
          {/* Image placeholder */}
          <div className={`rounded-2xl overflow-hidden relative ${d ? "bg-[#161b22] border border-white/10" : "bg-gray-100 border border-gray-200"}`} style={{ minHeight: "280px" }}>
            <Image
              src="/images/landing2.png"
              alt="Team / Office"
              width={500}
              height={280}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className={`text-3xl font-bold mb-4 ${d ? "text-white" : "text-gray-900"}`}>
              The Economy is Changing.<br />
              <span className="text-teal-400">Is Your Business?</span>
            </h2>
            <p className={`text-sm leading-relaxed mb-6 ${d ? "text-gray-400" : "text-gray-600"}`}>
              In a volatile market, guessing is a liability. PICA gives you the empirical data to survive headwinds and capture opportunities before your competitors even see them.
            </p>
            <blockquote className={`border-l-4 border-teal-400 pl-4 ${d ? "text-gray-300" : "text-gray-700"}`}>
              <p className="text-sm italic mb-2">"The diagnostic changed how we saw our supply chain. We saved 15% in costs in just three months."</p>
              <p className="text-xs text-teal-400 font-semibold">— Tunde A., Founder of Lagos Logistics</p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-8 bg-gradient-to-br from-[#f97316] via-[#f59e0b] to-[#fbbf24]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Get Instant Clarity on Your Business</h2>
          <p className="text-sm text-gray-800 mb-8">Join 500+ Nigerian founders who stopped guessing and started scaling with precision.</p>
          <Link href="/questions" className="inline-block px-8 py-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition">
            Run Your area Scan Now
          </Link>
          <p className="text-xs text-gray-700 mt-4">NO CREDIT CARD REQUIRED · TAKES 15 MINUTES</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`py-8 px-8 border-t text-center text-xs ${d ? "bg-[#0d1117] border-white/10 text-gray-500" : "bg-white border-gray-200 text-gray-400"}`}>
        © Beauvision 2024. All rights reserved. Powered by{" "}
        <a href="https://sundimension.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-400 transition">SunDimension</a>
      </footer>
    </div>
  );
}