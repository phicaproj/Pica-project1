"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
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
  Eye,
} from "lucide-react";

export default function AboutPage() {
  const [dark, setDark] = useState(true);
  const d = dark;

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/pages/about", active: true },
    { label: "Pricing", href: "/pages/pricing" },
  ];

  return (
    <div className={d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}>
      <Navbar dark={dark} setDark={setDark} navItems={navItems} isFixed={true} />

      {/* ── Hero ── */}
      <section className={`relative pt-32 pb-20 px-8 overflow-hidden ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
        {d && <div className="absolute top-20 right-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />}
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-teal-400 uppercase mb-4">Architectural Intelligence</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              We Help Businesses<br />
              Understand Themselves<br />
              Before They Try to<br />
              Grow
            </h1>
            <p className={`text-sm leading-relaxed mb-8 max-w-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
              PICA is a structured diagnostic system designed to replace guesswork with analytical clarity. Scale on a foundation of truth, not assumptions.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/questions" className="px-6 py-3 rounded-lg bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold transition">
                Start Assessment
              </Link>
              <Link href="#" className={`px-6 py-3 rounded-lg text-sm font-semibold border transition ${d ? "border-white/20 text-white hover:bg-white/5" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
                View Framework
              </Link>
            </div>
          </div>

          {/* Right — chart/dashboard with about1 image */}
          <div className={`rounded-2xl border overflow-hidden ${d ? "bg-[#161b22] border-white/10" : "bg-gray-100 border-gray-200"}`} style={{ minHeight: "300px" }}>
            <Image
              src="/images/about1.png"
              alt="Analytics Dashboard"
              width={500}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Misdiagnosis Section ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#0d1117]" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-3xl font-bold mb-3 ${d ? "text-white" : "text-gray-900"}`}>
            Most Businesses Are Not Broken —<br />They Are Misdiagnosed
          </h2>
          <p className={`text-sm mb-12 ${d ? "text-gray-400" : "text-gray-600"}`}>
            Growth failure is rarely a lack of effort; it's a lack of clarity in the initial assessment.
          </p>
          <div className="grid grid-cols-3 gap-8">
            {[
              { icon: <AlertCircle className="w-7 h-7 text-teal-400" />, title: "Misdiagnosis", desc: "Treating symptoms (low sales) instead of the root cause (market misalignment or poor operations)." },
              { icon: <HelpCircle className="w-7 h-7 text-teal-400" />, title: "Guesswork Decisions", desc: "Relying on 'gut feeling' in complex scaling environments leads to expensive structural dials." },
              { icon: <Layers className="w-7 h-7 text-teal-400" />, title: "Surface-Level Solutions", desc: "Implementing software or hiring staff to fix problems that require foundational restructuring." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className={`p-6 rounded-2xl border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                <div className="mb-4">{icon}</div>
                <h3 className={`text-base font-bold mb-2 ${d ? "text-white" : "text-gray-900"}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote Section ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#161b22]" : "bg-gray-50"}`}>
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className={`text-4xl font-extrabold italic leading-tight mb-8 ${d ? "text-white" : "text-gray-900"}`}>
            "You cannot fix what you<br />
            cannot <span className="text-[#f97316] not-italic">see.</span>"
          </blockquote>
          <div className="flex items-center justify-center gap-12">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center text-white text-xs font-bold mx-auto mb-2">01</div>
              <p className={`text-xs font-semibold uppercase tracking-widest ${d ? "text-gray-400" : "text-gray-600"}`}>Clarity Before Strategy</p>
            </div>
            <div className="w-px h-8 bg-gray-600" />
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold mx-auto mb-2">02</div>
              <p className={`text-xs font-semibold uppercase tracking-widest ${d ? "text-gray-400" : "text-gray-600"}`}>Diagnosis Before Growth</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PICA Ecosystem ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#0d1117]" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className={`text-3xl font-bold mb-3 ${d ? "text-white" : "text-gray-900"}`}>The PICA Ecosystem</h2>
          <p className={`text-sm ${d ? "text-gray-400" : "text-gray-600"}`}>A unified framework that transforms raw business energy into structured intelligence.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-4">
          {[
            { letter: "P", color: "text-[#f97316]", title: "Pain-point",      desc: "Isolating the core friction points that drain resources and energy." },
            { letter: "I", color: "text-[#f97316]", title: "Identification",  desc: "Pinpointing the structural root causes within the business architecture." },
            { letter: "C", color: "text-[#f97316]", title: "Classification",  desc: "Sorting obstacles into the 7 architectural pillars for targeted action." },
            { letter: "A", color: "text-[#f97316]", title: "Assessment",      desc: "Validating solutions through data-driven scoring and feedback loops." },
          ].map(({ letter, color, title, desc }, i) => (
            <div key={letter} className="flex items-start gap-2">
              <div className={`flex-1 p-5 rounded-2xl border text-center ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                <p className={`text-4xl font-extrabold mb-2 ${color}`}>{letter}</p>
                <p className={`text-sm font-bold mb-2 ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
              </div>
              {i < 3 && <ChevronRight className="w-5 h-5 text-gray-600 mt-8 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── 3-Layer Intelligence Model ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#161b22]" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-16 items-center">
          <div>
            <h2 className={`text-3xl font-bold mb-4 ${d ? "text-white" : "text-gray-900"}`}>The 3-Layer Intelligence Model</h2>
            <p className={`text-sm leading-relaxed mb-8 ${d ? "text-gray-400" : "text-gray-600"}`}>
              We don't just give you a dashboard; we build a layered hierarchy of understanding.
            </p>
            <div className="space-y-5">
              {[
                { num: "1A", color: "bg-teal-500",    title: "Awareness",    desc: "Full visibility across all operational channels. No more dark spots." },
                { num: "1B", color: "bg-[#f97316]",   title: "Diagnosis",    desc: "Automated identification of structural inefficiencies and risk factors." },
                { num: "2B", color: "bg-red-500",      title: "Intelligence", desc: "Predictive modeling for future growth and risk mitigation." },
              ].map(({ num, color, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{num}</div>
                  <div>
                    <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                    <p className={`text-xs ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pyramid graphic */}
          <div className="flex flex-col gap-2">
            {[
              { label: "INTELLIGENCE", bg: "bg-[#8b1a1a]",  h: "py-6"  },
              { label: "DIAGNOSIS",    bg: "bg-[#f97316]",   h: "py-8"  },
              { label: "AWARENESS",    bg: "bg-[#1a3a4a]",   h: "py-10" },
            ].map(({ label, bg, h }) => (
              <div key={label} className={`${bg} ${h} rounded-xl flex items-center justify-center`}>
                <p className="text-white text-sm font-bold tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 Pillars of Business Logic ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#0d1117]" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className={`text-3xl font-bold ${d ? "text-white" : "text-gray-900"}`}>The 7 Pillars of Business Logic</h2>
        </div>
        <div className="max-w-5xl mx-auto flex justify-between gap-4">
          {[
            { icon: <Users className="w-6 h-6 text-teal-400" />,       label: "Leadership"  },
            { icon: <DollarSign className="w-6 h-6 text-teal-400" />,  label: "Finance"     },
            { icon: <Settings className="w-6 h-6 text-teal-400" />,    label: "Operations"  },
            { icon: <ShoppingCart className="w-6 h-6 text-teal-400"/>, label: "Marketing"   },
            { icon: <Users className="w-6 h-6 text-teal-400" />,       label: "HR"          },
            { icon: <TrendingUp className="w-6 h-6 text-teal-400" />,  label: "Strategy"    },
            { icon: <Briefcase className="w-6 h-6 text-teal-400" />,   label: "IP"          },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              {icon}
              <p className={`text-xs font-medium uppercase tracking-wider ${d ? "text-gray-400" : "text-gray-600"}`}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Path to Clarity ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#161b22]" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-3xl font-bold mb-12 ${d ? "text-white" : "text-gray-900"}`}>The Path to Clarity</h2>
          <div className="grid grid-cols-4 gap-8">
            {[
              { step: "1. Take Assessment",  desc: "A 15-minute precision inquiry into your current operations."                          },
              { step: "2. Get Scored",       desc: "Our engine evaluates your data against the 7-pillar framework."                       },
              { step: "3. Receive Report",   desc: "A comprehensive architectural map of your business health."                           },
              { step: "4. Take Action",      desc: "Execute on specific, prioritized steps for structured growth."                        },
            ].map(({ step, desc }, i) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-teal-400 flex-shrink-0 mt-1" />
                <div>
                  <p className={`text-sm font-bold mb-1 ${d ? "text-white" : "text-gray-900"}`}>{step}</p>
                  <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Business Types ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#0d1117]" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-8">
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
            <div key={title} className={`rounded-2xl p-8 border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
              <h3 className={`text-xl font-bold mb-3 ${accent === "teal" ? "text-teal-400" : "text-[#f97316]"}`}>{title}</h3>
              <p className={`text-sm leading-relaxed mb-6 ${d ? "text-gray-400" : "text-gray-600"}`}>{subtitle}</p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${accent === "teal" ? "text-teal-400" : "text-[#f97316]"}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Built on Structured Logic ── */}
      <section className={`py-20 px-8 ${d ? "bg-[#161b22]" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-16 items-start mb-12">
            <div>
              <h2 className={`text-3xl font-bold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Built on Structured Logic, Not Hype</h2>
              <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
                PICA was born from the observation of thousands of business failures. Our methodology is a synthesis of industrial logic and modern data science.
              </p>
            </div>
            <div className="flex gap-8">
              <div className={`flex-1 rounded-2xl p-6 border text-center ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
                <p className="text-3xl font-extrabold text-teal-400 mb-1">94%</p>
                <p className={`text-xs ${d ? "text-gray-400" : "text-gray-600"}`}>Accuracy Rate</p>
              </div>
              <div className={`flex-1 rounded-2xl p-6 border text-center ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
                <p className="text-3xl font-extrabold text-teal-400 mb-1">500+</p>
                <p className={`text-xs ${d ? "text-gray-400" : "text-gray-600"}`}>Diagnoses</p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { quote: "PICA revealed that our marketing wasn't failing—our operations couldn't support the leads. We fired the foundation and doubled revenue in 6 months.", name: "Amara Okafor" },
              { quote: "The clarity PICA provided was jarring but necessary. We were building on sand. Today, every decision we make is backed by the 3-Layer model.", name: "Kofi Mensah" },
            ].map(({ quote, name }) => (
              <div key={name} className={`rounded-2xl p-6 border ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
                <p className={`text-sm italic leading-relaxed mb-4 ${d ? "text-gray-300" : "text-gray-700"}`}>"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                    {name.charAt(0)}
                  </div>
                  <p className={`text-sm font-semibold ${d ? "text-white" : "text-gray-900"}`}>{name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`py-20 px-8 text-center ${d ? "bg-[#0d1117]" : "bg-white"}`}>
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-4xl font-extrabold mb-4 ${d ? "text-white" : "text-gray-900"}`}>
            Understand your business before<br />you try to grow it.
          </h2>
          <p className={`text-sm mb-8 ${d ? "text-gray-400" : "text-gray-600"}`}>
            The diagnostic assessment takes 15 minutes. The clarity it provides lasts a lifetime.
          </p>
          <Link href="/questions" className="inline-block px-8 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition">
            Start Your Free Assessment
          </Link>
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