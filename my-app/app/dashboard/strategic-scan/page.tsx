"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Banknote,
  Users,
  Settings2,
  Megaphone,
  Radar,
  FileText,
  Download,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

type ScanState = "landing" | "processing" | "results";

// ─── Landing State ──────────────────────────────────────────────────────────
function LandingState({ onStart }: { onStart: () => void }) {
  const departments = [
    { label: "Finance", icon: Banknote, color: "text-teal-400 border-teal-400/30 bg-teal-400/5" },
    { label: "HR", icon: Users, color: "text-blue-400 border-blue-400/30 bg-blue-400/5" },
    { label: "Ops", icon: Settings2, color: "text-green-400 border-green-400/30 bg-green-400/5" },
    { label: "Marketing", icon: Megaphone, color: "text-purple-400 border-purple-400/30 bg-purple-400/5" },
    { label: "Strategy", icon: Radar, color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5" },
  ];

  return (
    <div className="space-y-8 max-w-full">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-8 p-6 md:p-10">
          <div className="flex-1 min-w-0">
            <span className="inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider mb-6">
              System Ready
            </span>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Initiate Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Strategic
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-yellow-400 to-teal-400 bg-clip-text text-transparent">
                Scan.
              </span>
            </h1>

            <p className="text-gray-400 text-sm md:text-base max-w-lg mb-8">
              Unfold the mathematical architecture of your business. Our celestial engine parses
              complex data points into actionable holographic insights.
            </p>

            {/* Department icons */}
            <div className="flex flex-wrap gap-3 mb-8">
              {departments.map((dept) => (
                <div
                  key={dept.label}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border ${dept.color} transition hover:scale-105 cursor-pointer`}
                >
                  <dept.icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                    {dept.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA + Stats */}
            <div className="flex flex-wrap items-center gap-6">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition shadow-lg shadow-orange-500/20"
              >
                Start New Scan
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold text-white">1,200+</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Scans Performed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">4.8/5</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Accuracy Rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right visual panel */}
          <div className="hidden lg:flex flex-col items-center gap-4 w-72">
            <div className="rounded-xl bg-[#0d1117] border border-teal-500/20 px-4 py-2 flex items-center gap-2 self-end">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-300 font-mono">CORE_OS V.4.2</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#0f1a2e] to-[#0d1117] border border-teal-500/10 p-6 w-full">
              <div className="w-24 h-24 rounded-2xl border-2 border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-4">
                <Radar className="w-10 h-10 text-teal-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Neural Link Active</h4>
              <p className="text-xs text-gray-500 text-center">
                Analyzing multi-dimensional data vectors across 14 global nodes...
              </p>
            </div>

            <div className="rounded-lg bg-[#0d1117] border border-white/5 px-4 py-2 w-full">
              <div className="h-2 rounded-full bg-white/5 mb-1">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400 w-[74%]" />
              </div>
              <p className="text-[10px] text-gray-500 font-mono">HEURISTIC LOAD: 74%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Processing State ───────────────────────────────────────────────────────
function ProcessingState({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 0.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  const insights = [
    { icon: Banknote, title: "Finance Vector Detected", desc: "Liquidity cycles showing 12% variance from baseline projections.", color: "text-teal-400" },
    { icon: Users, title: "HR Structural Analysis", desc: "Talent retention patterns correlating with Q3 operation shift.", color: "text-pink-400" },
    { icon: Megaphone, title: "Market Sentiment Parsing", desc: "Scanning external brand perception across global nodes...", color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* Main processing view */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0a1628] via-[#0d1117] to-[#0d1117] border border-white/5 overflow-hidden min-h-[60vh] flex flex-col items-center justify-center p-6 md:p-10">
        {/* Animated glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
        </div>

        {/* Orb visualization */}
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="relative w-48 h-48 md:w-56 md:h-56">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-teal-500/20 animate-[spin_20s_linear_infinite]" />
            {/* Inner orb */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-teal-900/50 via-blue-900/50 to-purple-900/50 border border-teal-500/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400/30 to-blue-500/30 flex items-center justify-center">
                <Radar className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            {/* Floating dots */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
            <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
          </div>
          <p className="text-[10px] text-teal-400 uppercase tracking-widest mt-2 font-mono">
            Neural Link Active
          </p>
        </div>

        {/* Title + Progress */}
        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Strategic Scan</h2>
          <p className="text-gray-400 text-sm mb-6">
            Analyzing multi-dimensional data vectors...
          </p>
          <div className="h-2 rounded-full bg-white/5 mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-teal-300 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-mono">PROCESSING</span>
            <span className="text-teal-400 font-mono">{progress.toFixed(1)}% COMPLETE</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-6 left-6 space-y-1 hidden md:block">
          <p className="text-[10px]">
            <span className="text-orange-400 font-bold">AURORA KINETIC</span>{" "}
            <span className="text-gray-500">ENGINE VERSION 4.2.1</span>
          </p>
          <p className="text-[10px]">
            <span className="text-orange-400 font-bold">NODE LOCATION</span>{" "}
            <span className="text-gray-500">CLUSTER-X9 GLOBAL</span>
          </p>
        </div>
      </div>

      {/* Active Insights Stream */}
      <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Active Insights Stream
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((insight) => (
            <div
              key={insight.title}
              className="rounded-lg bg-[#0d1117] border border-white/5 p-4 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <insight.icon className={`w-4 h-4 ${insight.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{insight.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Results State ──────────────────────────────────────────────────────────
function ResultsState({ onReset }: { onReset: () => void }) {
  const score = 82;
  const pillars = [
    { label: "Finance", score: 94, status: "Stable", statusColor: "bg-teal-500/20 text-teal-400", barColor: "bg-teal-400", icon: Banknote },
    { label: "HR", score: 78, status: "Growth", statusColor: "bg-blue-500/20 text-blue-400", barColor: "bg-blue-400", icon: Users },
    { label: "Operations", score: 42, status: "Attention", statusColor: "bg-red-500/20 text-red-400", barColor: "bg-red-400", icon: Settings2 },
    { label: "Marketing", score: 88, status: "Active", statusColor: "bg-teal-500/20 text-teal-400", barColor: "bg-teal-400", icon: Megaphone },
    { label: "Strategy", score: 91, status: "Optimized", statusColor: "bg-green-500/20 text-green-400", barColor: "bg-green-400", icon: Radar },
  ];

  // Circular progress SVG
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6 max-w-full">
      {/* Score + Summary */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 overflow-hidden p-6 md:p-10">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Score Ring */}
          <div className="relative flex-shrink-0">
            <svg width="200" height="200" viewBox="0 0 200 200" className="w-44 h-44 md:w-52 md:h-52">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#1f2937" strokeWidth="12" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#00d4aa"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 100 100)"
                className="drop-shadow-[0_0_8px_rgba(0,212,170,0.4)]"
              />
              <text x="100" y="92" textAnchor="middle" fill="white" fontSize="42" fontWeight="bold">
                {score}%
              </text>
              <text x="100" y="118" textAnchor="middle" fill="#00d4aa" fontSize="12" fontWeight="600">
                EXCELLENT
              </text>
            </svg>
          </div>

          {/* Summary text */}
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Diagnostic <span className="text-orange-400">Complete.</span>
            </h1>
            <p className="text-gray-400 text-sm mt-3 max-w-lg">
              Your strategic architecture is resilient. We&apos;ve synthesized data from 12 channels
              to provide a comprehensive health mapping of your enterprise operations.
            </p>
            <div className="flex flex-wrap gap-3 mt-6 justify-center lg:justify-start">
              <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
                <Box className="w-4 h-4" /> Deep Dive into Operations
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition">
                <Download className="w-4 h-4" /> Download Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Pulse Insight */}
      <div className="rounded-xl bg-[#111827] border-l-2 border-teal-400 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white mb-1">AI Pulse Insight</h3>
          <p className="text-sm text-gray-300">
            &ldquo;We detected <span className="text-teal-400 font-semibold">3 critical issues</span> in your
            Operations pillar related to supply chain latency. Rectifying these could increase overall
            efficiency by <span className="text-teal-400 font-semibold">14%</span> within the next fiscal quarter.&rdquo;
          </p>
        </div>
        <Zap className="w-8 h-8 text-purple-400/30 flex-shrink-0 hidden md:block" />
      </div>

      {/* Pillar Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Pillar Breakdown</h2>
          <span className="text-xs text-gray-500">Last updated 2 mins ago</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.label}
              className={`rounded-xl bg-[#111827] border p-4 ${
                pillar.score < 50 ? "border-red-400/30" : "border-white/5"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <pillar.icon className="w-4 h-4 text-gray-400" />
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${pillar.statusColor}`}>
                  {pillar.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 uppercase font-semibold">{pillar.label}</p>
              <p className="text-3xl font-bold text-white">
                {pillar.score}<span className="text-lg text-gray-500"> %</span>
              </p>
              <div className="mt-2 h-1 rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${pillar.barColor}`}
                  style={{ width: `${pillar.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Re-scan CTA */}
      <div className="rounded-xl bg-[#111827] border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-white">Ready for a fresh perspective?</p>
            <p className="text-xs text-gray-500">Clear cache and re-initialize scan engine</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition"
        >
          Start Another Scan
        </button>
      </div>
    </div>
  );
}

// ─── Icon helper (Box from lucide not imported above, let me alias) ──────────
function Box(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function StrategicScanPage() {
  const [scanState, setScanState] = useState<ScanState>("landing");

  return (
    <>
      {scanState === "landing" && (
        <LandingState onStart={() => setScanState("processing")} />
      )}
      {scanState === "processing" && (
        <ProcessingState onComplete={() => setScanState("results")} />
      )}
      {scanState === "results" && (
        <ResultsState onReset={() => setScanState("landing")} />
      )}
    </>
  );
}
