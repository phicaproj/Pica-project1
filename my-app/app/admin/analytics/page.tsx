"use client";

import { useState } from "react";
import {
  TrendingUp,
  MoreHorizontal,
  Monitor,
  Stethoscope,
  ShoppingBag,
  Landmark,
} from "lucide-react";

const PILLAR_MATRIX = [
  { label: "Strategy",     pct: 92, color: "bg-blue-500" },
  { label: "Operations",   pct: 74, color: "bg-emerald-500" },
  { label: "Finance",      pct: 61, color: "bg-amber-500" },
  { label: "Marketing",    pct: 88, color: "bg-blue-400" },
  { label: "HR & Culture", pct: 54, color: "bg-amber-400" },
  { label: "Technology",   pct: 96, color: "bg-emerald-400" },
];

const PAIN_POINTS = [
  { label: "Data Redundancy Fatigue",   pillar: "TECHNOLOGY PILLAR", count: "422 Instances", severity: "critical" },
  { label: "Governance Bottlenecks",    pillar: "LEGAL & STRATEGY",  count: "389 Instances", severity: "critical" },
  { label: "Shadow IT Spending",        pillar: "FINANCE",           count: "215 Instances", severity: "moderate" },
  { label: "Cross-Dept. Knowledge Gaps",pillar: "HR & CULTURE",      count: "198 Instances", severity: "moderate" },
];

const SECTORS = [
  { label: "Tech & Software", sub: "842 ORGANIZATIONS", pct: "32.4%", icon: Monitor,     color: "bg-blue-500/20 text-blue-400",    border: "border-blue-500/10" },
  { label: "Healthcare",      sub: "512 ORGANIZATIONS", pct: "19.7%", icon: Stethoscope, color: "bg-emerald-500/20 text-emerald-400", border: "border-emerald-500/10" },
  { label: "Retail & E-comm", sub: "394 ORGANIZATIONS", pct: "15.1%", icon: ShoppingBag, color: "bg-amber-500/20 text-amber-400",   border: "border-amber-500/10" },
  { label: "Finance",         sub: "288 ORGANIZATIONS", pct: "11.2%", icon: Landmark,    color: "bg-purple-500/20 text-purple-400", border: "border-purple-500/10" },
];

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState("30D");

  return (
    <div className="space-y-0 max-w-[1400px] mx-auto">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Intelligence Dashboard</h1>
          <p className="text-gray-400 text-sm">Global platform diagnostics and kinetic growth metrics.</p>
        </div>
        <div className="flex bg-[#1C1F2E] border border-white/5 rounded-xl p-1 self-start">
          {["24H", "7D", "30D", "90D"].map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeRange === r ? "bg-blue-500 text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat Banner (with dashboard bg image) ──────────────── */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#0f1117]/70" />

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4">

          {/* Platform Growth */}
          <div className="p-6 border-r border-white/10">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Platform Growth</div>
            <div className="text-4xl font-bold text-white mb-1">2,842</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              +12.4%
            </div>
            {/* mini bar chart */}
            <div className="flex items-end gap-[3px] h-8">
              {[30, 45, 35, 55, 42, 62, 50, 72, 60, 85].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all ${
                    i >= 7 ? "bg-emerald-400" : "bg-emerald-400/25"
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* User Retention */}
          <div className="p-6 border-r border-white/10">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">User Retention</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-white">94.2</span>
              <span className="text-2xl font-bold text-white">%</span>
            </div>
            <div className="text-xs text-gray-400 mb-4">Stable</div>
            {/* circle gauge */}
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="transparent" stroke="#ffffff10" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="transparent"
                  stroke="#6366f1" strokeWidth="3"
                  strokeDasharray={`${94.2 * 0.9425} 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Avg Assessment */}
          <div className="p-6 border-r border-white/10">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Avg. Assessment</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-white">78.5</span>
              <span className="text-base font-semibold text-gray-400">/100</span>
            </div>
            <div className="text-xs font-bold text-amber-400 mb-4">Benchmark</div>
            {/* dot progress indicator */}
            <div className="flex gap-1.5">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < 8 ? "bg-amber-400" : "bg-white/10"}`}
                />
              ))}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="p-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Active Sessions</div>
            <div className="text-4xl font-bold text-white mb-1">142</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </div>
            {/* radar icon rings */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-1 rounded-full border-2 border-emerald-500/30" />
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500/60 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Engagement Chart + Pillar Matrix ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Line chart — 2/3 width */}
        <div className="lg:col-span-2 bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">User Engagement Trends</h2>
              <p className="text-sm text-gray-400">Daily active users vs. Assessment starts</p>
            </div>
            <div className="flex items-center gap-5 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-gray-400">DAU</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-gray-400">Starts</span>
              </div>
            </div>
          </div>

          {/* SVG smooth curves */}
          <div className="relative h-56">
            <svg
              viewBox="0 0 740 180"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="dauFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="startFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Subtle grid lines */}
              {[0, 45, 90, 135, 180].map((y) => (
                <line key={y} x1="0" y1={y} x2="740" y2={y} stroke="#ffffff07" strokeWidth="1" />
              ))}

              {/* DAU area — big smooth wave peaking around 21 OCT */}
              <path
                d="M 0 165
                   C 60 158, 100 140, 150 115
                   C 200 88, 230 50, 280 35
                   C 330 20, 380 18, 430 28
                   C 480 38, 520 65, 570 85
                   C 620 105, 680 130, 740 148
                   L 740 180 L 0 180 Z"
                fill="url(#dauFill)"
              />
              <path
                d="M 0 165
                   C 60 158, 100 140, 150 115
                   C 200 88, 230 50, 280 35
                   C 330 20, 380 18, 430 28
                   C 480 38, 520 65, 570 85
                   C 620 105, 680 130, 740 148"
                fill="none"
                stroke="#93c5fd"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Starts area — lower, flatter dashed wave */}
              <path
                d="M 0 172
                   C 80 168, 140 158, 200 145
                   C 260 132, 310 118, 370 112
                   C 430 106, 480 110, 540 118
                   C 600 126, 670 138, 740 142
                   L 740 180 L 0 180 Z"
                fill="url(#startFill)"
              />
              <path
                d="M 0 172
                   C 80 168, 140 158, 200 145
                   C 260 132, 310 118, 370 112
                   C 430 106, 480 110, 540 118
                   C 600 126, 670 138, 740 142"
                fill="none"
                stroke="#6ee7b7"
                strokeWidth="2"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            </svg>

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <span>01 OCT</span>
              <span>07 OCT</span>
              <span>14 OCT</span>
              <span>21 OCT</span>
              <span>28 OCT</span>
            </div>
          </div>
        </div>

        {/* Pillar Matrix — 1/3 width */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6">Pillar Matrix</h2>

          <div className="space-y-[18px] flex-1">
            {PILLAR_MATRIX.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-300">{p.label}</span>
                  <span className="text-sm font-bold text-white">{p.pct}%</span>
                </div>
                <div className="h-[5px] w-full bg-white/[0.07] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.color}`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Insight quote */}
          <div className="mt-6 p-4 bg-[#111318] rounded-xl border border-white/5">
            <p className="text-xs text-gray-400 italic leading-relaxed">
              "PICA Architecture shows 12% higher efficiency in organizations focusing on 'Technology' and 'Strategy' pillars simultaneously."
            </p>
          </div>
        </div>
      </div>

      {/* ── Row 3: Pain Points + Top Sectors (bg image) ─────────── */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        {/* dashboard bg image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#0f1117]/82" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">

          {/* Critical Pain Points */}
          <div className="p-7 border-b lg:border-b-0 lg:border-r border-white/5">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Critical Pain Points</h2>
                <p className="text-sm text-gray-400">Most frequent issues across assessments</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20 uppercase tracking-wider">
                  Critical
                </span>
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Moderate
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {PAIN_POINTS.map((pt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    pt.severity === "critical"
                      ? "border-red-500/15 bg-red-500/[0.04] hover:bg-red-500/[0.07]"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Left severity bar */}
                  <div
                    className={`w-[3px] h-10 rounded-full flex-shrink-0 ${
                      pt.severity === "critical" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{pt.label}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                      {pt.pillar}
                    </div>
                  </div>
                  {/* Count + menu */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-white">{pt.count}</span>
                    <button className="text-gray-600 hover:text-gray-300 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Activity Sectors */}
          <div className="p-7">
            <h2 className="text-xl font-bold text-white mb-6">Top Activity Sectors</h2>

            <div className="space-y-3">
              {SECTORS.map((sec, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-xl border bg-white/[0.02] hover:bg-white/[0.04] transition-colors ${sec.border}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${sec.color}`}
                  >
                    <sec.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{sec.label}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                      {sec.sub}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-white flex-shrink-0">{sec.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="text-center py-8 border-t border-white/5">
        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
          PICA Kinetic Architecture © 2024
        </div>
        <div className="text-[10px] text-gray-700 mt-1.5 tracking-wide">
          v4.8.2-stable // Internal Administrative Control Hub
        </div>
      </div>

    </div>
  );
}