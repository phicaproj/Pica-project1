"use client";

import { useState } from "react";
import {
  FileText,
  Flag,
  ClipboardList,
  Activity,
  Eye,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
} from "lucide-react";

const REPORTS = [
  {
    id: 1,
    business: "Stellar Dynamics Inc.",
    ref: "ENT-00912",
    tier: "2A",
    date: "Oct 24, 2023",
    pillars: ["emerald", "emerald", "amber", "gray"],
    score: 82,
    status: "Complete",
    statusColor: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  {
    id: 2,
    business: "Vanguard Logistics",
    ref: "SMB-44122",
    tier: "1A",
    date: "Oct 23, 2023",
    pillars: ["red", "amber", "gray", "gray"],
    score: 34,
    status: "Flagged",
    statusColor: "text-red-400",
    dot: "bg-red-500",
  },
  {
    id: 3,
    business: "Nexus Healthcare",
    ref: "MED-00213",
    tier: "2B",
    date: "Oct 22, 2023",
    pillars: ["emerald", "emerald", "emerald", "emerald"],
    score: 94,
    status: "Under Review",
    statusColor: "text-amber-400",
    dot: "bg-amber-500",
  },
  {
    id: 4,
    business: "OmniRetail Solutions",
    ref: "RET-11822",
    tier: "1A",
    date: "Oct 21, 2023",
    pillars: ["amber", "amber", "amber", "emerald"],
    score: 61,
    status: "Complete",
    statusColor: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  {
    id: 5,
    business: "Cascade Financial",
    ref: "FIN-30029",
    tier: "2A",
    date: "Oct 20, 2023",
    pillars: ["emerald", "emerald", "emerald", "amber"],
    score: 89,
    status: "Complete",
    statusColor: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  {
    id: 6,
    business: "MetroCore Technologies",
    ref: "ENT-50104",
    tier: "2B",
    date: "Oct 19, 2023",
    pillars: ["red", "red", "amber", "gray"],
    score: 28,
    status: "Flagged",
    statusColor: "text-red-400",
    dot: "bg-red-500",
  },
];

const PILLAR_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-gray-600",
};

export default function ReportsPage() {
  const [activeTier, setActiveTier] = useState("All Tiers");

  const filtered =
    activeTier === "All Tiers"
      ? REPORTS
      : REPORTS.filter((r) => r.tier === activeTier);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Report Management</h1>
        <p className="text-gray-400 text-sm">Monitor and audit business intelligence deliverables.</p>
      </div>

      {/* Stat Banner with background image */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#111318]/65" />

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Total Reports Generated</div>
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">1,284</div>
            <div className="text-xs font-semibold text-emerald-400">+12% ↗</div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">High-Risk Flags</div>
              <Flag className="w-4 h-4 text-red-400 flex-shrink-0" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">42</div>
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Critical</span>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Pending Reviews</div>
              <ClipboardList className="w-4 h-4 text-amber-400 flex-shrink-0" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">18</div>
            <div className="text-xs text-amber-400 font-semibold">Action Required</div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Avg. Diagnostic Score</div>
              <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">78.4%</div>
            <div className="h-1 w-full bg-white/10 rounded-full">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "78%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Diagnostic Tier</div>
          <div className="flex gap-2">
            {["All Tiers", "1A", "2A", "2B"].map((tier) => (
              <button
                key={tier}
                onClick={() => setActiveTier(tier)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeTier === tier
                    ? "bg-blue-500 text-white"
                    : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:ml-auto flex gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Score Range</div>
            <select className="bg-[#1C1F2E] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50">
              <option>All Ranges</option>
              <option>0 – 40 (High Risk)</option>
              <option>41 – 70 (Moderate)</option>
              <option>71 – 100 (Healthy)</option>
            </select>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Date Range</div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1F2E] border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-colors">
                <Calendar className="w-4 h-4" /> Oct 01 – Oct 31, 2023
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1F2E] border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["BUSINESS NAME", "TIER", "DATE GENERATED", "PILLAR HEALTH", "STATUS", "ACTIONS"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((report) => (
                <tr key={report.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-white">{report.business}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{report.ref}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
                      {report.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{report.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {report.pillars.map((color, i) => (
                        <div key={i} className={`w-5 h-5 rounded-sm ${PILLAR_COLORS[color]}`} />
                      ))}
                      <span className="text-xs text-gray-400 ml-2 font-medium">{report.score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${report.dot}`} />
                      <span className={`text-sm font-medium ${report.statusColor}`}>{report.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-500/10 text-gray-400 hover:text-amber-400 transition-colors"><Flag className="w-4 h-4" /></button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <span className="text-sm text-gray-500">Showing 1-4 of 1,284 reports</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5"><ChevronLeft className="w-4 h-4" /></button>
            {[1, 2, 3, "...", 42].map((p, i) => (
              <button key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === 1 ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>{p}</button>
            ))}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}