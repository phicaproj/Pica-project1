"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Gauge ────────────────────────────────────────────────────────────────────
function Gauge({ score }: { score: number }) {
  const r = 90;
  const cx = 120;
  const cy = 120;
  const startAngle = 135;
  const sweep = 270;
  const endAngle = startAngle + sweep;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number) => {
    const s = toRad(start);
    const e = toRad(end);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const scoreAngle = startAngle + (score / 100) * sweep;
  const arcColor = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";
  const label = score >= 70 ? "Good Health" : score >= 40 ? "Moderate Risk" : "At Risk";

  const segments = [
    { from: startAngle, to: startAngle + sweep * 0.4, color: "#ef4444" },
    { from: startAngle + sweep * 0.4, to: startAngle + sweep * 0.7, color: "#eab308" },
    { from: startAngle + sweep * 0.7, to: endAngle, color: "#22c55e" },
  ];

  return (
    <svg viewBox="0 0 240 240" className="w-52 h-52">
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#374151" strokeWidth={16} strokeLinecap="round" />
      {segments.map((seg, i) => (
        <path key={i} d={arcPath(seg.from, seg.to)} fill="none" stroke={seg.color} strokeWidth={16} strokeLinecap="butt" opacity={0.3} />
      ))}
      {score > 0 && (
        <path d={arcPath(startAngle, scoreAngle)} fill="none" stroke={arcColor} strokeWidth={16} strokeLinecap="round" />
      )}
      <circle cx={cx} cy={cy} r={72} fill="#111827" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize={44} fontWeight="bold">{score}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill={arcColor} fontSize={11}>{label}</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#6b7280" fontSize={9}>Since last Test</text>
    </svg>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  "Home",
  "Strategic Scan",
  "Deep Dive Module",
  "Insights",
  "Benchmarks",
  "Reports",
  "Consultation",
  "Subscription",
  "Settings",
];

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("Home");
  const [hasActivity] = useState(true); // toggle to false to see empty state

  // Mock data
  const overallScore = 70;
  const categories = [
    { label: "Financial",       score: 80, status: "Good",   color: "text-green-400"  },
    { label: "Marketing",       score: 69, status: "Stable", color: "text-yellow-400" },
    { label: "Human Resources", score: 37, status: "At Risk", color: "text-red-400"   },
  ];
  const heatmap = [
    { label: "Financial",       risk: "Low",      bg: "bg-green-600"  },
    { label: "Marketing",       risk: "Moderate", bg: "bg-yellow-500" },
    { label: "Human Resources", risk: "High",     bg: "bg-red-600"    },
  ];
  const priorities = [
    "Inculcate a proper reward system",
    "Inculcate a proper reward system",
    "Inculcate a proper reward system",
    "Inculcate a proper reward system",
  ];

  return (
    <div className="min-h-screen bg-[#1a2235] text-white flex flex-col">

      {/* ── Top Nav ── */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#1a2235]">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {/* Replace with your logo */}
          <img src="./images/logo.png"></img>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#243044] text-gray-300 text-sm hover:bg-[#2d3a52] transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            Search
          </button>

          {/* Notifications */}
          <button className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-[#243044] text-gray-300 text-sm hover:bg-[#2d3a52] transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">2 New</span>
          </button>

          {/* User */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#243044] text-gray-300 text-sm hover:bg-[#2d3a52] transition">
            <span className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">P</span>
            B. Pica
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 gap-0">

        {/* ── Sidebar ── */}
        <aside className="w-72 flex-shrink-0 flex flex-col justify-between py-6 px-4">
          <nav className="bg-[#243044] rounded-2xl p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeNav === item
                    ? "text-orange-400 font-semibold"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="bg-[#243044] rounded-2xl p-4 space-y-1 mt-4">
            <button className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition">
              Delete Account
            </button>
            <button className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition">
              Log Out
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* Free plan banner */}
          <div className="relative rounded-2xl bg-[#243044] overflow-hidden mb-6 p-8" style={{ minHeight: "160px" }}>
            {/* Blurred glow blobs */}
            <div className="absolute right-32 top-4 w-24 h-24 rounded-full bg-orange-500 opacity-60 blur-2xl pointer-events-none" />
            <div className="absolute right-56 top-8 w-16 h-16 rounded-full bg-yellow-300 opacity-50 blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-1">Your Profile Is Currently On<br />The Free Plan</h2>
              <p className="text-gray-400 text-sm mb-4">Achieve more with Pica Premium</p>
              <button className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition">
                View Plans
              </button>
            </div>
          </div>

          {hasActivity ? (
            /* ── Active state ── */
            <div className="grid grid-cols-3 gap-6">

              {/* Overall Business Health card — spans 2 cols */}
              <div className="col-span-2 bg-[#243044] rounded-2xl p-6 relative overflow-hidden">
                {/* Glow blobs */}
                <div className="absolute left-12 top-16 w-20 h-20 rounded-full bg-yellow-300 opacity-30 blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Overall Business Health</h3>
                  <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition">
                    See All
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Gauge */}
                <div className="flex justify-center my-4">
                  <Gauge score={overallScore} />
                </div>

                {/* Category breakdown */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Overall Business Health</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {categories.map(({ label, score, status, color }) => (
                      <div key={label} className="bg-[#1a2235] rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className="text-3xl font-bold text-white">{score}</p>
                        <p className={`text-xs font-semibold mt-1 ${color}`}>{status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="col-span-1 flex flex-col gap-6">

                {/* Risk Heatmap */}
                <div className="bg-[#243044] rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Risk Heatmap</h3>
                  <div className="space-y-2">
                    {heatmap.map(({ label, risk, bg }) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="flex-1 px-3 py-2.5 rounded-lg bg-[#1a2235] text-sm text-gray-300">{label}</span>
                        <span className={`px-4 py-2.5 rounded-lg text-white text-sm font-semibold ${bg}`}>{risk}</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition">
                    View Recommendations
                  </button>
                </div>

                {/* Priority Fixes */}
                <div className="bg-[#243044] rounded-2xl p-6 flex-1">
                  <h3 className="text-lg font-bold text-white mb-4">Priority Fixes</h3>
                  <ol className="space-y-2 list-none">
                    {priorities.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-gray-500 font-medium min-w-[18px]">{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                  <button className="mt-5 w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition">
                    Start Improvement Plan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── Empty state ── */
            <div className="relative rounded-2xl bg-[#243044] overflow-hidden flex items-center justify-center" style={{ minHeight: "480px" }}>
              
              <div
  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
  style={{ backgroundImage: "url('./images/dashboard img.png')" }}
/>
              {/* Yellow glow blob */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-yellow-300 opacity-80 blur-sm pointer-events-none" />
              <div className="relative z-10 text-center">
                <p className="text-2xl font-bold text-white">No Activities</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}