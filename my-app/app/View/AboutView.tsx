"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import Image from "next/image";
import {
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronRight,
  CheckCircle,
  Users,
  Briefcase,
  ShoppingCart,
  DollarSign,
  Settings,
  Shield,
  MapPin,
  TrendingUp,
  Quote,
} from "lucide-react";

export default function AboutPage() {
  const { dark } = useTheme();
  const d = dark;

  return (
    <div className={`antialiased min-h-screen transition-colors duration-300 ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>

      {/* ── Hero ── */}
      <section className={`relative min-h-[calc(100vh-50px)] flex items-center py-12 lg:py-16 px-6 lg:px-8 overflow-hidden ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
        {d && <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full items-center relative z-10">
          <div className="flex flex-col justify-center space-y-6 md:space-y-7 md:pr-6">
            <div className="inline-flex self-start items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Strategic Intelligence
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight">
              We Help Businesses <br />
              Understand Themselves <br />
              <span className="text-teal-400">Before</span> They Try to Grow
            </h1>
            <p className={`text-base md:text-lg leading-relaxed max-w-lg ${d ? "text-gray-400" : "text-gray-600"}`}>
              PICA is a structured diagnostic system designed to replace guesswork with analytical clarity. Scale on a foundation of truth, not assumptions.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link href="/pages/freescan" className="px-8 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-base font-bold transition-all text-center shadow-lg shadow-orange-500/20 hover:scale-[1.03] active:scale-95">
                Start Free Scan
              </Link>
              <Link href="#pica-ecosystem" className={`px-8 py-4 rounded-xl text-base font-bold border transition-all text-center hover:scale-[1.03] active:scale-95 ${d ? "border-white/10 text-white hover:bg-white/5" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
                View Framework
              </Link>
            </div>
          </div>

          {/* Right — chart/dashboard with about1 image */}
          <div className="relative w-full h-[320px] sm:h-[480px] lg:h-[580px]">
            <Image
              src="/images/about1.png"
              alt="Analytics Dashboard Preview"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </section>

      {/* ── Misdiagnosis Section ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-100"}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-3">
            <h2 className={`text-3xl md:text-4xl font-black leading-tight ${d ? "text-white" : "text-gray-900"}`}>
              Most Businesses Are Not Broken — <br className="hidden md:inline" /> They Are Misdiagnosed
            </h2>
            <p className={`text-sm md:text-base ${d ? "text-gray-400" : "text-gray-600"}`}>
              Growth failure is rarely a lack of effort; it&apos;s a lack of clarity in the initial assessment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: <AlertCircle className="w-6 h-6 text-teal-400" />, title: "Misdiagnosis", desc: "Treating symptoms (low sales) instead of the root cause (market misalignment or poor operations)." },
              { icon: <HelpCircle className="w-6 h-6 text-teal-400" />, title: "Guesswork Decisions", desc: "Relying on 'gut feeling' in complex scaling environments leads to expensive structural dials." },
              { icon: <Layers className="w-6 h-6 text-teal-400" />, title: "Surface-Level Solutions", desc: "Implementing software or hiring staff to fix problems that require foundational restructuring." },
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

      {/* ── Quote Section ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <blockquote className={`text-3xl md:text-5xl font-black italic leading-tight ${d ? "text-white" : "text-gray-900"}`}>
            &quot;You cannot fix what you <br />
            cannot <span className="text-[#f97316] not-italic">see.</span>&quot;
          </blockquote>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12 pt-4">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center text-white text-xs font-bold mx-auto">01</div>
              <p className={`text-xs font-bold uppercase tracking-widest ${d ? "text-gray-400" : "text-gray-600"}`}>Clarity Before Strategy</p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-gray-600/30" />
            <div className="text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold mx-auto">02</div>
              <p className={`text-xs font-bold uppercase tracking-widest ${d ? "text-gray-400" : "text-gray-600"}`}>Diagnosis Before Growth</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PICA Ecosystem ── */}
      <section id="pica-ecosystem" className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-100"}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>The PICA Ecosystem</h2>
            <p className={`text-sm ${d ? "text-gray-400" : "text-gray-600"}`}>A unified framework that transforms raw business energy into structured intelligence.</p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { letter: "P", color: "text-[#f97316]", title: "Pain-point",      desc: "Isolating the core friction points that drain resources and energy." },
              { letter: "I", color: "text-[#f97316]", title: "Identification",  desc: "Pinpointing the structural root causes within the business architecture." },
              { letter: "C", color: "text-[#f97316]", title: "Classification",  desc: "Sorting obstacles into the 7 architectural pillars for targeted action." },
              { letter: "A", color: "text-[#f97316]", title: "Assessment",      desc: "Validating solutions through data-driven scoring and feedback loops." },
            ].map(({ letter, color, title, desc }, i) => (
              <div key={letter} className="flex items-start gap-2 h-full">
                <div className={`flex-1 p-6 rounded-2xl border text-center h-full transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#161b22] border-white/10 hover:border-teal-500/30" : "bg-gray-50 border-gray-200 hover:shadow-md"}`}>
                  <p className={`text-3xl md:text-5xl font-black mb-3 ${color}`}>{letter}</p>
                  <p className={`text-sm font-extrabold mb-2 ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                  <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                </div>
                {i < 3 && <ChevronRight className="hidden lg:block w-5 h-5 text-gray-600 mt-16 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3-Layer Intelligence Model ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-6">
            <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>The 3-Layer Intelligence Model</h2>
            <p className={`text-sm md:text-base leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
              We don&apos;t just give you a dashboard; we build a layered hierarchy of understanding.
            </p>
            <div className="space-y-5">
              {[
                { num: "2B", color: "bg-red-500",      title: "Intelligence", desc: "Predictive modeling for future growth and risk mitigation." },
                { num: "1B", color: "bg-[#f97316]",   title: "Diagnosis",    desc: "Automated identification of structural inefficiencies and risk factors." },
                { num: "1A", color: "bg-teal-500",    title: "Awareness",    desc: "Full visibility across all operational channels. No more dark spots." },
              ].map(({ num, color, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>{num}</div>
                  <div>
                    <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                    <p className={`text-xs mt-0.5 ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stacked equal-sized blocks */}
          <div className="flex flex-col items-center gap-3 w-full">
            {[
              { label: "INTELLIGENCE (2B)", bg: "bg-gradient-to-r from-red-500 to-red-600", width: "w-full max-w-[400px]", py: "py-5 md:py-6" },
              { label: "DIAGNOSIS (1B)",    bg: "bg-gradient-to-r from-orange-500 to-orange-600", width: "w-full max-w-[400px]", py: "py-5 md:py-6" },
              { label: "AWARENESS (1A)",    bg: "bg-gradient-to-r from-teal-500 to-teal-600", width: "w-full max-w-[400px]", py: "py-5 md:py-6" },
            ].map(({ label, bg, width, py }) => (
              <div key={label} className={`${bg} ${py} ${width} rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.03] cursor-default text-center`}>
                <p className="text-white text-xs md:text-sm font-black tracking-widest px-4">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 Pillars of Business Logic ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-100"}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>The 7 Pillars of Business Logic</h2>
          </div>
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6 md:gap-8">
            {[
              { icon: <Users className="w-6 h-6 text-teal-400" />,       label: "Leadership"  },
              { icon: <DollarSign className="w-6 h-6 text-teal-400" />,  label: "Finance"     },
              { icon: <Settings className="w-6 h-6 text-teal-400" />,    label: "Operations"  },
              { icon: <ShoppingCart className="w-6 h-6 text-teal-400"/>, label: "Marketing"   },
              { icon: <Users className="w-6 h-6 text-teal-400" />,       label: "HR"          },
              { icon: <TrendingUp className="w-6 h-6 text-teal-400" />,  label: "Strategy"    },
              { icon: <Briefcase className="w-6 h-6 text-teal-400" />,   label: "IP"          },
            ].map(({ icon, label }) => (
              <div key={label} className={`flex flex-col items-center gap-3 p-5 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#161b22] border-white/10 hover:border-teal-500/30" : "bg-gray-50 border-gray-200 hover:shadow-md"}`}>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">{icon}</div>
                <p className={`text-xs font-bold uppercase tracking-wider ${d ? "text-gray-300" : "text-gray-700"}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Path to Clarity ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>The Path to Clarity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "1. Take Assessment",  desc: "A 15-minute precision inquiry into your current operations."                          },
              { step: "2. Get Scored",       desc: "Our engine evaluates your data against the 7-pillar framework."                       },
              { step: "3. Receive Report",   desc: "A comprehensive architectural map of your business health."                           },
              { step: "4. Take Action",      desc: "Execute on specific, prioritized steps for structured growth."                        },
            ].map(({ step, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="w-3.5 h-3.5 rounded-full bg-teal-400 flex-shrink-0 mt-1 shadow-lg shadow-teal-400/50" />
                <div>
                  <p className={`text-base font-bold mb-1.5 ${d ? "text-white" : "text-gray-900"}`}>{step}</p>
                  <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Business Types ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-100"}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: "Small Businesses",
              subtitle: "Ideal for founders feeling the 'complexity wall.' We help you modularize your foundation so you can scale without breaking.",
              items: ["Process Audit", "Founder Freedom Roadmap", "Unit Economics Clarity"],
              accent: "teal",
            },
            {
              title: "Medium Businesses",
              subtitle: "For established teams suffering from departmental silos. We provide the cross-pillar intelligence to optimize efficiency.",
              items: ["Silo Integration", "Executive Alignment", "Scale Prediction"],
              accent: "orange",
            },
          ].map(({ title, subtitle, items, accent }) => (
            <div key={title} className={`group rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${d ? "bg-[#161b22] border-white/10 hover:border-teal-500/30" : "bg-gray-50 border-gray-200 hover:shadow-md hover:border-teal-500/30"}`}>
              <h3 className={`text-2xl font-black mb-3 ${accent === "teal" ? "text-teal-400" : "text-[#f97316]"}`}>{title}</h3>
              <p className={`text-sm leading-relaxed mb-6 ${d ? "text-gray-400" : "text-gray-600"}`}>{subtitle}</p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-400">
                    <CheckCircle className={`w-4.5 h-4.5 flex-shrink-0 ${accent === "teal" ? "text-teal-400" : "text-[#f97316]"}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Built on Structured Logic ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? "bg-[#161b22] border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-4">
              <h2 className={`text-3xl md:text-4xl font-black ${d ? "text-white" : "text-gray-900"}`}>Built on Structured Logic, Not Hype</h2>
              <p className={`text-sm md:text-base leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                PICA was born from the observation of thousands of business failures. Our methodology is a synthesis of industrial logic and modern data science.
              </p>
            </div>
            <div className="flex gap-6 md:gap-8">
              <div className={`flex-1 rounded-2xl p-6 border text-center transition-all duration-200 hover:-translate-y-0.5 ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                <p className="text-3xl md:text-4xl font-black text-teal-400 mb-1">94%</p>
                <p className={`text-xs font-bold uppercase tracking-wider ${d ? "text-gray-400" : "text-gray-500"}`}>Accuracy Rate</p>
              </div>
              <div className={`flex-1 rounded-2xl p-6 border text-center transition-all duration-200 hover:-translate-y-0.5 ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                <p className="text-3xl md:text-4xl font-black text-teal-400 mb-1">500+</p>
                <p className={`text-xs font-bold uppercase tracking-wider ${d ? "text-gray-400" : "text-gray-500"}`}>Diagnoses</p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {[
              { quote: "PICA revealed that our marketing wasn't failing—our operations couldn't support the leads. We fixed the foundation and doubled revenue in 6 months.", name: "Amara Okafor" },
              { quote: "The clarity PICA provided was jarring but necessary. We were building on sand. Today, every decision we make is backed by the 3-Layer model.", name: "Kofi Mensah" },
            ].map(({ quote, name }) => (
              <div key={name} className={`group rounded-2xl p-6 border relative ${d ? "bg-[#0d1117] border-white/10 hover:border-teal-500/30" : "bg-white border-gray-200 shadow-sm hover:shadow-md"}`}>
                <Quote className="absolute right-6 top-6 h-8 w-8 text-teal-400/10" />
                <p className={`text-sm italic leading-relaxed mb-4 relative z-10 ${d ? "text-gray-300" : "text-gray-700"}`}>&quot;{quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-black">
                    {name.charAt(0)}
                  </div>
                  <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>{name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`py-20 md:py-28 px-6 lg:px-8 text-center border-t ${d ? "bg-[#0d1117] border-white/5" : "bg-white border-gray-100"}`}>
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className={`text-3xl md:text-5xl font-black leading-tight ${d ? "text-white" : "text-gray-900"}`}>
            Understand your business <br /> before you try to grow it.
          </h2>
          <p className={`text-sm md:text-base ${d ? "text-gray-400" : "text-gray-600"}`}>
            The diagnostic assessment takes 15 minutes. The clarity it provides lasts a lifetime.
          </p>
          <div className="pt-2">
            <Link href="/pages/freescan" className="inline-block px-10 py-5 rounded-2xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold uppercase tracking-wider transition-all shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95">
              Start Free Scan
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
              { label: "Contact Support", href: "#" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className={`transition hover:opacity-70 ${d ? "text-gray-400" : "text-gray-500"}`}>{label}</Link>
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