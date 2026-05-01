"use client";

import { useState } from "react";
import {
  BarChart3,
  Clock,
  Sparkles,
  Shield,
  ArrowRightLeft,
  Settings,
  FileText,
  RotateCcw,
  ArrowDown,
  Zap,
  Diamond,
  Brain,
  LayoutGrid,
  Layers,
  ArrowRight,
} from "lucide-react";

// ─── Empty / Initialize State ──────────────────────────────────────────────
function EmptyState({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="relative min-h-screen">
      {/* Blurred background page */}
      <div className="filter blur-sm brightness-50 pointer-events-none select-none">
        <div className="space-y-6 max-w-full p-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Market Parity Analysis
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                High-fidelity benchmarking against Global Top 5% industry leaders.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-semibold">
                Export PDF
              </button>
              <button className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold">
                Initialize Scan
              </button>
            </div>
          </div>

          {/* Placeholder cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-[#111827] border border-white/5 p-6 h-32"
              >
                <div className="h-2 rounded-full bg-white/5 w-3/4 mb-3" />
                <div className="h-6 rounded bg-white/5 w-1/2 mb-2" />
                <div className="h-2 rounded-full bg-white/5 w-full" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#111827] border border-white/5 p-6 h-64" />
            <div className="rounded-xl bg-[#111827] border border-white/5 p-6 h-64" />
          </div>
        </div>
      </div>

      {/* Modal overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-start pt-12 md:pt-20 z-20 overflow-y-auto pb-12">
        {/* Modal */}
        <div className="w-full max-w-2xl mx-auto rounded-2xl bg-gradient-to-b from-[#1c2333] to-[#111827] border border-white/10 p-8 md:p-10 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-teal-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
            Initialize Your Benchmark Profile
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-sm md:text-base text-center leading-relaxed max-w-lg mx-auto mb-8">
            Once your strategic scan is complete, PICA will map your operational
            topology against global industry leaders. You will unlock access to
            your{" "}
            <span className="text-teal-400 font-semibold">
              96.2 percentile rank
            </span>{" "}
            and a{" "}
            <span className="text-teal-400 font-semibold">
              +24.8% competitive delta
            </span>{" "}
            across Finance, HR, Operations, Marketing, and Strategy.
          </p>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl bg-[#0d1117] border border-white/5 p-4 text-center">
              <Clock className="w-5 h-5 text-teal-400 mx-auto mb-2" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                Processing Time
              </p>
              <p className="text-sm font-semibold text-white">
                &lt; 60 Seconds
              </p>
            </div>
            <div className="rounded-xl bg-[#0d1117] border border-white/5 p-4 text-center">
              <Sparkles className="w-5 h-5 text-teal-400 mx-auto mb-2" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                Data Points
              </p>
              <p className="text-sm font-semibold text-white">
                150+ Parity Markers
              </p>
            </div>
            <div className="rounded-xl bg-[#0d1117] border border-white/5 p-4 text-center">
              <Shield className="w-5 h-5 text-teal-400 mx-auto mb-2" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                Privacy Level
              </p>
              <p className="text-sm font-semibold text-white">
                Zero-Knowledge Proofs
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onLaunch}
            className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold uppercase tracking-wider transition"
          >
            LAUNCH STRATEGIC SCAN 🚀
          </button>
        </div>

        {/* Feature cards below modal */}
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 px-4">
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-teal-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Privacy Shield Enabled
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              All benchmark data is processed through multi-layer anonymization.
              Your operational fingerprint remains invisible to competitors.
            </p>
          </div>
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <ArrowRightLeft className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Dynamic Calibration
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Benchmarks auto-refresh every 24 hours against live market data,
              ensuring your competitive positioning is always current.
            </p>
          </div>
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mb-3">
              <Settings className="w-5 h-5 text-orange-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              High-Fidelity Analysis
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Our engine cross-references over 5,000 operational nodes per scan,
              producing institutional-grade parity intelligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Active / Results State ────────────────────────────────────────────────

const peerData = [
  { label: "FINANCE", score: 92, avg: 68 },
  { label: "HR & CULTURE", score: 88, avg: 62 },
  { label: "OPERATIONS", score: 95, avg: 70 },
  { label: "MARKETING", score: 84, avg: 60 },
  { label: "STRATEGY", score: 91, avg: 65 },
];

function ActiveState() {
  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Market Parity Analysis
          </h1>
          <p className="text-gray-400 text-sm mt-1 max-w-xl">
            High-fidelity benchmarking against Global Top 5% industry leaders.
            Your current trajectory indicates a strong alpha performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white text-sm font-semibold hover:bg-white/5 transition flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Recalculate
          </button>
        </div>
      </div>

      {/* Top metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Competitive Delta */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
            Overall Competitive Delta
          </p>
          <p className="text-3xl font-bold text-teal-400 mb-1">+24.8%</p>
          <p className="text-xs text-gray-500 mb-3">
            Aggregated Market Superiority
          </p>
          <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-wider">
            <div>
              <p>Current Value</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                86.4 pts
              </p>
            </div>
            <div className="text-right">
              <p>Target Parity</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                69.2 pts
              </p>
            </div>
          </div>
        </div>

        {/* Percentile Rank */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
            Percentile Rank
          </p>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            <p className="text-3xl font-bold text-white">96.2</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/5">
            <div className="h-full rounded-full bg-teal-400 w-[96%]" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Top 3.8% globally</p>
        </div>

        {/* Efficiency Gap */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
            Efficiency Gap
          </p>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-yellow-400" />
            <p className="text-3xl font-bold text-white">0.84</p>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <ArrowDown className="w-3 h-3 text-red-400" />
            <p className="text-xs text-red-400">~-0.12 from last cycle</p>
          </div>
        </div>

        {/* Competitive Index */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
            Competitive Index
          </p>
          <div className="flex items-center gap-2 mb-1">
            <Diamond className="w-5 h-5 text-purple-400" />
            <p className="text-3xl font-bold text-white">4.2</p>
          </div>
          <span className="inline-block mt-2 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-teal-500/20 text-teal-400 tracking-wider">
            Class: Market Leader
          </span>
        </div>
      </div>

      {/* Two column: Peer Comparison + Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Industry Peer Comparison */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-white">
              Industry Peer Comparison
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                <span className="text-gray-400">Your Score</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                <span className="text-gray-400">Industry Avg</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-6">
            Benchmark against cross-vertical aggregates
          </p>

          <div className="space-y-4">
            {peerData.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-xs text-white font-semibold">
                    {item.score}%
                  </p>
                </div>
                <div className="relative h-3 rounded-full bg-white/5">
                  {/* Industry avg bar */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gray-600/50"
                    style={{ width: `${item.avg}%` }}
                  />
                  {/* Your score bar */}
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-teal-400"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-6">
          <h3 className="text-base font-bold text-white mb-1">
            Performance Distribution
          </h3>
          <p className="text-xs text-gray-500 mb-6">
            Relative positioning in Global Market Volume
          </p>

          {/* Bell curve visualization */}
          <div className="relative h-48 flex items-end justify-center gap-[2px] px-4">
            {/* Generate bell curve bars */}
            {(() => {
              const bars = [
                2, 3, 5, 7, 10, 14, 19, 25, 32, 40, 50, 60, 72, 82, 90, 96,
                100, 96, 90, 82, 72, 60, 50, 40, 32, 25, 19, 14, 10, 7, 5, 3,
                2,
              ];
              return bars.map((h, i) => {
                const isElite = i >= 27;
                const isYou = i === 29;
                return (
                  <div key={i} className="relative flex-1 flex flex-col items-center">
                    {isYou && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-teal-500 text-[9px] font-bold uppercase text-white">
                        You Are Here
                      </div>
                    )}
                    <div
                      className={`w-full rounded-t transition-all ${
                        isElite
                          ? "bg-teal-400/80"
                          : i >= 22
                          ? "bg-teal-400/30"
                          : "bg-gray-600/40"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                );
              });
            })()}
          </div>

          {/* X axis labels */}
          <div className="flex items-center justify-between mt-3 px-4">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              Laggards
            </p>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              Average
            </p>
            <p className="text-[10px] text-teal-400 uppercase font-bold tracking-wider">
              Elite
            </p>
          </div>
        </div>
      </div>

      {/* What They Do Differently */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-bold text-white">
            What They Do Differently
          </h3>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-400 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Insights
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center mb-3">
              <Brain className="w-5 h-5 text-orange-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-2">
              AI-Driven Forecasting
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Top-performing firms leverage neural predictive models that
              anticipate market shifts 6-18 months ahead, reducing reactive
              decision-making by up to 43%.
            </p>
            <button className="text-teal-400 text-xs font-semibold flex items-center gap-1 hover:text-teal-300 transition">
              View implementation strategy
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center mb-3">
              <LayoutGrid className="w-5 h-5 text-teal-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-2">
              Decentralized Governance
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Elite organizations distribute decision authority across
              autonomous pods, achieving 2.7x faster execution velocity while
              maintaining strategic coherence.
            </p>
            <button className="text-teal-400 text-xs font-semibold flex items-center gap-1 hover:text-teal-300 transition">
              Explore governance models
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-2">
              Tech Stack Consolidation
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Market leaders operate on 60% fewer tools than average, investing
              in deep integrations that yield 3.1x higher per-platform ROI and
              reduce context-switching overhead.
            </p>
            <button className="text-teal-400 text-xs font-semibold flex items-center gap-1 hover:text-teal-300 transition">
              Audit stack efficiency
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function BenchmarksPage() {
  const [initialized, setInitialized] = useState(false);

  if (!initialized) {
    return <EmptyState onLaunch={() => setInitialized(true)} />;
  }

  return <ActiveState />;
}
