"use client";
 
import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import Image from "next/image";
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
  Crown,
  Quote,
  MessageSquare,
} from "lucide-react";

export default function HomePage() {
  const { dark } = useTheme();
  const d = dark;

  return (
    <div className={`antialiased min-h-screen transition-colors duration-300 ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>

      {/* ── Hero ── */}
      <section className={`relative min-h-[calc(100vh-50px)] flex items-center py-12 lg:py-16 px-6 lg:px-8 overflow-hidden ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
        {/* Background glow */}
        {d && <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full items-center relative z-10">
          {/* Left */}
          <div className="flex flex-col justify-center space-y-6 md:space-y-7 md:pr-6">
            <div className="inline-flex self-start items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Precision Business Intelligence
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight">
              Understand Your <br className="hidden lg:inline" />
              Business <span className="text-teal-400">Before</span> <br />
              You Try to Grow It
            </h1>
            <p className={`text-base md:text-lg leading-relaxed max-w-lg ${d ? "text-gray-400" : "text-gray-600"}`}>
              PICA provides business owners with the diagnostic clarity needed to identify blind spots, optimize operations, and scale with confidence.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link href="/pages/freescan" className="px-12 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-base font-bold transition-all text-center shadow-xl shadow-orange-500/20 hover:scale-[1.05] active:scale-95">
                Start Free Scan
              </Link>
              <Link href="/pages/about" className={`px-6 py-4 rounded-xl text-base font-bold border transition-all text-center hover:scale-[1.01] active:scale-95 ${d ? "border-white/10 text-white hover:bg-white/5" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
                PICA Onboarding Guide
              </Link>
            </div>
          </div>

          {/* Right — Dashboard mockup with landing1 image */}
          <div className="relative w-full h-[320px] sm:h-[480px] lg:h-[580px]">
            <Image
              src="/images/landing1.png"
              alt="PICA Dashboard Preview"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-100"}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-widest text-teal-400 uppercase">Capabilities</p>
            <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>
              Comprehensive Diagnostics for Businesses
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: <Search className="w-6 h-6 text-teal-400" />, title: "Exposing Operational Vulnerabilities", desc: "Identify structural weaknesses in your business model that standard accounting software misses." },
              { icon: <BarChart2 className="w-6 h-6 text-teal-400" />, title: "Performance Benchmarking", desc: "Compare your KPIs against top-performing businesses in your specific sector." },
              { icon: <Zap className="w-6 h-6 text-teal-400" />, title: "Auditing Systems for Scale", desc: "Determine if your infrastructure is truly ready for high-velocity scaling without breaking." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className={`group p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#161b22] border-white/10 hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-500/[0.02]" : "bg-gray-50 border-gray-200 hover:border-teal-500/30 hover:shadow-xl hover:shadow-gray-200/50"}`}>
                <div className="mb-6 w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:scale-105 group-hover:bg-teal-500/20 transition-all duration-200">{icon}</div>
                <h3 className={`text-lg font-bold mb-3 ${d ? "text-white" : "text-gray-900"}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three Layers ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>The Three Layers of Intelligence</h2>
            <p className={`text-sm md:text-base ${d ? "text-gray-400" : "text-gray-600"}`}>From instant insights to deep-dive forensic analysis.</p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Layer 01 - Free Scan */}
            <div className={`rounded-2xl p-6 lg:p-8 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#0d1117] border-white/10 hover:border-white/20" : "bg-white border-gray-200 shadow-sm hover:shadow-md"}`}>
              <div className="space-y-4">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Layer 01</p>
                <h3 className={`text-xl font-bold ${d ? "text-white" : "text-gray-900"}`}>Free Scan</h3>
                <ul className="space-y-3 pt-2">
                  {["15-Minute Audit", "Top-Level Health Score", "Top 3 Risk Factors"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/pages/freescan" className={`mt-8 w-full py-3 rounded-xl text-xs font-bold border transition-all text-center active:scale-95 ${d ? "border-white/10 text-white hover:bg-white/5" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
                Start Scanning
              </Link>
            </div>

            {/* Layer 02 - Full Diagnostic (featured) */}
            <div className="rounded-2xl p-6 lg:p-8 bg-[#152e22] border border-teal-500/40 relative flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/[0.03]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#f97316] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-orange-500/20">
                Most Popular
              </div>
              <div className="space-y-4 pt-2">
                <p className="text-xs text-teal-400 font-bold uppercase tracking-wider">Layer 02</p>
                <h3 className="text-xl font-bold text-white">Full Diagnostic</h3>
                <ul className="space-y-3 pt-2">
                  {["Complete 7-Pillar Review", "Gap Analysis Report", "Priority Roadmap"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-200">
                      <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/pages/fulldiagnostic" className="mt-8 w-full py-3 rounded-xl text-xs font-bold bg-[#f97316] hover:bg-[#ea6c0a] text-white transition-all text-center block shadow-lg shadow-orange-500/20 active:scale-95">
                Get Diagnostic
              </Link>
            </div>

            {/* Layer 03 - Intelligence */}
            <div className={`rounded-2xl p-6 lg:p-8 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#13281d] border-teal-800/40 hover:border-teal-700/40" : "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300"}`}>
              <div className="space-y-4">
                <p className="text-xs text-teal-400 font-bold uppercase tracking-wider">Layer 03</p>
                <h3 className={`text-xl font-bold ${d ? "text-white" : "text-gray-900"}`}>Intelligence</h3>
                <ul className="space-y-3 pt-2">
                  {["Monthly Deep Dives", "Competitor Intelligence", "Board-Level Dashboards"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/Auth/signup" className={`mt-8 w-full py-3 rounded-xl text-xs font-bold border transition-all text-center block active:scale-95 ${d ? "border-teal-600/50 text-teal-400 hover:bg-teal-600/10" : "border-emerald-600 text-emerald-700 hover:bg-emerald-100"}`}>
                Sign Up & Consult
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7 Pillars ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-100"}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 items-center border-b border-white/5 pb-8">
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest text-teal-400 uppercase">Structural Foundation</p>
              <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>
                The 7 Pillars of Business Resilience
              </h2>
            </div>
            <p className={`text-sm md:text-base leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
              Every diagnostic explores these interconnected areas to build a bulletproof operation, optimized specifically for your operational realities.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: <Users className="w-6 h-6 text-teal-400" />, label: "Leadership & People" },
              { icon: <Briefcase className="w-6 h-6 text-teal-400" />, label: "Business Model" },
              { icon: <ShoppingCart className="w-6 h-6 text-teal-400" />, label: "Customer Acquisition" },
              { icon: <DollarSign className="w-6 h-6 text-teal-400" />, label: "Financial Health" },
              { icon: <Settings className="w-6 h-6 text-teal-400" />, label: "Operations" },
              { icon: <Shield className="w-6 h-6 text-teal-400" />, label: "Legal & Compliance" },
              { icon: <MapPin className="w-6 h-6 text-teal-400" />, label: "Product-Market Fit" },
            ].map(({ icon, label }) => (
              <div key={label} className={`flex flex-col items-center gap-4 p-6 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200 hover:shadow-md hover:shadow-gray-200/20"}`}>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">{icon}</div>
                <span className={`text-sm font-semibold ${d ? "text-gray-300" : "text-gray-700"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data You Can Actually Use ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest text-teal-400 uppercase">Output Quality</p>
              <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>Data You Can Actually Use</h2>
            </div>
            <p className={`text-sm md:text-base leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
              No generic advice. Our reports provide forensic-level detail on where your money is leaking and where your next 10x growth will come from.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-[#f97316]" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>Risk Identification</p>
                  <p className={`text-xs mt-1 ${d ? "text-gray-400" : "text-gray-600"}`}>Immediate flags for legal, financial, or operational exposure.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-5 h-5 text-[#f97316]" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>Profit Margin Leak Identification</p>
                  <p className={`text-xs mt-1 ${d ? "text-gray-400" : "text-gray-600"}`}>Actionable steps to increase margin without raising prices.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary Card */}
          <div className={`rounded-2xl border p-6 lg:p-8 shadow-2xl ${d ? "bg-[#0d1117] border-white/10 shadow-black/40" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">DIAGNOSTIC REPORT V2.1</p>
              <p className="text-[10px] font-bold text-gray-500">REALTIME SNAPSHOT</p>
            </div>
            <h3 className={`text-lg font-extrabold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Executive Summary</h3>
            <div className="flex items-center gap-12 mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Risk Score</p>
                <p className="text-4xl font-black text-[#f97316]">68%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Risk Profile</p>
                <p className="text-lg font-bold text-red-400">Moderate High</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className={`rounded-xl p-4 border-l-4 border-red-500 ${d ? "bg-red-500/10" : "bg-red-50"}`}>
                <p className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  CRITICAL: Cash-Flow Concentration
                </p>
                <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>60% of revenue derived from 3 B2B clients. Concentration exposure within 90 days.</p>
              </div>
              <div className={`rounded-xl p-4 border-l-4 border-yellow-500 ${d ? "bg-yellow-500/10" : "bg-yellow-50"}`}>
                <p className="text-xs font-bold text-yellow-400 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  ADVISORY: Ops Optimization
                </p>
                <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>Inventory turnover may be improved by 30 days. Capital locked in lagoon stock.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Economy Section (Testimonial Card Upgrade) ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-100"}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Image */}
          <div className={`rounded-3xl overflow-hidden relative shadow-xl ${d ? "bg-[#161b22]/50 border border-white/10 shadow-black/40" : "bg-gray-100 border border-gray-200"}`} style={{ minHeight: "320px" }}>
            <div className="relative w-full h-full" style={{ minHeight: "320px" }}>
              <Image
                src="/images/landing2.png"
                alt="PICA Consulting Session"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="space-y-6">
            <h2 className={`text-3xl md:text-4xl font-black leading-tight ${d ? "text-white" : "text-gray-900"}`}>
              The Economy is Changing.<br />
              <span className="text-teal-400">Is Your Business?</span>
            </h2>
            <p className={`text-sm md:text-base leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
              In a volatile market, guessing is a liability. PICA gives you the empirical data to survive headwinds and capture opportunities before your competitors even see them.
            </p>
            
            {/* Testimonial Card */}
            <div className={`rounded-2xl p-6 border relative ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
              <Quote className="absolute right-6 top-6 h-8 w-8 text-teal-400/20" />
              <p className={`text-sm italic leading-relaxed mb-4 relative z-10 ${d ? "text-gray-300" : "text-gray-700"}`}>
                &quot;The diagnostic changed how we saw our supply chain. We saved 15% in costs in just three months.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-400/10 text-teal-400 text-xs font-black flex items-center justify-center">
                  TA
                </div>
                <div>
                  <p className={`text-xs font-bold ${d ? "text-white" : "text-gray-900"}`}>Tunde A.</p>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Founder, Lagos Logistics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-12 md:py-16 px-6 lg:px-8 bg-gradient-to-br from-[#ea580c] via-[#f97316] to-[#facc15] relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-black/5 blur-2xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center space-y-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
            Get Instant Clarity on Your Business
          </h2>
          <p className="text-base md:text-lg text-gray-900/80 font-medium max-w-xl mx-auto">
            Join founders and business owners who stopped guessing and started scaling with precision.
          </p>
          <div className="pt-2">
            <Link href="/pages/freescan" className="inline-block px-8 py-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold uppercase tracking-wider transition-all shadow-xl shadow-black/20 hover:scale-105 active:scale-95">
              Run Your Free Scan Now
            </Link>
          </div>
          <p className="text-[10px] text-gray-900/60 font-bold uppercase tracking-widest pt-2">
            NO CREDIT CARD REQUIRED · TAKES 15 MINUTES
          </p>
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