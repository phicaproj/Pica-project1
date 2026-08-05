"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  HelpCircle,
  AlertTriangle,
  Target,
  Sparkles,
} from "lucide-react";

export default function AboutPage() {
  const { dark } = useTheme();
  const d = dark;

  return (
    <div className={`antialiased min-h-screen transition-colors duration-300 pb-24 ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>
      
      {/* ── Hero Section ── */}
      <section className={`relative min-h-[85vh] flex items-center py-16 px-6 lg:px-8 overflow-hidden ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
        {/* Decorative background glows */}
        {d && (
          <>
            <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
          </>
        )}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-center relative z-10">
          
          {/* Hero Left Content */}
          <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-0">
            <div className="inline-flex self-center lg:self-start items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Compass className="w-4 h-4 animate-spin-slow" />
              <span className="text-xs font-black uppercase tracking-widest">PICA Onboarding Guide</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight">
              Prepare for <br />
              Business <span className="text-teal-400">Clarity</span>
            </h1>
            
            <p className={`text-base md:text-lg leading-relaxed max-w-lg ${d ? "text-gray-400" : "text-gray-600"}`}>
              PICA is a structured business intelligence system designed to diagnose how your business is actually operating &mdash; and what needs to change for it to grow.
            </p>

            <div className={`p-5 rounded-2xl border max-w-md ${d ? "bg-[#161b22] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-[#f97316] mb-1.5 flex items-center justify-center lg:justify-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                This is not a survey
              </p>
              <p className={`text-xs leading-relaxed ${d ? "text-gray-300" : "text-gray-600"}`}>
                This is a <span className="font-black text-teal-400">diagnostic and execution tool</span>. In a few minutes, you’ll get clarity across the most important areas of your business.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full max-w-sm lg:max-w-none">
              <Link href="/pages/generaltest" className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-base font-bold transition-all text-center shadow-lg shadow-orange-500/20 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2">
                Start Assessment <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-teal-400" />
                ⏱ Takes 5–10 minutes
              </div>
            </div>
          </div>

          {/* Hero Right Mockup Frame */}
          <div className="relative w-full flex items-center justify-center lg:justify-end">
            <div className={`w-full max-w-[540px] rounded-3xl overflow-hidden border ${d ? "bg-[#161b22] border-white/10 shadow-black/40" : "bg-white border-gray-200"} shadow-2xl relative p-4`}>
              <div className="relative w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden">
                <Image
                  src="/images/about1.png"
                  alt="PICA Diagnostic System"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Key Metrics Overview ── */}
      <section className={`py-8 border-t border-b ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { title: "DIAGNOSTIC PROCESS", value: "7-Pillar Framework", desc: "Holistic evaluation of operations, finance, and product." },
            { title: "TIME COMMITMENT", value: "5-10 Minutes", desc: "Distilled inquiries that skip high-level fluff." },
            { title: "DELIVERABLE OUTCOME", value: "Action Roadmap", desc: "Prioritized steps mapped out against real bottlenecks." }
          ].map(({ title, value, desc }) => (
            <div key={title} className="p-4 space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
              <h4 className="text-lg font-black text-teal-400">{value}</h4>
              <p className={`text-xs ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How This Works (Linear Process Stepper) ── */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <p className="text-xs font-bold tracking-widest text-[#f97316] uppercase">Assessment Pipeline</p>
          <h2 className={`text-3xl sm:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>How This Works</h2>
          <p className={`text-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
            A simple, empirical flow designed to extract clear operating realities.
          </p>
        </div>

        {/* 3-Step Horizontal Progress Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {[
            {
              step: "01",
              title: "Structured Assessment",
              desc: "Answer precision-crafted diagnostic questions checking key architectural areas of your organization."
            },
            {
              step: "02",
              title: "Analyze Realities",
              desc: "Each question outlines real operational states. Choose the path that matches what is actually happening in your business."
            },
            {
              step: "03",
              title: "Generate Insights",
              desc: "Get your unified Business Health Score, highlight primary constraints, and receive detailed execution roadmaps."
            }
          ].map(({ step, title, desc }, idx) => (
            <div key={step} className={`p-8 rounded-2xl border relative transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#161b22] border-white/10 hover:border-teal-500/30" : "bg-gray-50 border-gray-200 hover:shadow-md"}`}>
              <div className="absolute -top-5 left-8 w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black shadow-lg">
                {step}
              </div>
              <h3 className={`text-lg font-bold mb-3 mt-2 ${d ? "text-white" : "text-gray-900"}`}>{title}</h3>
              <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What You'll Get (Perfectly Aligned 4-Column Grid) ── */}
      <section className={`py-20 border-t ${d ? "bg-[#161b22]/40 border-white/5" : "bg-gray-50/50 border-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <p className="text-xs font-bold tracking-widest text-teal-400 uppercase">Actionable Deliverables</p>
            <h2 className={`text-3xl sm:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>What You&apos;ll Get</h2>
            <p className={`text-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
              At the end of this assessment, you will receive a comprehensive view of your operational strength.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Activity className="w-5 h-5 text-teal-400" />,
                title: "Business Health Score",
                desc: "A singular metric rating your organizational alignment with structural best practices."
              },
              {
                icon: <Layers className="w-5 h-5 text-teal-400" />,
                title: "Strongest & Weakest Areas",
                desc: "Identify exactly where your organization excels and where resources are currently being drained."
              },
              {
                icon: <AlertTriangle className="w-5 h-5 text-[#f97316]" />,
                title: "Key Growth Gaps",
                desc: "Pinpoint constraints, process drifts, and vulnerabilities blocking structural scaling."
              },
              {
                icon: <Target className="w-5 h-5 text-teal-400" />,
                title: "Execution Roadmap",
                desc: "A priority-ordered list of next steps, detailing what to repair, replace, or optimize next."
              }
            ].map(({ icon, title, desc }) => (
              <div key={title} className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#0d1117] border-white/10 hover:border-teal-500/30" : "bg-white border-gray-200 hover:shadow-md"}`}>
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    {icon}
                  </div>
                  <h3 className={`text-base font-bold ${d ? "text-white" : "text-gray-900"}`}>{title}</h3>
                  <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <p className={`text-xs italic ${d ? "text-gray-400" : "text-gray-500"}`}>
              * You may also unlock deeper diagnostics for more advanced strategic insights.
            </p>
          </div>
        </div>
      </section>

      {/* ── What Makes This Different ── */}
      <section className="py-20 max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">Operational Logic</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>
              What Makes This Different
            </h2>
            <p className={`text-sm sm:text-base leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
              PICA does not just tell you what is wrong. It displays the structural bottlenecks causing constraints, and at deeper levels, provides <span className="font-extrabold text-teal-400">execution steps</span> &mdash; not just surface-level advice.
            </p>
            <div className={`p-6 rounded-2xl border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
              <p className="text-sm font-bold text-teal-400 mb-2">Empirical Foundation</p>
              <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                By testing across the 7 critical pillars, PICA analyzes operational resilience mathematically, skipping the subjective answers traditional surveys yield.
              </p>
            </div>
          </div>

          {/* List of features in visual grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Empirical Strength Mapping", desc: "Find exactly where your business model excels." },
              { title: "Weakness Identification", desc: "Shine a light on operational leakages." },
              { title: "Constraint Detection", desc: "Identify barriers stopping your next stage of scaling." },
              { title: "Execution Roadmap", desc: "Action-ready guides for your team." }
            ].map(({ title, desc }) => (
              <div key={title} className={`p-5 rounded-xl border ${d ? "bg-[#161b22]/50 border-white/5" : "bg-white border-gray-200 shadow-sm"}`}>
                <CheckCircle2 className="w-5 h-5 text-teal-400 mb-2" />
                <h4 className={`text-sm font-bold mb-1.5 ${d ? "text-white" : "text-gray-900"}`}>{title}</h4>
                <p className={`text-[11px] leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before You Start - How to Answer (Warning Highlights) ── */}
      <section className={`py-20 border-t ${d ? "bg-[#161b22]/40 border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className={`text-2xl sm:text-3xl font-black ${d ? "text-white" : "text-gray-900"}`}>
              Before You Start - How to Answer
            </h2>
            <p className={`text-xs sm:text-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
              Read carefully to ensure the diagnostic engine yields optimal insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Reality check card */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
              <div className="space-y-4">
                <p className="text-xs font-black uppercase text-[#f97316] tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Answer based on actual operations
                </p>
                <p className={`text-xs leading-relaxed ${d ? "text-gray-300" : "text-gray-600"}`}>
                  Do not select answers based on what you <span className="italic font-bold">plan</span> to do or what you <span className="italic font-bold">wish</span> was working. The tool requires a picture of your current state.
                </p>
              </div>
              <div className={`mt-6 p-4 rounded-xl text-xs font-semibold ${d ? "bg-[#161b22] text-teal-400" : "bg-teal-50 text-teal-700"}`}>
                💡 Be honest &mdash; even if the answer is uncomfortable. Clarity starts with honesty.
              </div>
            </div>

            {/* Assessment Goal card */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
              <div className="space-y-4">
                <p className="text-xs font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  Your Single Goal: Clear Vision
                </p>
                <p className={`text-xs leading-relaxed ${d ? "text-gray-300" : "text-gray-600"}`}>
                  This is not a test to impress, justify actions, or guess results. It is an internal mirror designed to align your model for future scaling.
                </p>
              </div>
              <div className={`mt-6 p-4 rounded-xl text-xs font-semibold ${d ? "bg-[#161b22] text-[#f97316]" : "bg-orange-50 text-[#ea6c0a]"}`}>
                🛡 Don’t overthink &mdash; go with the choice that feels closest to your actual reality.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Ready? CTA Banner ── */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
        <h2 className={`text-3xl sm:text-5xl font-black ${d ? "text-white" : "text-gray-900"}`}>Ready?</h2>
        <p className={`text-sm sm:text-base max-w-md mx-auto ${d ? "text-gray-400" : "text-gray-600"}`}>
          Let&apos;s find out what is really happening inside your business.
        </p>
        <div className="pt-2">
          <Link href="/pages/generaltest" className="inline-flex items-center gap-2.5 px-12 py-5 rounded-2xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-base font-black uppercase tracking-wider transition-all shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95">
            Start Assessment <ArrowRight className="w-5.5 h-5.5" />
          </Link>
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