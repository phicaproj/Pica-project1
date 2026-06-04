"use client";

import { useState } from "react";
import {
  Scale,
  Users,
  Shield,
  Package,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  BarChart3,
  TrendingUp,
  Clock,
} from "lucide-react";

const ASSESSMENTS = [
  {
    id: "ASM-8820-X",
    name: "Fiscal Integrity 2024",
    domain: "Finance",
    questions: 48,
    complexity: 85,
    status: "ACTIVE",
    statusColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: Scale,
    iconColor: "bg-blue-500/20 text-blue-400",
  },
  {
    id: "ASM-1204-Q",
    name: "Workplace Cultural Pulse",
    domain: "HR",
    questions: 12,
    complexity: 30,
    status: "DRAFT",
    statusColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    icon: Users,
    iconColor: "bg-purple-500/20 text-purple-400",
  },
  {
    id: "ASM-4491-K",
    name: "ISO 27001 Readiness",
    domain: "SecOps",
    questions: 112,
    complexity: 90,
    status: "ACTIVE",
    statusColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: Shield,
    iconColor: "bg-emerald-500/20 text-emerald-400",
  },
  {
    id: "ASM-3301-Z",
    name: "Supply Chain Resilience",
    domain: "Logistics",
    questions: 34,
    complexity: 60,
    status: "ACTIVE",
    statusColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: Package,
    iconColor: "bg-orange-500/20 text-orange-400",
  },
];

const CATEGORIES = [
  "Finance & Risk",
  "HR & Culture",
  "Cybersecurity",
  "Operations",
  "Logistics",
  "ESG & Sustainability",
];

export default function AssessmentBuilderPage() {
  const [selectedCategory, setSelectedCategory] = useState("Finance & Risk");
  const [assessmentName, setAssessmentName] = useState("");

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Configuration Engine</h1>
          <p className="text-gray-400 text-sm">Manage and deploy diagnostic tests across the ecosystem.</p>
        </div>
        <div className="flex gap-8 flex-shrink-0">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Active</div>
            <div className="text-2xl font-bold text-white">42</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Drafts</div>
            <div className="text-2xl font-bold text-amber-400">18</div>
          </div>
        </div>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* New Definition */}
          <div className="relative bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
            <div
              className="absolute top-0 right-0 w-48 h-full bg-cover bg-right bg-no-repeat opacity-20 pointer-events-none"
              style={{ backgroundImage: "url('/images/dashboard img')" }}
            />
            <div className="relative z-10 p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h2 className="text-lg font-semibold text-white">New Definition</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Assessment Name</label>
                  <input
                    type="text"
                    value={assessmentName}
                    onChange={(e) => setAssessmentName(e.target.value)}
                    placeholder="e.g. Q4 Financial Integrity Audit"
                    className="w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Category</label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none bg-[#111318] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors pr-10"
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <button className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors">
                  Initialize Configuration
                </button>
              </div>
            </div>
          </div>

          {/* Engine Health */}
          <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Engine Health</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-400">STABLE</span>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-16 mb-4">
              {[3,5,4,6,5,7,6,8,7,9,8,10].map((h, i) => (
                <div key={i} className={`flex-1 rounded-sm ${i >= 9 ? "bg-blue-500" : "bg-white/10"}`} style={{ height: `${h * 10}%` }} />
              ))}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              System processing <span className="text-white font-semibold">12.4k</span> queries per second across active assessment instances.
            </p>
          </div>
        </div>

        {/* Right — Active Inventory table */}
        <div className="lg:col-span-3 bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">Active Inventory</h2>
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["IDENTIFICATION","DOMAIN","COMPLEXITY","STATUS","DIRECTIVES"].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSESSMENTS.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.iconColor}`}>
                          <a.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{a.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">ID: {a.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{a.domain}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-white/10 rounded-full">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${a.complexity}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{a.questions} Q</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${a.statusColor}`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">Configure →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <span className="text-sm text-gray-500">Showing 4 of 60 Assessments</span>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">Previous</button>
              <button className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm text-white font-semibold transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stat strip with bg image */}
      <div className="relative rounded-2xl overflow-hidden pb-2">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/dashboard img')" }} />
        <div className="absolute inset-0 bg-[#111318]/75" />
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
          {[
            { label: "Average Completion", value: "84.2%", icon: BarChart3, color: "bg-blue-500/20 text-blue-400", valueColor: "text-white" },
            { label: "Deployment Rate", value: "+12% MoM", icon: TrendingUp, color: "bg-emerald-500/20 text-emerald-400", valueColor: "text-emerald-400" },
            { label: "System Uptime", value: "99.98%", icon: Clock, color: "bg-red-500/20 text-red-400", valueColor: "text-white" },
          ].map((s, i) => (
            <div key={i} className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                <div className={`text-2xl font-bold ${s.valueColor}`}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}