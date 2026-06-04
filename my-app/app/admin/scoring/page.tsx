"use client";

import { useState } from "react";
import {
  Scale,
  Plus,
  ZoomIn,
  ZoomOut,
  Flag,
  CheckCircle2,
  CircleDot,
  Webhook,
  HistoryIcon,
  ChevronDown,
  RefreshCw,
  Rocket,
  Save,
} from "lucide-react";

const CATEGORY_WEIGHTS = [
  { label: "Finance & ROI", pct: 40, color: "bg-blue-500", textColor: "text-blue-400" },
  { label: "Human Resources", pct: 25, color: "bg-emerald-500", textColor: "text-emerald-400" },
  { label: "Operational Risk", pct: 20, color: "bg-amber-500", textColor: "text-amber-400" },
  { label: "Market Positioning", pct: 15, color: "bg-gray-500", textColor: "text-gray-400" },
];

const SCORE_BANDS = [
  {
    range: "0 – 45",
    label: "CRITICAL",
    labelColor: "text-red-400",
    desc: "Immediate intervention required.",
    barColor: "bg-red-500",
    border: "border-red-500/20 bg-red-500/5",
  },
  {
    range: "46 – 75",
    label: "ATTENTION",
    labelColor: "text-amber-400",
    desc: "Monitor specific health nodes.",
    barColor: "bg-amber-500",
    border: "border-amber-500/20 bg-amber-500/5",
  },
  {
    range: "76 – 100",
    label: "HEALTHY",
    labelColor: "text-emerald-400",
    desc: "Operating within optimal margins.",
    barColor: "bg-emerald-500",
    border: "border-emerald-500/20 bg-emerald-500/5",
  },
];

export default function ScoringPage() {
  const [weights, setWeights] = useState(CATEGORY_WEIGHTS);

  const handleWeightChange = (index: number, newPct: number) => {
    const updated = [...weights];
    updated[index] = { ...updated[index], pct: newPct };
    setWeights(updated);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">System Configuration</div>
          <h1 className="text-3xl font-bold text-white mb-2">Logic & Scoring Builder</h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Define the algorithmic foundations of your business health assessments. Balance category weights, trigger risk flags, and configure automated interpretations.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white text-sm font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" /> Reset Logic
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors">
            <Rocket className="w-4 h-4" /> Deploy System
          </button>
        </div>
      </div>

      {/* Main two-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — Category weights + score interpretation */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Category Weights card with bg image */}
          <div className="relative bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 h-24 bg-cover bg-bottom bg-no-repeat opacity-20 pointer-events-none"
              style={{ backgroundImage: "url('/images/dashboard img')" }}
            />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Category Weights</h2>
                <Scale className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-5">
                {weights.map((w, i) => (
                  <div key={w.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-200">{w.label}</span>
                      <span className={`text-sm font-bold ${w.textColor}`}>{w.pct}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      value={w.pct}
                      onChange={(e) => handleWeightChange(i, parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${
                          w.color.replace("bg-", "").includes("blue") ? "#3b82f6" :
                          w.color.includes("emerald") ? "#10b981" :
                          w.color.includes("amber") ? "#f59e0b" : "#6b7280"
                        } 0%, ${
                          w.color.replace("bg-", "").includes("blue") ? "#3b82f6" :
                          w.color.includes("emerald") ? "#10b981" :
                          w.color.includes("amber") ? "#f59e0b" : "#6b7280"
                        } ${w.pct}%, #ffffff15 ${w.pct}%, #ffffff15 100%)`
                      }}
                    />
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2.5 border border-dashed border-white/20 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Add Custom Category
              </button>
            </div>
          </div>

          {/* Score Interpretation */}
          <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-5">Score Interpretation</h2>
            <div className="space-y-3">
              {SCORE_BANDS.map((band) => (
                <div key={band.label} className={`rounded-xl border p-4 ${band.border}`}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-1 h-8 rounded-full flex-shrink-0 ${band.barColor}`} />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-gray-400">{band.range}:</span>
                        <span className={`text-xs font-bold uppercase ${band.labelColor}`}>{band.label}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{band.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Automated Risk Conditionals flow canvas */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Canvas header */}
          <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-gray-500 border-2 border-[#1C1F2E] z-10" />
                  <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#1C1F2E]" />
                </div>
                <h2 className="text-sm font-semibold text-white">Automated Risk Conditionals</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> New Node
                </button>
              </div>
            </div>

            {/* Flow canvas — relative positioned nodes */}
            <div className="relative bg-[#111318] h-[380px] overflow-hidden">
              {/* Grid dots */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle, #ffffff22 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

              {/* bg image subtle */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
                style={{ backgroundImage: "url('/images/dashboard img')" }}
              />

              {/* Entry Node */}
              <div className="absolute top-10 left-8 w-52 bg-[#1C1F2E] border border-white/10 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Entry Node</span>
                </div>
                <div className="text-sm font-semibold text-white border-b border-white/10 pb-2">
                  Aggregate Score Computed
                </div>
                <div className="mt-2 h-0.5 w-12 bg-blue-500 rounded-full" />
              </div>

              {/* Connector line entry → conditional */}
              <div className="absolute top-[90px] left-[220px] w-16 h-px bg-white/20" />

              {/* Conditional Switch Node */}
              <div className="absolute top-10 left-[280px] w-56 bg-[#1C1F2E] border border-white/10 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Conditional Switch</span>
                  <button className="text-gray-500 hover:text-white"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-gray-400">IF category:</span>
                    <span className="font-semibold text-white">Finance</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-gray-400">Operator:</span>
                    <span className="font-semibold text-white">&lt; (Less Than)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-400">Value:</span>
                    <span className="font-semibold text-white">50%</span>
                  </div>
                </div>
              </div>

              {/* Connector from conditional → trigger risk */}
              <div className="absolute top-[90px] left-[536px] w-12 h-px bg-red-500/50" />

              {/* Trigger Risk Node */}
              <div className="absolute top-10 right-6 w-48 bg-[#1C1F2E] border border-red-500/30 rounded-xl p-4 shadow-lg shadow-red-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Trigger Risk</span>
                </div>
                <div className="text-sm font-semibold text-white mb-2">High Financial Volatility</div>
                <p className="text-xs text-gray-400 leading-relaxed">Force assessment state to "Critical" and notify stakeholders.</p>
              </div>

              {/* Connector from conditional → pass thru (down) */}
              <div className="absolute top-[175px] left-[380px] w-px h-16 bg-emerald-500/40" />

              {/* Pass Thru Node */}
              <div className="absolute top-[240px] left-[280px] w-56 bg-[#1C1F2E] border border-emerald-500/20 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CircleDot className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pass Thru</span>
                </div>
                <div className="text-sm font-semibold text-white mb-1">Standard Flow</div>
                <p className="text-xs text-gray-400">Continue to Human Resources metric calculation.</p>
              </div>

              {/* Status bar */}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-3 border-t border-white/5 flex items-center justify-between bg-[#111318]/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-semibold text-gray-400">Logic Validated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-semibold text-gray-400">4 Nodes Active</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-600">VERSION 4.2.0-ALPHA</span>
              </div>
            </div>
          </div>

          {/* Bottom two feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Historical Benchmarking */}
            <div className="relative bg-[#1C1F2E] rounded-2xl border border-white/5 p-5 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                style={{ backgroundImage: "url('/images/dashboard img')" }}
              />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white mb-2">Historical Benchmarking</h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  Compare current assessment results against a 24-month rolling average to identify systemic drift.
                </p>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white hover:bg-white/15 transition-colors">
                    <HistoryIcon className="w-3.5 h-3.5" /> Configure Baseline
                  </button>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Enabled</span>
                </div>
              </div>
            </div>

            {/* Auto-Save / Webhooks */}
            <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
              {/* Auto-Save */}
              <div className="flex items-start gap-3 pb-4 border-b border-white/5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-1">Auto-Save Active</div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Scoring logic updated 2 minutes ago by System Architect.
                  </p>
                </div>
              </div>

              {/* Webhooks */}
              <div>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                  Push scoring events to connected Jira or Slack channels via Webhooks.
                </p>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white hover:bg-white/15 transition-colors">
                    <Webhook className="w-3.5 h-3.5" /> Manage Webhooks
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-400">3 ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}