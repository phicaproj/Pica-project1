"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Lock,
  Banknote,
  Users,
  Globe,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  TriangleAlert,
  Zap,
  Download,
  MessageSquare,
  Play,
  MoreVertical,
  Plus,
  Pause,
  Eye,
  Search,
} from "lucide-react";

type DeepDiveState = "locked" | "synthesizing" | "active" | "results";

// ─── Locked/Empty State ─────────────────────────────────────────────────────
function LockedState({ onUnlock }: { onUnlock: () => void }) {
  const modules = [
    {
      title: "Finance Deep Dive",
      desc: "Revenue attribution, capital velocity, and risk modeling.",
      icon: Banknote,
    },
    {
      title: "Operations & Talent",
      desc: "Node efficiency, human capital friction, and workflow integrity.",
      icon: Users,
    },
    {
      title: "Market Intelligence",
      desc: "Competitive orbit analysis and macroeconomic pressure sensing.",
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-8 max-w-full">
      {/* Hero */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 overflow-hidden p-6 md:p-10 text-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider mb-6">
            <Lock className="w-3 h-3" /> High-Fidelity Diagnostics Locked
          </span>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            <span className="text-white">Illuminate the core of your</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              architectural intelligence.
            </span>
          </h1>

          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-8">
            The Deep Dive Modules provide granular, high-fidelity insights into your business
            ecosystem. To activate these celestial diagnostics, you must first establish your baseline.
          </p>

          <button
            onClick={onUnlock}
            className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition shadow-lg shadow-orange-500/20"
          >
            Do a Deep Dive <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <div
            key={mod.title}
            className="rounded-xl bg-[#111827] border border-white/5 p-6 relative overflow-hidden group"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                <mod.icon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{mod.title}</h3>
              <p className="text-sm text-gray-500">{mod.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Data stats footer */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          DATA PRECISION: 99.9%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          REAL-TIME SYNTHESIS
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          PROPRIETARY NEURAL MAPPING
        </span>
      </div>
    </div>
  );
}

// ─── Synthesizing State ─────────────────────────────────────────────────────
function SynthesizingState({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 0.4;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  const insights = [
    { icon: AlertTriangle, title: "Supply chain bottleneck found in Q3 data", desc: "Logistics latency increasing by 14% in Southeast region", color: "text-orange-400" },
    { icon: TrendingUp, title: "Potential 12% efficiency gain identified", desc: "Automated routing optimization recommended for fleet B", color: "text-teal-400" },
    { icon: TriangleAlert, title: "Anomalous spending pattern in R&D", desc: "Deviation from linear budget projection detected in May", color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6 max-w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main visualization */}
        <div className="lg:col-span-2 relative rounded-2xl bg-gradient-to-b from-[#0a1628] to-[#0d1117] border border-white/5 overflow-hidden min-h-[50vh] flex flex-col items-center justify-center p-6">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 rounded-full bg-teal-500/5 blur-3xl animate-pulse" />
          </div>

          {/* Animated ring */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 mb-6">
            <svg viewBox="0 0 200 200" className="w-full h-full animate-[spin_15s_linear_infinite]">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(0,212,170,0.1)" strokeWidth="2" />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#00d4aa"
                strokeWidth="3"
                strokeDasharray="80 480"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-teal-400" />
              </div>
            </div>
            {/* Floating dots */}
            <div className="absolute -top-2 left-1/2 w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
            <div className="absolute bottom-1/4 -right-2 w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.5s" }} />
          </div>

          {/* Progress */}
          <div className="relative z-10 text-center max-w-md w-full">
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1">
              Current Task
            </p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white font-semibold">Synthesizing 14,000 data points...</p>
              <span className="text-teal-400 text-sm font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-green-400 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-3 justify-center text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Neural Mapping</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Pattern Recognition</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Correlation Engine</span>
            </div>
          </div>
        </div>

        {/* Insights panel */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Insights Detected</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase text-red-400 bg-red-400/10">
              Live Feed
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {insights.map((ins) => (
              <div key={ins.title} className="rounded-lg bg-[#0d1117] border border-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <ins.icon className={`w-4 h-4 ${ins.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{ins.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ins.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5" /> Final Report (Waiting...)
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="rounded-xl bg-[#111827] border border-white/5 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Processing Core</p>
            <p className="text-xs text-orange-400 font-mono font-bold">AURORA-BETA-4.2</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Active Threads</p>
            <p className="text-xs text-teal-400 font-mono font-bold">128 Instances</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition">
            Pause Synthesis
          </button>
          <button className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition">
            View Real-time Map
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active State (Deep Dive Ongoing) ───────────────────────────────────────
function ActiveState({ onViewResults }: { onViewResults: () => void }) {
  const painPoints = [
    {
      severity: "High Severity",
      category: "Finance",
      title: "Cash flow latency in Q3 expansion projects",
      desc: "Delayed receivables are impacting operational liquidity by 12%.",
      icon: AlertTriangle,
      severityColor: "text-red-400 bg-red-400/10",
    },
    {
      severity: "Structural",
      category: "Operations",
      title: "Departmental silos affecting GTM speed",
      desc: "Product and Sales alignment shows a 14-day feedback loop gap.",
      icon: Users,
      severityColor: "text-orange-400 bg-orange-400/10",
    },
    {
      severity: "Strategic",
      category: "Market",
      title: "Aggressive competitor pricing in APAC",
      desc: "New market entry by 'Zenith' is eroding tier-2 customer base.",
      icon: Globe,
      severityColor: "text-purple-400 bg-purple-400/10",
    },
  ];

  const modules = [
    {
      title: "Finance Architecture",
      desc: "Comprehensive analysis of capital flow, revenue integrity, and investment risk profiles.",
      score: 94,
      icon: Banknote,
      tags: ["Revenue Leakage", "CAPEX Optimization"],
      status: "Analysis Complete",
      statusColor: "text-teal-400 bg-teal-400/10",
      color: "text-teal-400",
    },
    {
      title: "Operations & Talent",
      desc: "Evaluating organizational structure, workflow bottlenecks, and talent retention indices.",
      score: 78,
      icon: Users,
      tags: ["Churn Prediction", "Silo Analysis"],
      status: "Ready for Deep Dive",
      statusColor: "text-orange-400 bg-orange-400/10",
      color: "text-blue-400",
    },
    {
      title: "Market Intelligence",
      desc: "Real-time monitoring of competitive landscapes, sentiment analysis, and emerging trends.",
      score: 91,
      icon: Globe,
      tags: ["Sentiment Engine", "Competitor Maps"],
      status: "Awaiting Input",
      statusColor: "text-gray-400 bg-white/5",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* Top area: Main card + Pain points */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Deep Dive card */}
        <div className="lg:col-span-2 rounded-2xl bg-[#111827] border border-white/5 p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400">
              Ongoing Analysis
            </span>
            <span className="text-xs text-gray-500">Last updated: 14 mins ago</span>
          </div>

          <h2 className="text-2xl font-bold text-white">Operations</h2>
          <h3 className="text-2xl font-bold text-orange-400 mb-3">Deep Dive</h3>
          <p className="text-sm text-gray-400 max-w-lg mb-6">
            Evaluating internal workflow efficiencies and talent retention patterns. Current focus:
            Cross-departmental resource allocation latency.
          </p>

          {/* Entropy Score card */}
          <div className="rounded-xl bg-[#0d1117] border border-white/5 p-4 inline-block mb-6">
            <div className="flex items-center justify-between gap-6 mb-2">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Entropy Score</p>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              12.4<span className="text-sm text-gray-500">pts</span>
            </p>
            {/* Mini bars */}
            <div className="flex gap-1.5 mt-3">
              {[40, 80, 30, 60, 50, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className={`w-6 rounded ${h > 60 ? "bg-teal-400" : "bg-gray-600"}`}
                  style={{ height: `${h * 0.4}px` }}
                />
              ))}
            </div>
          </div>

          {/* Resume + progress */}
          <div className="flex flex-wrap items-center gap-4">
            <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
              <Play className="w-4 h-4" /> Resume Module
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Progress</span>
              <div className="w-32 h-1.5 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-teal-400 w-[64%]" />
              </div>
              <span className="text-xs text-teal-400 font-mono">64%</span>
            </div>
          </div>
        </div>

        {/* Critical Pain Points */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Critical Pain Points</h3>
            <button className="text-orange-400 text-xs font-semibold hover:text-orange-300">View All</button>
          </div>
          <div className="space-y-3 flex-1">
            {painPoints.map((point) => (
              <div key={point.title} className="rounded-xl bg-[#111827] border border-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <point.icon className={`w-4 h-4 ${point.severityColor.split(" ")[0]}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold uppercase ${point.severityColor.split(" ")[0]}`}>
                        {point.severity}
                      </span>
                      <span className="text-[9px] text-gray-500">&bull; {point.category}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{point.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{point.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architectural Modules */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Architectural Modules</h2>
            <p className="text-xs text-gray-500">Select a core vector to begin deep architectural resonance analysis.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
            <Plus className="w-4 h-4" /> New Module
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className="rounded-xl bg-[#111827] border border-white/5 p-5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <mod.icon className={`w-5 h-5 ${mod.color}`} />
                </div>
                <p className={`text-2xl font-bold ${mod.color}`}>
                  {mod.score}%
                  <span className="text-[10px] text-gray-500 block text-right uppercase">Health Score</span>
                </p>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{mod.title}</h3>
              <p className="text-xs text-gray-500 mb-4 flex-1">{mod.desc}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {mod.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded bg-white/5 text-[10px] text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${mod.statusColor}`}>
                  {mod.status}
                </span>
                <button
                  onClick={mod.status === "Analysis Complete" ? onViewResults : undefined}
                  className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Results State (Operations Deep Dive - Results) ─────────────────────────
function ResultsState({ onBack }: { onBack: () => void }) {
  const findings = [
    { severity: "Critical", severityColor: "bg-red-500", title: "Warehouse Latency", desc: "Inventory pick-to-pack cycle time has increased by 18% over the last fiscal quarter due to legacy CRM integration gaps.", stats: ["4.2h Avg.", "+12% YoY"] },
    { severity: "Major", severityColor: "bg-orange-500", title: "Last-Mile Logistics", desc: "Optimization of carrier routing is currently static. Real-time traffic and fuel cost variables are not being integrated.", stats: ["12 Nodes", "84% Eff."] },
    { severity: "Major", severityColor: "bg-orange-500", title: "Supplier Risk Index", desc: "Single-source dependency for micro-controllers has exposed a tier-1 vulnerability in the APAC region.", stats: ["High Risk", "Global"] },
    { severity: "Minor", severityColor: "bg-yellow-500", title: "Labor Retention", desc: "Shift scheduling friction is resulting in minor attrition during peak season ramps. Recommended digital overhaul.", stats: ["2.4% Churn", "Flexible"] },
  ];

  const rootCauses = [
    { label: "Legacy Software", value: "45.2%", size: "large" },
    { label: "Data Silos", value: "18.4%", size: "medium" },
    { label: "Process Rigidity", value: "12.1%", size: "medium" },
    { label: "Human Error", value: "9.3%", size: "small" },
    { label: "Misc", value: "5%", size: "small" },
    { label: "External", value: "10%", size: "small" },
  ];

  const recommendations = [
    { title: "Automate Cross-Docking Protocols", badge: "High Impact", badgeColor: "bg-orange-500/20 text-orange-400", desc: "Implementing AI-driven scheduling for dock assignment could reduce dwell time by 34%.", roi: "4.2x", complexity: "Medium" },
    { title: "Integrate Blockchain Ledger for Tier-2 Suppliers", badge: "Resilience", badgeColor: "bg-purple-500/20 text-purple-400", desc: "Gain real-time visibility into raw material origin to prevent bottleneck surprises.", roi: "2.8x", complexity: "High" },
  ];

  // Circular ring for score
  const score = 42;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 overflow-hidden p-6 md:p-10">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Analysis Complete
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
              Operations Deep Dive - Results
            </h1>
            <p className="text-gray-400 text-sm max-w-lg mb-6">
              Diagnostic overview of the Operations pillar. The current architectural health indicates
              significant friction in supply chain synchronization and middleware latency.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
                <MessageSquare className="w-4 h-4" /> Book Consultant
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition">
                <Download className="w-4 h-4" /> Download Full Report
              </button>
            </div>
          </div>

          {/* Score ring */}
          <div className="flex-shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#ef4444"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 80 80)"
              />
              <text x="80" y="75" textAnchor="middle" fill="white" fontSize="30" fontWeight="bold">
                {score}%
              </text>
              <text x="80" y="95" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">
                ATTENTION REQUIRED
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Diagnostic Findings + Root Cause */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Findings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-gray-400" />
            <h2 className="text-lg font-bold text-white">Diagnostic Findings</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {findings.map((f) => (
              <div key={f.title} className="rounded-xl bg-[#111827] border border-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white ${f.severityColor}`}>
                    {f.severity}
                  </span>
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{f.title}</h4>
                <p className="text-xs text-gray-500 mb-3">{f.desc}</p>
                <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                  {f.stats.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Root Cause Analysis */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-gray-400" />
            <h2 className="text-lg font-bold text-white">Root Cause Analysis</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {rootCauses.map((rc) => (
              <div
                key={rc.label}
                className={`rounded-lg bg-[#111827] border border-white/5 p-3 flex flex-col justify-end ${
                  rc.size === "large" ? "col-span-2 row-span-2 p-5" : rc.size === "medium" ? "col-span-1" : ""
                }`}
              >
                <p className="text-[9px] text-orange-400 uppercase font-bold mb-0.5">{rc.label}</p>
                <p className={`font-bold text-white ${rc.size === "large" ? "text-2xl" : "text-lg"}`}>
                  {rc.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Recommendations */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Smart Recommendations</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Prioritized actions based on ROI and business impact score.
            </p>
          </div>
          <button className="text-teal-400 text-xs font-semibold flex items-center gap-1 hover:text-teal-300">
            View All 12 Insights <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.title} className="rounded-xl bg-[#111827] border border-white/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${rec.badgeColor}`}>
                    {rec.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{rec.desc}</p>
              </div>
              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Est. ROI</p>
                  <p className="text-sm font-bold text-teal-400">{rec.roi}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Complexity</p>
                  <p className="text-sm font-bold text-white">{rec.complexity}</p>
                </div>
                <button className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 hover:bg-teal-500/30 transition">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consult CTA */}
      <div className="rounded-xl bg-[#111827] border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Ready to optimize?</h3>
          <p className="text-sm text-gray-500">
            Our strategic partners specialize in operations transformation for high-growth tech firms.
            Secure a 30-minute deep dive session today.
          </p>
        </div>
        <button className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition flex-shrink-0">
          Consult with Aurora Expert
        </button>
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function DeepDivePage() {
  const [state, setState] = useState<DeepDiveState>("locked");

  return (
    <>
      {state === "locked" && (
        <LockedState onUnlock={() => setState("synthesizing")} />
      )}
      {state === "synthesizing" && (
        <SynthesizingState onComplete={() => setState("active")} />
      )}
      {state === "active" && (
        <ActiveState onViewResults={() => setState("results")} />
      )}
      {state === "results" && (
        <ResultsState onBack={() => setState("active")} />
      )}
    </>
  );
}
