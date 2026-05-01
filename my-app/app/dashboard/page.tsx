"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Radar,
  FileText,
  Lock,
  RotateCcw,
  Sparkles,
  Shield,
} from "lucide-react";

// ─── Toggle this to switch between empty and active states ───────────────────
const HAS_SCANS = false; // Set to true to see the active/returning user state

// ─── Empty State (Welcome to PICA) ──────────────────────────────────────────
function EmptyState() {
  return (
    <div className="space-y-6 max-w-full">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] overflow-hidden p-6 md:p-10 border border-white/5">
        {/* Decorative glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex-1 min-w-0">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider mb-4">
              New Workspace Activated
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Welcome to <span className="text-orange-400">PICA</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-lg mb-6">
              Unlock architectural precision in your business strategy. PICA illuminates
              hidden pain points and maps the celestial trajectory of your organization
              through deep-data intelligence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/strategic-scan"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
              >
                Start Your First Strategic Scan
                <Sparkles className="w-4 h-4" />
              </Link>
              <button className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition">
                View Onboarding Guide
              </button>
            </div>
          </div>

          {/* Decorative visual placeholder */}
          <div className="hidden lg:flex items-center justify-center w-52 h-40 rounded-xl bg-gradient-to-br from-teal-500/10 to-purple-500/10 border border-white/5">
            <div className="w-20 h-20 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <Radar className="w-8 h-8 text-teal-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Identify Pain Points + Predictive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identify Pain Points */}
        <div className="lg:col-span-2 rounded-2xl bg-[#111827] border border-white/5 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Identify Pain Points</h3>
              <p className="text-gray-400 text-sm mt-1">
                Our proprietary Strategic Scan analyzes your operational data to find
                inefficiencies before they become liabilities. It&apos;s the first step to building a
                resilient business architecture.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-4 py-3 rounded-lg bg-[#0d1117] border border-teal-500/20">
              <p className="text-[10px] text-orange-400 font-bold uppercase">Step 01</p>
              <p className="text-sm text-white mt-0.5">Connect Data Source</p>
            </div>
            <div className="px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5">
              <p className="text-[10px] text-gray-500 font-bold uppercase">Step 02</p>
              <p className="text-sm text-gray-400 mt-0.5">AI Analysis</p>
            </div>
          </div>
        </div>

        {/* Predictive Insights */}
        <div className="rounded-2xl bg-[#111827] border border-white/5 p-6 relative overflow-hidden">
          <span className="absolute top-4 right-4 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-500/20 text-teal-400">
            Coming Soon
          </span>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Predictive Insights</h3>
          {/* Skeleton lines */}
          <div className="space-y-2 mb-4">
            <div className="h-2 rounded-full bg-blue-500/30 w-full" />
            <div className="h-2 rounded-full bg-blue-500/20 w-4/5" />
            <div className="h-2 rounded-full bg-blue-500/30 w-full" />
            <div className="h-2 rounded-full bg-blue-500/20 w-3/5" />
          </div>
          <p className="text-xs text-gray-500">
            Automated intelligence gathering based on your first 3 scans.
          </p>
        </div>
      </div>

      {/* Industry Benchmarks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Industry Benchmarks</h2>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-500/20 text-orange-400">
            Locked <Lock className="w-3 h-3" />
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-[#111827] border border-white/5 p-6 h-28 flex items-end"
            >
              {i === 0 && (
                <p className="text-xs text-gray-500">Requires 1 Scan</p>
              )}
              {/* Skeleton bars */}
              <div className="w-full space-y-1.5">
                <div className="h-1.5 rounded-full bg-white/5 w-3/4" />
                <div className="h-1.5 rounded-full bg-white/5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No Scan Activity */}
      <div className="rounded-2xl bg-[#111827] border border-white/5 p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-7 h-7 text-gray-500" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Scan Activity Yet</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
          Your strategic journey begins here. Complete your first scan to see results,
          recommendations, and comparative data.
        </p>
        <Link
          href="/dashboard/strategic-scan"
          className="inline-flex items-center gap-1 text-teal-400 text-sm font-bold uppercase tracking-wide hover:text-teal-300 transition"
        >
          Learn How It Works <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Active State (Returning User) ──────────────────────────────────────────
function ActiveState() {
  const stats = [
    {
      label: "Overall Score",
      value: "85%",
      trend: "+2.4",
      barColor: "bg-teal-400",
      barWidth: "w-[85%]",
    },
    {
      label: "Modules Completed",
      value: "3/5",
      sub: "Next: Finance",
      dots: [true, true, true, false, false],
    },
    {
      label: "Risk Level",
      value: "Low",
      valueColor: "text-green-400",
      sub: "System integrity verified 2 hours ago.",
      hasShield: true,
    },
  ];

  const scanSteps = [
    { label: "Data Feed", status: "Completed", icon: CheckCircle2, color: "text-green-400 bg-green-400/20" },
    { label: "Risk Mapping", status: "Processing...", icon: Radar, color: "text-teal-400 bg-teal-400/20" },
    { label: "Benchmark", status: "Pending", icon: FileText, color: "text-gray-500 bg-white/5" },
    { label: "Final Report", status: "Locked", icon: Lock, color: "text-gray-500 bg-white/5" },
  ];

  const assessments = [
    { name: "Financial Health Index", type: "Quarterly Audit", status: "Optimized", statusColor: "text-green-400", score: "92/100", date: "Mar 24, 2026" },
    { name: "Supply Chain Resilience", type: "External Scan", status: "Analyzing", statusColor: "text-yellow-400", score: "Pending", date: "Mar 22, 2026" },
    { name: "Talent Retention Bench", type: "HR Analytics", status: "Attention", statusColor: "text-red-400", score: "64/100", date: "Mar 18, 2026" },
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* Greeting Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] overflow-hidden p-6 md:p-10 border border-white/5">
        <div className="absolute right-0 top-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
            Good morning, Alex.
          </h1>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-orange-400 leading-tight">
            PICA is monitoring your performance.
          </h2>
          <p className="text-gray-400 text-sm mt-3">
            Operational efficiency is up 12% since your last scan. Explore your latest benchmarks below.
          </p>
        </div>
      </div>

      {/* Stats + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Stats Cards */}
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-[#111827] border border-white/5 p-5"
          >
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
              {stat.label}
            </p>
            <div className="flex items-end gap-2">
              <p className={`text-3xl font-bold ${stat.valueColor || "text-white"}`}>
                {stat.value}
              </p>
              {stat.trend && (
                <span className="text-xs text-teal-400 flex items-center gap-0.5 mb-1">
                  <TrendingUpIcon /> {stat.trend}
                </span>
              )}
              {stat.hasShield && <Shield className="w-4 h-4 text-teal-400 mb-1" />}
            </div>
            {stat.sub && <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>}
            {stat.barColor && (
              <div className="mt-3 h-1.5 rounded-full bg-white/5">
                <div className={`h-full rounded-full ${stat.barColor} ${stat.barWidth}`} />
              </div>
            )}
            {stat.dots && (
              <div className="flex gap-1.5 mt-3">
                {stat.dots.map((filled, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${filled ? "bg-teal-400" : "bg-white/10"}`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* AI Insight Pulse */}
        <div className="rounded-xl bg-[#111827] border border-teal-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
            <h3 className="text-sm font-bold text-white">AI Insight Pulse</h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            &ldquo;We&apos;ve detected a shift in your <strong className="text-white">Operations</strong> pillar.
            Relative efficiency has dipped 4% vs top-tier benchmarks. We recommend an immediate
            deep-dive into supply chain latency.&rdquo;
          </p>
          <button className="mt-4 w-full py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition">
            Explore Variance
          </button>
        </div>
      </div>

      {/* Scan Progress + Action + Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scan Completion Progress */}
        <div className="lg:col-span-2 rounded-xl bg-[#111827] border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white">Scan Completion Progress</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-500/20 text-teal-400">
              In Progress
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-8">
            {scanSteps.map((step) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step.color}`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className={`text-[10px] ${step.status === "Completed" ? "text-green-400" : step.status === "Processing..." ? "text-teal-400" : "text-gray-500"}`}>
                    {step.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Action + Team Activity */}
        <div className="flex flex-col gap-4">
          {/* Start Strategic Scan CTA */}
          <Link
            href="/dashboard/strategic-scan"
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-5 flex items-center justify-between hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            <div>
              <p className="text-[10px] text-orange-200 font-bold uppercase">Available Action</p>
              <p className="text-lg font-bold text-white">Start Strategic Scan</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </Link>

          {/* Team Activity */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white">Team Activity</h4>
              <span className="text-gray-500 text-xs">...</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">Sarah Miller</p>
                  <p className="text-xs text-gray-500 truncate">Updated Finance Module</p>
                </div>
                <span className="text-[10px] text-gray-500 flex-shrink-0">12m</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-teal-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">David Chen</p>
                  <p className="text-xs text-gray-500 truncate">Downloaded Q3 Report</p>
                </div>
                <span className="text-[10px] text-gray-500 flex-shrink-0">2h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="rounded-2xl bg-[#111827] border border-white/5 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Assessments</h3>
            <p className="text-xs text-gray-500">Last 5 modules processed across all departments.</p>
          </div>
          <button className="text-teal-400 text-sm font-semibold flex items-center gap-1 hover:text-teal-300 transition">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider">
                <th className="text-left pb-3 font-semibold">Assessment Name</th>
                <th className="text-left pb-3 font-semibold">Status</th>
                <th className="text-left pb-3 font-semibold">Score</th>
                <th className="text-left pb-3 font-semibold">Completion Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assessments.map((a) => (
                <tr key={a.name} className="text-sm">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`flex items-center gap-1.5 text-sm ${a.statusColor}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {a.status}
                    </span>
                  </td>
                  <td className="py-4 font-semibold text-white">{a.score}</td>
                  <td className="py-4 text-gray-400">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Small SVG icon helper ───────────────────────────────────────────────────
function TrendingUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function DashboardHomePage() {
  return HAS_SCANS ? <ActiveState /> : <EmptyState />;
}
