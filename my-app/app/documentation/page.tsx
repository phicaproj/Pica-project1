"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import {
  Compass,
  ArrowLeft,
  BookOpen,
  Activity,
  Layers,
  FileText,
  Settings,
  AlertTriangle,
  Play,
  ArrowRight,
  Database,
  Lock,
} from "lucide-react";

export default function DocumentationPage() {
  const { dark } = useTheme();
  const d = dark;

  return (
    <div className={`antialiased min-h-screen transition-colors duration-300 pb-20 ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>
      
      {/* ── Header ── */}
      <section className={`relative py-16 px-6 lg:px-8 border-b ${d ? "bg-[#161b22]/50 border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Platform Guide</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">
              PICA™ Platform User Documentation <br className="hidden sm:inline" />
              <span className="text-teal-400">& Knowledge Base</span>
            </h1>
            <p className={`text-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
              Welcome to the official platform documentation. Navigate setup, run assessments, interpret diagnostic scores, and execute roadmaps.
            </p>
          </div>
          <div>
            <Link href="/" className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold transition ${d ? "border-white/10 hover:bg-white/5 text-white" : "border-gray-200 hover:bg-gray-100 text-gray-700"}`}>
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* ── Main Layout ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="space-y-3 lg:col-span-1">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-3">Documentation Index</p>
          <div className="flex flex-col gap-1">
            {[
              { id: "getting-started", label: "1. Getting Started" },
              { id: "diagnostic-assessment", label: "2. Running Assessment" },
              { id: "scores-pillars", label: "3. Understanding Scores" },
              { id: "action-roadmaps", label: "4. Executing Roadmaps" },
              { id: "reports-billing", label: "5. Reports & Billing" },
            ].map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition text-left block hover:scale-[1.02] active:scale-95 ${d ? "hover:bg-white/5 text-gray-300 hover:text-white" : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"}`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Documentation Content */}
        <div className="lg:col-span-3 space-y-16">
          
          {/* Section 1 */}
          <div id="getting-started" className="space-y-6 scroll-mt-20">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-black">1</span>
              <h2 className="text-2xl font-black">Getting Started</h2>
            </div>
            
            <div className={`p-6 rounded-2xl border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 mb-4">Step 1: Setting Up Your Organization</h3>
              <ul className="space-y-4 text-sm">
                {[
                  "Log in to your PICA™ dashboard using your admin credentials.",
                  "Navigate to Account Settings > Organization Profile.",
                  "Enter your company name, industry sector, employee headcount, and upload your corporate logo."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">{idx + 1}</span>
                    <span className={d ? "text-gray-300" : "text-gray-600"}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div id="diagnostic-assessment" className="space-y-6 scroll-mt-20">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-black">2</span>
              <h2 className="text-2xl font-black">Running the Diagnostic Assessment</h2>
            </div>
            
            <div className={`p-6 rounded-2xl border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
              <p className={`text-sm mb-6 ${d ? "text-gray-300" : "text-gray-600"}`}>
                The core engine of PICA™ stands for <span className="font-extrabold text-teal-400">Pain-Point Identification, Classification, and Assessment</span>.
              </p>
              
              <ul className="space-y-4 text-sm">
                {[
                  "Click \"Start Free Scan\" on your main dashboard navigation.",
                  "Step through the guided diagnostic questionnaire. Ensure your inputs accurately reflect current operational realities rather than future aspirations.",
                  "The assessment auto-saves your progress at every step, allowing you to pause and return if additional operational data is required.",
                  "Click \"Submit\" to trigger the diagnostic calculation engine."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">{idx + 1}</span>
                    <span className={d ? "text-gray-300" : "text-gray-600"}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div id="scores-pillars" className="space-y-6 scroll-mt-20">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-black">3</span>
              <h2 className="text-2xl font-black">Understanding Your Scores & The 7 Pillars</h2>
            </div>
            
            <div className={`p-6 rounded-2xl border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"} space-y-6`}>
              <p className={`text-sm ${d ? "text-gray-300" : "text-gray-600"}`}>
                Once submitted, the system categorizes your operational inputs across **The 7 Signature Pillars**:
              </p>

              {/* Status Zones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    zone: "Red Zone (0% – 49% Health)",
                    color: "border-rose-500/20 bg-rose-500/5 text-rose-400",
                    desc: "Critical structural vulnerability. Immediate execution required to prevent operational leaks or compliance knockout risks."
                  },
                  {
                    zone: "Yellow Zone (50% – 74% Health)",
                    color: "border-amber-500/20 bg-amber-500/5 text-amber-400",
                    desc: "Operational friction present. Performance is constrained and requires systemization."
                  },
                  {
                    zone: "Green Zone (75% – 100% Health)",
                    color: "border-teal-500/20 bg-teal-500/5 text-teal-400",
                    desc: "High operational health and velocity. Asset architecture is stable."
                  }
                ].map(({ zone, color, desc }) => (
                  <div key={zone} className={`p-4 rounded-xl border ${color} space-y-2`}>
                    <p className="text-xs font-black uppercase tracking-wider">{zone}</p>
                    <p className="text-xs leading-relaxed opacity-90">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Primary Constraint */}
              <div className={`p-4 rounded-xl border border-dashed ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-300"}`}>
                <h4 className="text-sm font-bold text-teal-400 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> The Primary Binding Constraint
                </h4>
                <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                  The platform algorithmically isolates your **#1 Primary Constraint**: the single operational bottleneck currently choking your growth across all departments.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div id="action-roadmaps" className="space-y-6 scroll-mt-20">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-black">4</span>
              <h2 className="text-2xl font-black">Accessing & Executing Your Action Roadmaps</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  tier: "Diagnostic Tier",
                  subtitle: "High-Impact Action Summary",
                  desc: "Assessment results generate a focused, foundational Action Plan targeting your primary operational bottlenecks.",
                  bullets: [
                    "Accessing Your Summary Plan: View your primary action items directly on your main dashboard or click \"Export PDF\" to download a print-ready executive summary.",
                    "Implementation: Use this high-level summary during your internal leadership alignment meetings to address core constraints."
                  ]
                },
                {
                  tier: "PICA Intelligence™ Tier",
                  subtitle: "Interactive 90-Day Focus Roadmap",
                  desc: "The full 90-Day Focus Roadmap is an exclusive feature of the PICA Intelligence™ Layer, designed for active, real-time team governance.",
                  bullets: [
                    "Accessing the Engine: Open the \"90-Day Focus Roadmap\" tab on your dashboard menu.",
                    "Reviewing Priorities: Audit the auto-generated, metric-driven action steps algorithmically prioritized by risk severity."
                  ]
                }
              ].map(({ tier, subtitle, desc, bullets }) => (
                <div key={tier} className={`p-6 rounded-2xl border flex flex-col justify-between ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{tier}</p>
                      <h3 className="text-lg font-black text-teal-400 mt-0.5">{subtitle}</h3>
                    </div>
                    <p className={`text-xs leading-relaxed ${d ? "text-gray-300" : "text-gray-600"}`}>{desc}</p>
                    <ul className="space-y-2 pl-4 list-disc text-xs text-gray-400">
                      {bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className={d ? "text-gray-300" : "text-gray-600"}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5 */}
          <div id="reports-billing" className="space-y-6 scroll-mt-20">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-black">5</span>
              <h2 className="text-2xl font-black">Exporting Reports & Billing</h2>
            </div>
            
            <div className={`p-6 rounded-2xl border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"} grid grid-cols-1 md:grid-cols-2 gap-6`}>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-teal-400">Downloading PDF Summaries</h4>
                <p className={`text-xs leading-relaxed ${d ? "text-gray-300" : "text-gray-600"}`}>
                  Click **"Export PDF"** at the top right of your assessment dashboard to generate a clean, print-ready executive summary for board meetings or strategy sessions.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-teal-400">Managing Subscriptions</h4>
                <p className={`text-xs leading-relaxed ${d ? "text-gray-300" : "text-gray-600"}`}>
                  Access **Settings &gt; Billing & Subscription** to view invoices, update card details, or upgrade your plan seats.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Footer Link to Start Assessment ── */}
      <section className="max-w-4xl mx-auto px-6 text-center mt-20 relative z-10 space-y-6">
        <h2 className={`text-2xl sm:text-3xl font-black ${d ? "text-white" : "text-gray-900"}`}>
          Ready to diagnose your operations?
        </h2>
        <div className="pt-2">
          <Link href="/pages/generaltest" className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold uppercase tracking-wider transition-all shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95">
            Start Free Assessment <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
