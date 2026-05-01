"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  Plus,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  FileText,
  ChevronRight,
  Shield,
  Zap,
  Lock,
  Database,
  Globe,
  Clock,
} from "lucide-react";

// ─── Decorative SVG for Empty State ─────────────────────────────────────────
function NetworkIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto mb-6">
      {/* Outer ring */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle ring */}
        <circle
          cx="100"
          cy="100"
          r="90"
          stroke="rgba(20,184,166,0.15)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx="100"
          cy="100"
          r="70"
          stroke="rgba(20,184,166,0.25)"
          strokeWidth="1.5"
        />
        {/* Inner filled circle */}
        <circle cx="100" cy="100" r="50" fill="rgba(20,184,166,0.08)" />
        <circle
          cx="100"
          cy="100"
          r="50"
          stroke="rgba(20,184,166,0.3)"
          strokeWidth="1.5"
        />

        {/* Network nodes */}
        <circle cx="100" cy="60" r="4" fill="rgba(20,184,166,0.6)" />
        <circle cx="130" cy="85" r="3" fill="rgba(20,184,166,0.5)" />
        <circle cx="120" cy="120" r="3.5" fill="rgba(20,184,166,0.5)" />
        <circle cx="80" cy="115" r="3" fill="rgba(20,184,166,0.5)" />
        <circle cx="75" cy="82" r="4" fill="rgba(20,184,166,0.6)" />
        <circle cx="100" cy="100" r="5" fill="rgba(20,184,166,0.8)" />

        {/* Connection lines */}
        <line x1="100" y1="60" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
        <line x1="130" y1="85" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
        <line x1="120" y1="120" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
        <line x1="80" y1="115" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />
        <line x1="75" y1="82" x2="100" y2="100" stroke="rgba(20,184,166,0.2)" strokeWidth="1" />

        {/* Outer nodes on the ring */}
        <circle cx="100" cy="10" r="2.5" fill="rgba(20,184,166,0.3)" />
        <circle cx="160" cy="40" r="2" fill="rgba(20,184,166,0.25)" />
        <circle cx="185" cy="105" r="2.5" fill="rgba(20,184,166,0.3)" />
        <circle cx="145" cy="170" r="2" fill="rgba(20,184,166,0.25)" />
        <circle cx="55" cy="170" r="2.5" fill="rgba(20,184,166,0.3)" />
        <circle cx="20" cy="105" r="2" fill="rgba(20,184,166,0.25)" />
        <circle cx="40" cy="40" r="2.5" fill="rgba(20,184,166,0.3)" />
      </svg>

      {/* Sparkle icon top-right */}
      <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-teal-400" />
      </div>

      {/* Document icon bottom-left */}
      <div className="absolute bottom-4 left-2 w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
        <FileText className="w-4 h-4 text-teal-400" />
      </div>
    </div>
  );
}

// ─── Skeleton Placeholder Cards ─────────────────────────────────────────────
function SkeletonCards() {
  return (
    <div className="flex gap-3 justify-center my-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-40 h-24 rounded-lg bg-[#0d1117] border border-white/5 p-3 flex flex-col justify-between"
        >
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-white/10 w-3/4" />
            <div className="h-2 rounded-full bg-white/5 w-1/2" />
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 rounded-full bg-white/5 w-full" />
            <div className="h-1.5 rounded-full bg-white/5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Report Card Thumbnail ──────────────────────────────────────────────────
function ReportThumbnail({
  badge,
  badgeColor,
}: {
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="w-32 h-full min-h-[140px] rounded-lg bg-gradient-to-br from-[#0d1117] via-[#111827] to-[#0d1117] border border-white/5 flex-shrink-0 relative overflow-hidden flex items-end p-3">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-teal-500/5 rounded-full blur-xl" />
      <span
        className={`relative z-10 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}
      >
        {badge}
      </span>
    </div>
  );
}

// ─── STATE 1: Empty State ───────────────────────────────────────────────────
function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-8 max-w-full">
      {/* Main Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 p-8 md:p-12 text-center relative overflow-hidden">
        {/* Decorative glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <NetworkIllustration />

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
            Your Intelligence Archive is Ready
          </h1>

          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-2 leading-relaxed">
            Initialize your data streams to activate advanced analytics. After
            completing the{" "}
            <span className="text-teal-400">Strategic Scan</span>, you will
            unlock high-fidelity reports, including a{" "}
            <strong className="text-white">96.2 percentile rank</strong> and{" "}
            <span className="text-teal-400">+24.8%</span> competitive delta
            analysis.
          </p>

          <SkeletonCards />

          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition mt-2"
          >
            Start Strategic Scan 🚀
          </button>

          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-4">
            Estimated Processing Time: 120 Seconds
          </p>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Database className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-white">2.4TB</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">
            Processed
          </p>
        </div>
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-white">140+</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">
            Global Sources
          </p>
        </div>
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-teal-400">Real-time</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">
            Latency
          </p>
        </div>
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-white">End-to-End</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">
            Encryption
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── STATE 2: Active Analysis State ─────────────────────────────────────────
function ActiveState() {
  const reports = [
    {
      badge: "STRATEGIC",
      badgeColor: "bg-green-500/20 text-green-400",
      title: "Strategic Scan Summary",
      subtitle: "Generated 14 hours ago \u2022 ID: AX-9902",
      metrics: [
        {
          label: "GLOBAL POSITION",
          value: "96.2 Percentile",
          sub: "Top 4%",
          valueColor: "text-teal-400",
          subColor: "text-teal-400",
        },
        {
          label: "COMPETITIVE EDGE",
          value: "+24.8% Competitive Delta",
          sub: null,
          valueColor: "text-white",
          subColor: "",
          icon: <TrendingUp className="w-4 h-4 text-teal-400 inline ml-1" />,
        },
        {
          label: "RISK VECTOR",
          value: "Minimal (0.04)",
          sub: null,
          valueColor: "text-white",
          subColor: "",
          icon: (
            <ArrowDownRight className="w-4 h-4 text-green-400 inline ml-1" />
          ),
        },
      ],
    },
    {
      badge: "OPERATIONS",
      badgeColor: "bg-green-500/20 text-green-400",
      title: "Operations Deep Dive",
      subtitle: "Generated Yesterday at 18:42 \u2022 ID: OP-4412",
      metrics: [
        {
          label: "EFFICIENCY RATING",
          value: "98.4% Optimized",
          sub: null,
          valueColor: "text-teal-400",
          subColor: "",
        },
        {
          label: "LATENCY DELTA",
          value: "-12.4ms Advantage",
          sub: null,
          valueColor: "text-teal-400",
          subColor: "",
          icon: <Zap className="w-4 h-4 text-yellow-400 inline ml-1" />,
        },
        {
          label: "RESOURCE YIELD",
          value: "1.4x Target",
          sub: null,
          valueColor: "text-white",
          subColor: "",
        },
      ],
    },
    {
      badge: "MARKET",
      badgeColor: "bg-orange-500/20 text-orange-400",
      title: "Market Intelligence Analysis",
      subtitle: "Generated 3 days ago \u2022 ID: MK-1108",
      metrics: [
        {
          label: "SENTIMENT INDEX",
          value: "Bullish (0.88) Positive",
          sub: null,
          valueColor: "text-white",
          subColor: "",
        },
        {
          label: "GROWTH FORECAST",
          value: "+31.2% Projected",
          sub: null,
          valueColor: "text-teal-400",
          subColor: "",
          icon: (
            <ArrowUpRight className="w-4 h-4 text-teal-400 inline ml-1" />
          ),
        },
        {
          label: "MARKET SHARE",
          value: "Dominant Tier",
          sub: null,
          valueColor: "text-white",
          subColor: "",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-full relative pb-20">
      {/* Breadcrumb */}
      <p className="text-[10px] text-teal-400 uppercase font-bold tracking-widest">
        Intelligence{" "}
        <span className="text-gray-500 mx-1">/</span> Systems{" "}
        <span className="text-gray-500 mx-1">/</span> Reports
      </p>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Architectural Insights
          </h1>
          <p className="text-gray-400 text-sm mt-2 max-w-xl">
            Comprehensive analytical breakdowns of your orbital infrastructure
            and market positioning metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white text-sm font-semibold hover:bg-white/5 transition">
            <Download className="w-4 h-4" />
            Export All
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
            <Plus className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111827] border border-white/5">
          <span className="text-[10px] text-orange-400 font-bold uppercase">
            Category
          </span>
          <span className="text-sm text-white">All Systems</span>
          <ChevronRight className="w-3 h-3 text-gray-500 rotate-90" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111827] border border-white/5">
          <span className="text-[10px] text-orange-400 font-bold uppercase">
            Date Range
          </span>
          <span className="text-sm text-white">Last 30 Days</span>
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111827] border border-white/5">
          <span className="text-[10px] text-orange-400 font-bold uppercase">
            Status
          </span>
          <span className="flex items-center gap-1.5 text-sm text-white">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Completed
          </span>
        </div>
        <button className="text-xs text-gray-500 hover:text-gray-300 transition ml-1">
          Clear All Filters
        </button>
      </div>

      {/* Report Cards */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.title}
            className="rounded-xl bg-[#111827] border border-white/5 p-4 md:p-5 flex gap-4 md:gap-6 hover:border-white/10 transition cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="hidden sm:block">
              <ReportThumbnail
                badge={report.badge}
                badgeColor={report.badgeColor}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  {/* Mobile badge */}
                  <span
                    className={`sm:hidden inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mb-2 ${report.badgeColor}`}
                  >
                    {report.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {report.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {report.subtitle}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {report.metrics.map((metric) => (
                  <div key={metric.label}>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">
                      {metric.label}
                    </p>
                    <p
                      className={`text-sm font-semibold ${metric.valueColor}`}
                    >
                      {metric.value}
                      {metric.icon && metric.icon}
                    </p>
                    {metric.sub && (
                      <p
                        className={`text-xs mt-0.5 ${metric.subColor}`}
                      >
                        {metric.sub}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-xs text-teal-400/70 text-center pt-4">
        End of generated reports for current architectural cycle. Next automated
        scan in{" "}
        <span className="text-teal-400 font-semibold">4h 12m</span>.
      </p>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 flex items-center justify-center transition z-50">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [hasReports, setHasReports] = useState(false);

  return hasReports ? (
    <ActiveState />
  ) : (
    <EmptyState onStart={() => setHasReports(true)} />
  );
}
