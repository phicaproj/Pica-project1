"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sun,
  Moon,
  Clock,
  CheckSquare,
  FileText,
  Lock,
  MapPin,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader,
  BarChart2,
} from "lucide-react";

// ─── Questions ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 1, pillar: "Finance", text: "How well do you track and manage your business cash flow?", insight: "Effective cash flow tracking is the backbone of sustainable business growth. It's about knowing where every dollar goes." },
  { id: 2, pillar: "Finance", text: "How consistent is your monthly revenue stream?", insight: "Revenue consistency is a key indicator of business model strength and market fit." },
  { id: 3, pillar: "Finance", text: "How well do you manage your business debt and liabilities?", insight: "Healthy debt management separates scaling businesses from stagnating ones." },
  { id: 4, pillar: "Operations", text: "How efficient are your core business processes and workflows?", insight: "Operational efficiency directly impacts profit margins and customer satisfaction." },
  { id: 5, pillar: "Operations", text: "How well do you document and standardize your processes?", insight: "Documented processes are the foundation of scalable businesses." },
  { id: 6, pillar: "Marketing", text: "How effective is your customer acquisition strategy?", insight: "Predictable customer acquisition is the engine of sustainable growth." },
  { id: 7, pillar: "Marketing", text: "How well do you retain existing customers?", insight: "Retention is 5x cheaper than acquisition. High retention = high business value." },
  { id: 8, pillar: "Human Resources", text: "How well-structured is your team and organizational hierarchy?", insight: "Clear structure prevents role confusion and drives accountability." },
  { id: 9, pillar: "Human Resources", text: "How effectively do you recruit and onboard new team members?", insight: "Strong onboarding reduces time-to-productivity and improves retention." },
  { id: 10, pillar: "Leadership", text: "How clearly defined is your long-term business vision and strategy?", insight: "Vision clarity determines decision quality at every level of the organization." },
  { id: 11, pillar: "Leadership", text: "How effectively do you make and implement key business decisions?", insight: "Decision-making speed and quality separate high-growth companies from the rest." },
  { id: 12, pillar: "Legal", text: "How compliant is your business with local regulations and tax laws?", insight: "Legal compliance is not optional — it's a foundation for investor readiness." },
  { id: 13, pillar: "Legal", text: "How well-protected are your business assets and intellectual property?", insight: "IP protection is a critical but often overlooked business asset." },
  { id: 14, pillar: "Product-Market", text: "How well does your product/service solve a real market problem?", insight: "Product-market fit is the single most important factor in startup survival." },
  { id: 15, pillar: "Product-Market", text: "How well do you understand your target customer's needs and pain points?", insight: "Deep customer understanding is what separates market leaders from followers." },
];

const OPTIONS = ["Very Poor", "Poor", "Average", "Good", "Excellent"];
const OPTION_LETTERS = ["A", "B", "C", "D", "E"];
const INDUSTRIES = ["Technology & SaaS", "Retail & E-commerce", "Healthcare", "Finance & Banking", "Agriculture", "Manufacturing", "Logistics", "Education", "Real Estate", "Other"];

type Step = "intro" | "profile" | "questions" | "processing";

// ─── Shared Navbar ─────────────────────────────────────────────────────────────
function Navbar({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const d = dark;
  return (
    <nav className={`flex items-center justify-between px-8 py-1 border-b ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
      <Link href="/" className="flex items-center">
        <Image
          src="/images/logo.png"
          alt="Beauvision"
          width={120}
          height={32}
          className="h-auto"
        />
      </Link>
      <div className="flex items-center gap-8">
        {[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "General Test", href: "/questions", active: true },
          { label: "Product", href: "/product" },
        ].map(({ label, href, active }) => (
          <Link key={label} href={href}
            className={`text-sm font-medium transition ${active ? "text-[#f97316] border-b border-[#f97316] pb-0.5" : d ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
            {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setDark(!d)} className={`p-2 rounded-full transition ${d ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          {d ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link href="/auth/signup" className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#f97316] hover:bg-[#ea6c0a] text-white transition">
          Get Started
        </Link>
      </div>
    </nav>
  );
}

// ─── Step 1: Intro ─────────────────────────────────────────────────────────────
function IntroStep({ dark, onStart }: { dark: boolean; onStart: () => void }) {
  const d = dark;
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-8 ${d ? "bg-black" : "bg-gray-50"}`}>
      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${d ? "bg-[#1a2235]" : "bg-gray-200"}`}
        style={{ boxShadow: d ? "0 0 40px rgba(249,115,22,0.2)" : "none" }}>
        <BarChart2 className="w-7 h-7 text-[#f97316]" />
      </div>

      <h1 className={`text-4xl font-extrabold text-center mb-4 ${d ? "text-white" : "text-gray-900"}`}>
        Let's Understand Your Business
      </h1>
      <p className={`text-base text-center mb-12 max-w-md ${d ? "text-gray-400" : "text-gray-600"}`}>
        This quick assessment will help identify strengths, risks, and opportunities across your business.
      </p>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-12 w-full max-w-2xl">
        {[
          { icon: <Clock className="w-4 h-4 text-[#00ffaa]" />, label: "DURATION", value: "Takes 5-10 minutes" },
          { icon: <CheckSquare className="w-4 h-4 text-[#00ffaa]" />, label: "PREREQUISITES", value: "No prior preparation needed" },
          { icon: <FileText className="w-4 h-4 text-[#00ffaa]" />, label: "OUTPUT", value: "You'll receive a summary at the end" },
        ].map(({ icon, label, value }) => (
          <div key={label} className={`rounded-2xl p-5 border ${d ? "bg-[#161b22] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
            <div className="flex items-center gap-2 mb-3">
              {icon}
              <span className={`text-xs font-bold uppercase tracking-widest ${d ? "text-gray-400" : "text-gray-500"}`}>{label}</span>
            </div>
            <p className={`text-sm font-medium ${d ? "text-white" : "text-gray-900"}`}>{value}</p>
          </div>
        ))}
      </div>

      <button onClick={onStart}
        className="px-12 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-gray-900 text-base font-bold transition mb-4">
        Start Assessment
      </button>
      <div className={`flex items-center gap-2 text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>
        <Lock className="w-3 h-3" />
        Your responses are confidential and secure.
      </div>
    </div>
  );
}

// ─── Step 2: Business Profile ──────────────────────────────────────────────────
function ProfileStep({ dark, onContinue, onBack }: { dark: boolean; onContinue: () => void; onBack: () => void }) {
  const d = dark;
  const [years, setYears] = useState<"0-2" | "3-10" | "10+">("3-10");
  const [revenue, setRevenue] = useState<"under" | "mid" | "enterprise">("mid");
  const [industry, setIndustry] = useState("Technology & SaaS");
  const [industryOpen, setIndustryOpen] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-8 py-16 ${d ? "bg-black" : "bg-gray-50"}`}>
      <h1 className={`text-5xl font-extrabold text-center mb-4 ${d ? "text-white" : "text-gray-900"}`}>
        Tell Us About Your<br />Business
      </h1>
      <p className={`text-base text-center mb-12 max-w-lg ${d ? "text-gray-400" : "text-gray-600"}`}>
        Help our intelligence systems categorize your operation for a personalized assessment journey.
      </p>

      {/* Form card */}
      <div className={`w-full max-w-2xl rounded-3xl p-8 border relative ${d ? "bg-[#161b22] border-white/10" : "bg-white border-gray-200 shadow-lg"}`}>

        {/* Smart Classification badge */}
        <div className="absolute top-6 right-6 bg-[#1e2d1e] border border-[#00ffaa]/30 rounded-xl px-3 py-2 text-xs">
          <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-0.5">Smart Classification</p>
          <p className="text-[#00ffaa] font-bold flex items-center gap-1">✦ Small Business</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Business Name */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Business Name</label>
            <input type="text" placeholder="e.g. PICA Systems"
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${d ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-400"}`} />
          </div>

          {/* Industry dropdown */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Industry</label>
            <div className="relative">
              <button onClick={() => setIndustryOpen(!industryOpen)}
                className={`w-full px-4 py-3 rounded-xl border text-sm flex items-center justify-between transition ${d ? "bg-[#0d1117] border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}>
                {industry}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {industryOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border z-50 overflow-hidden ${d ? "bg-[#1a2235] border-white/10" : "bg-white border-gray-200 shadow-lg"}`}>
                  {INDUSTRIES.map((ind) => (
                    <button key={ind} onClick={() => { setIndustry(ind); setIndustryOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition ${d ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"}`}>
                      {ind}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Years + Staff */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Years in Operation</label>
            <div className="flex gap-2">
              {(["0-2", "3-10", "10+"] as const).map((y) => (
                <button key={y} onClick={() => setYears(y)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${years === y ? "bg-[#00ffaa]/10 border-[#00ffaa] text-[#00ffaa]" : d ? "border-white/10 text-gray-400 hover:border-white/20" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Staff Size</label>
            <input type="number" placeholder="Number of employees"
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${d ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-400"}`} />
          </div>
        </div>

        {/* Location */}
        <div className="mb-6">
          <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Primary Business Location</label>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${d ? "bg-[#0d1117] border-white/10" : "bg-gray-50 border-gray-200"}`}>
            <MapPin className="w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Lagos, Nigeria" defaultValue="Lagos, Nigeria"
              className={`flex-1 bg-transparent text-sm outline-none ${d ? "text-white placeholder-gray-600" : "text-gray-900 placeholder-gray-400"}`} />
          </div>
        </div>

        {/* Revenue Range */}
        <div className="mb-8">
          <label className={`text-xs font-bold uppercase tracking-widest block mb-3 ${d ? "text-gray-400" : "text-gray-500"}`}>Annual Revenue Range (₦)</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "under", label: "Under", value: "₦5M" },
              { key: "mid", label: "Mid-Range", value: "₦5M - ₦50M" },
              { key: "enterprise", label: "Enterprise", value: "₦50M+" },
            ].map(({ key, label, value }) => (
              <button key={key} onClick={() => setRevenue(key as any)}
                className={`p-4 rounded-xl border text-left transition ${revenue === key ? "border-[#00ffaa] bg-[#00ffaa]/5" : d ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:bg-gray-50"}`}>
                <p className={`text-xs mb-1 ${revenue === key ? "text-[#00ffaa]" : d ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                <p className={`text-lg font-bold ${d ? "text-white" : "text-gray-900"}`}>{value}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button onClick={onBack}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition ${d ? "border-white/10 text-gray-400 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          <button onClick={onContinue}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-gray-900 text-sm font-bold transition">
            Continue to Assessment <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Question ──────────────────────────────────────────────────────────
function QuestionStep({ dark, current, answers, onAnswer, onNext, onPrev }: {
  dark: boolean;
  current: number;
  answers: (number | null)[];
  onAnswer: (idx: number) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const d = dark;
  const q = QUESTIONS[current];
  const progress = ((current + 1) / QUESTIONS.length) * 100;

  return (
    <div className={`min-h-screen flex flex-col ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
      <Navbar dark={dark} setDark={() => { }} />

      <div className="flex-1 px-12 py-8">
        {/* Progress bar */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#00ffaa] mb-1">Current Pillar</p>
            <p className={`text-xl font-bold ${d ? "text-white" : "text-gray-900"}`}>{q.pillar}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Progress</p>
            <p className={`text-sm ${d ? "text-gray-300" : "text-gray-700"}`}>
              Question <span className="font-bold text-[#f97316]">{current + 1}</span> of {QUESTIONS.length}
            </p>
          </div>
        </div>
        {/* Progress track */}
        <div className={`h-1 rounded-full mb-10 ${d ? "bg-white/10" : "bg-gray-200"}`}>
          <div className="h-full rounded-full bg-[#00ffaa] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Question + Image */}
        <div className="grid grid-cols-2 gap-12 items-start">
          <div>
            <h2 className={`text-3xl font-extrabold leading-tight mb-8 ${d ? "text-white" : "text-gray-900"}`}>
              {q.text}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {OPTIONS.map((opt, i) => {
                const selected = answers[current] === i;
                return (
                  <button key={opt} onClick={() => onAnswer(i)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition ${selected
                        ? "border-[#00ffaa] bg-[#00ffaa]/10"
                        : d ? "border-white/10 bg-[#161b22] hover:border-white/20" : "border-gray-200 bg-white hover:border-gray-300"
                      }`}>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${selected ? "bg-[#00ffaa] text-gray-900" : d ? "bg-[#243044] text-gray-400" : "bg-gray-100 text-gray-600"
                      }`}>{OPTION_LETTERS[i]}</span>
                    <span className={`text-sm font-medium ${selected ? d ? "text-white font-bold" : "text-gray-900 font-bold" : d ? "text-gray-300" : "text-gray-700"}`}>{opt}</span>
                    {selected && <CheckCircle className="w-5 h-5 text-[#00ffaa] ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel — image + insight */}
          <div>
            <div className={`rounded-2xl overflow-hidden mb-0 relative ${d ? "bg-[#161b22]" : "bg-gray-200"}`} style={{ minHeight: "320px" }}>
              <Image
                src="/images/assessques.png"
                alt="Question"
                width={500}
                height={320}
                className="w-full h-full object-cover"
              />
              {/* Insight overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                <p className={`text-xs italic mb-1 ${d ? "text-gray-200" : "text-gray-100"}`}>"{q.insight}"</p>
                <p className="text-xs font-bold text-[#f97316] uppercase tracking-wider">{q.pillar} Insight</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button onClick={onPrev} disabled={current === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition ${current === 0 ? "opacity-40 cursor-not-allowed" : ""
              } ${d ? "border-white/10 text-white hover:bg-white/5" : "border-gray-200 text-gray-700 hover:bg-gray-100"}`}>
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          <button className={`text-sm transition ${d ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>
            Save & Continue
          </button>
          <button onClick={onNext} disabled={answers[current] === null}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition ${answers[current] !== null
                ? "bg-[#f97316] hover:bg-[#ea6c0a] text-gray-900"
                : "bg-[#f97316]/40 text-gray-600 cursor-not-allowed"
              }`}>
            Next Question <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Processing ────────────────────────────────────────────────────────
function ProcessingStep({ dark }: { dark: boolean }) {
  const d = dark;
  const [step, setStep] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 2000);
    const t2 = setTimeout(() => setStep(3), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const steps = [
    { num: "01", title: "Calculating Health Score", desc: "Core metabolic indicators processed.", done: step > 1, active: step === 1 },
    { num: "02", title: "Mapping Risk Factors", desc: "Scanning market volatility vectors.", done: step > 2, active: step === 2 },
    { num: "03", title: "Synthesizing Insights", desc: "Final editorial layer pending.", done: step > 3, active: step === 3 },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
      <Navbar dark={dark} setDark={() => { }} />

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        {/* Neural Processing badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border mb-12 ${d ? "border-white/10 bg-[#161b22]" : "border-gray-200 bg-white"}`}>
          <span className="w-2 h-2 rounded-full bg-[#00ffaa] animate-pulse" />
          <span className={`text-xs font-bold uppercase tracking-widest ${d ? "text-gray-300" : "text-gray-600"}`}>Neural Processing Active</span>
        </div>

        {/* Spinning icon */}
        <div className="relative mb-12">
          {/* Outer dashed ring */}
          <div className="w-48 h-48 rounded-full border border-dashed border-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" style={{ animationDuration: "8s" }} />
          {/* Orange progress ring */}
          <div className="w-36 h-36 rounded-full border-4 border-[#f97316] flex items-center justify-center relative"
            style={{ boxShadow: "0 0 40px rgba(249,115,22,0.4)" }}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${d ? "bg-[#0d1117]" : "bg-gray-100"}`}>
              <BarChart2 className="w-8 h-8 text-[#f97316]" />
            </div>
            {/* Spinning orange arc overlay */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#f97316] animate-spin" style={{ animationDuration: "1.5s" }} />
          </div>
          {/* Dots */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00ffaa]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-500" />
        </div>

        <h2 className={`text-4xl font-extrabold mb-3 ${d ? "text-white" : "text-gray-900"}`}>
          Analyzing your business...
        </h2>
        <p className={`text-base text-center mb-16 max-w-lg ${d ? "text-gray-400" : "text-gray-600"}`}>
          Synthesizing data across 7 pillars to identify strengths, risks, and patterns.
        </p>

        {/* Step cards */}
        <div className="grid grid-cols-3 gap-5 w-full max-w-3xl">
          {steps.map(({ num, title, desc, done, active }) => (
            <div key={num} className={`rounded-2xl p-5 border transition ${active ? d ? "bg-[#1a2235] border-[#00ffaa]/40" : "bg-white border-teal-400 shadow"
                : done ? d ? "bg-[#161b22] border-white/10" : "bg-white border-gray-200"
                  : d ? "bg-[#161b22] border-white/5 opacity-50" : "bg-gray-100 border-gray-200 opacity-50"
              }`}>
              {/* Progress bar on active card */}
              {active && <div className="h-1 rounded-full bg-[#00ffaa] mb-4 w-3/4" />}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? "bg-[#00ffaa]" : active ? "bg-[#f97316]" : d ? "bg-[#243044]" : "bg-gray-300"
                  }`}>
                  {done
                    ? <CheckCircle className="w-4 h-4 text-gray-900" />
                    : active
                      ? <Loader className="w-4 h-4 text-gray-900 animate-spin" />
                      : <span className="text-xs font-bold text-gray-400">{num[1]}</span>
                  }
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${active ? "text-[#00ffaa]" : done ? d ? "text-gray-300" : "text-gray-600" : "text-gray-500"}`}>
                  {active ? "In Progress" : done ? `Step ${num}` : `Step ${num}`}
                </span>
              </div>
              <p className={`text-sm font-bold mb-1 ${active || done ? d ? "text-white" : "text-gray-900" : "text-gray-500"}`}>{title}</p>
              <p className={`text-xs ${active ? d ? "text-gray-300" : "text-gray-600" : "text-gray-500"}`}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function GeneralTestPage() {
  const [dark, setDark] = useState(true);
  const [step, setStep] = useState<Step>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null));

  const handleAnswer = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[current] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      setStep("processing");
    }
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  if (step === "intro") return <IntroStep dark={dark} onStart={() => setStep("profile")} />;
  if (step === "profile") return <ProfileStep dark={dark} onContinue={() => setStep("questions")} onBack={() => setStep("intro")} />;
  if (step === "questions") return (
    <QuestionStep
      dark={dark}
      current={current}
      answers={answers}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onPrev={handlePrev}
    />
  );
  if (step === "processing") return <ProcessingStep dark={dark} />;
  return null;
}