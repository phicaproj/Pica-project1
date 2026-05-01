"use client";

import { useState } from "react";
import {
  Download,
  CalendarDays,
  Sparkles,
  Shield,
  AlertTriangle,
  Settings,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";

// ─── Score Ring Component ───────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 70;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        {/* Background ring */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#00d4aa"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{score}%</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
          Optimization Score
        </span>
      </div>
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [expandedCause, setExpandedCause] = useState<number>(0);

  const painPoints = [
    {
      severity: "CRITICAL",
      color: "bg-red-500",
      borderColor: "border-l-red-500",
      badgeColor: "bg-red-500/20 text-red-400",
      label: "Supply chain latency",
      icon: AlertTriangle,
    },
    {
      severity: "MAJOR",
      color: "bg-orange-500",
      borderColor: "border-l-orange-500",
      badgeColor: "bg-orange-500/20 text-orange-400",
      label: "Departmental silos",
      icon: Settings,
    },
    {
      severity: "MINOR",
      color: "bg-yellow-500",
      borderColor: "border-l-yellow-500",
      badgeColor: "bg-yellow-500/20 text-yellow-400",
      label: "Labor retention",
      icon: Users,
    },
  ];

  const rootCauses = [
    {
      title: "Legacy CRM gaps",
      content:
        "Integration gaps between sales and logistics are causing a 4.2 hour lag in order processing time.",
    },
    {
      title: "Data siloing",
      content:
        "Critical operational data remains fragmented across 7 independent systems with no unified pipeline.",
    },
    {
      title: "Vendor dependency",
      content:
        "Over-reliance on single-source vendors creates supply chain vulnerabilities across 3 key product lines.",
    },
  ];

  const impactMetrics = [
    { label: "REVENUE GROWTH", value: "+15%", width: "w-[60%]", color: "bg-teal-400" },
    { label: "EFFICIENCY GAIN", value: "+20%", width: "w-[75%]", color: "bg-teal-400" },
    { label: "RISK REDUCTION", value: "-30%", width: "w-[50%]", color: "bg-orange-500" },
  ];

  const phases = [
    {
      phase: "PHASE 1: DIAGNOSTIC (DAY 1-30)",
      description: "Audit legacy systems and identify mapping errors.",
      status: "complete" as const,
      badgeColor: "bg-green-500/20 text-green-400",
    },
    {
      phase: "PHASE 2: INTEGRATION (DAY 31-60)",
      description: "Rollout cross-docking automation in regional hubs.",
      status: "active" as const,
      badgeColor: "bg-orange-500/20 text-orange-400",
    },
    {
      phase: "PHASE 3: SCALING (DAY 61-90)",
      description: "Expand PICA monitoring to secondary supply routes.",
      status: "pending" as const,
      badgeColor: "bg-white/5 text-gray-500",
    },
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Core AI Insights</h1>
          <p className="text-gray-400 text-sm mt-2">
            Real-time performance diagnostic across cross-functional pillars. Data refreshed 2
            minutes ago.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
            <CalendarDays className="w-4 h-4" />
            Book Consultation
          </button>
        </div>
      </div>

      {/* ── Overall Health + AI Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Health */}
        <div className="rounded-2xl bg-[#111827] border border-white/5 p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Overall Health
            </span>
          </div>
          <ScoreRing score={78} />
          <div className="flex justify-center mt-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20">
              <Shield className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-semibold text-teal-400 uppercase tracking-wide">
                Risk Level: Medium
              </span>
            </span>
          </div>
        </div>

        {/* AI Executive Summary */}
        <div className="rounded-2xl bg-[#111827] border border-white/5 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white">AI Executive Summary</h3>
          </div>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
            &ldquo;We detected{" "}
            <span className="text-orange-400 font-semibold">3 critical issues</span> in your
            Operations and Finance pillars. Your performance can improve by{" "}
            <span className="text-teal-400 font-semibold">22%</span> by automating your
            cross-docking protocols.&rdquo;
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition">
              View Analysis Matrix &rarr;
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
              Automate Protocols
            </button>
          </div>
        </div>
      </div>

      {/* ── Pain Points + Root Cause Analysis ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Pain Points */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Key Pain Points
          </h3>
          <div className="space-y-3">
            {painPoints.map((point) => (
              <div
                key={point.label}
                className={`rounded-xl bg-[#111827] border border-white/5 border-l-4 ${point.borderColor} p-4 flex items-center gap-4`}
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <point.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${point.badgeColor} mb-1`}
                  >
                    {point.severity}
                  </span>
                  <p className="text-sm font-semibold text-white">{point.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Root Cause Analysis */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Root Cause Analysis
          </h3>
          <div className="space-y-3">
            {rootCauses.map((cause, index) => (
              <div
                key={cause.title}
                className="rounded-xl bg-[#111827] border border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCause(expandedCause === index ? -1 : index)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-semibold text-white">{cause.title}</span>
                  {expandedCause === index ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedCause === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{cause.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Impact Forecast + Smart Recommendations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impact Forecast */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Impact Forecast
          </h3>
          <div className="rounded-2xl bg-[#111827] border border-white/5 p-6 space-y-5">
            {impactMetrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {metric.label}
                  </span>
                  <span className="text-sm font-bold text-white">{metric.value}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${metric.color} ${metric.width} transition-all duration-700 ease-out`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Recommendations */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Smart Recommendations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recommendation 1 */}
            <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-green-500/20 text-green-400 mb-3">
                High Impact
              </span>
              <h4 className="text-sm font-bold text-white mb-2">Integrate Blockchain</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Secure multi-node ledger for tracking real-time asset movement across 3PL partners.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm font-semibold text-teal-400 hover:text-teal-300 transition"
              >
                Deploy Module <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Recommendation 2 */}
            <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-500/20 text-orange-400 mb-3">
                Medium Impact
              </span>
              <h4 className="text-sm font-bold text-white mb-2">API Standardization</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Standardize cross-departmental endpoints to reduce data collision by 45%.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm font-semibold text-teal-400 hover:text-teal-300 transition"
              >
                Begin Audit <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 90-Day Action Plan ── */}
      <div>
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          90-Day Action Plan
        </h3>
        <div className="rounded-2xl bg-[#111827] border border-white/5 p-6">
          <div className="space-y-0">
            {phases.map((phase, index) => (
              <div key={phase.phase} className="flex gap-4">
                {/* Timeline line + icon */}
                <div className="flex flex-col items-center">
                  {phase.status === "complete" ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : phase.status === "active" ? (
                    <div className="w-6 h-6 rounded-full border-2 border-orange-400 bg-orange-400/20 flex-shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  )}
                  {index < phases.length - 1 && (
                    <div className="w-px h-10 bg-white/10 my-1" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-6">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold uppercase ${phase.badgeColor} mb-1.5`}
                  >
                    {phase.phase}
                  </span>
                  <p className="text-sm font-semibold text-white">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] overflow-hidden p-8 md:p-10 border border-white/5">
        {/* Decorative glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-20 bottom-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-xl mx-auto">
          <Sparkles className="w-8 h-8 text-teal-400 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready for a Deep Dive?
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Our AI is ready to generate a granular performance report for your specific department.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-semibold hover:bg-white/10 transition">
              Start Deep Dive
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
              Book Expert Call
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 pb-2 border-t border-white/5">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
          &copy; 2026 PICA Intelligence System
        </p>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider hover:text-gray-300 cursor-pointer">
            Privacy
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider hover:text-gray-300 cursor-pointer">
            Compliance
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider hover:text-gray-300 cursor-pointer">
            Network Status
          </span>
        </div>
      </div>
    </div>
  );
}
