"use client";

import {
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  SlidersHorizontal,
  CreditCard,
  Building2,
  Eye,
  Download,
  Shield,
  CircleDot,
} from "lucide-react";

const TRANSACTIONS = [
  {
    id: "#TX-94021",
    initials: "JD",
    color: "bg-blue-500",
    name: "Julianne Devis",
    email: "j.devis@enterprise.com",
    date: "Oct 24, 2024",
    amount: "$1,450.00",
    method: "Visa •• 4242",
    methodIcon: "card",
    status: "SUCCESS",
    statusColor: "text-emerald-400 bg-emerald-400/10",
  },
  {
    id: "#TX-94018",
    initials: "MK",
    color: "bg-purple-500",
    name: "Marcus Knight",
    email: "m.knight@techflow.io",
    date: "Oct 24, 2024",
    amount: "$2,900.00",
    method: "Bank Transfer",
    methodIcon: "bank",
    status: "PENDING",
    statusColor: "text-amber-400 bg-amber-400/10",
  },
  {
    id: "#TX-93992",
    initials: "SA",
    color: "bg-teal-500",
    name: "Sarah Al-Farsi",
    email: "sarah.a@global.net",
    date: "Oct 23, 2024",
    amount: "$12,400.00",
    method: "Mastercard •• 8812",
    methodIcon: "card",
    status: "SUCCESS",
    statusColor: "text-emerald-400 bg-emerald-400/10",
  },
  {
    id: "#TX-93988",
    initials: "ER",
    color: "bg-orange-500",
    name: "Erik Rosen",
    email: "e.rosen@nordic.se",
    date: "Oct 23, 2024",
    amount: "$550.00",
    method: "Visa •• 1009",
    methodIcon: "card",
    status: "FAILED",
    statusColor: "text-red-400 bg-red-400/10",
  },
];

// Simple SVG line chart data points for Revenue Velocity
const chartPoints = [
  { x: 0, y: 80 }, { x: 60, y: 120 }, { x: 130, y: 90 },
  { x: 200, y: 60 }, { x: 290, y: 40 }, { x: 380, y: 30 },
  { x: 450, y: 50 }, { x: 520, y: 20 },
];
const toPath = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

export default function PaymentsPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Payment Management</h1>
        <p className="text-gray-400 text-sm max-w-xl">
          Central hub for transaction monitoring, automated settlement handling, and
          real-time revenue analytics across global regions.
        </p>
      </div>

      {/* Stat Banner with background image */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#111318]/65" />

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/5">
          {/* Total Revenue */}
          <div className="p-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Total Revenue</div>
            <div className="text-3xl font-bold text-white mb-2">$1.42M</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> +12.4%
            </div>
            <div className="mt-3 flex items-end gap-0.5 h-8">
              {[3,5,4,7,6,8,7,9].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-500/40 rounded-sm" style={{ height: `${h * 10}%` }} />
              ))}
            </div>
          </div>

          {/* ARR Estimate */}
          <div className="p-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">ARR Estimate</div>
            <div className="text-3xl font-bold text-white mb-2">$4.85M</div>
            <div className="text-xs text-gray-400">Projected end of FY24</div>
            <div className="mt-3">
              <svg viewBox="0 0 100 30" className="w-full h-8">
                <polyline
                  points="0,25 15,20 30,22 45,15 60,18 75,10 90,12 100,5"
                  fill="none" stroke="#3b82f6" strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>

          {/* Pending Payouts */}
          <div className="p-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pending Payouts</div>
            <div className="text-3xl font-bold text-orange-400 mb-2">$142.2k</div>
            <div className="text-xs text-gray-400">Scheduled for Fri, Oct 24</div>
            <div className="mt-3 relative w-16 h-8 flex items-center justify-center">
              <svg viewBox="0 0 60 34" className="w-full h-full">
                <path d="M 5 30 A 25 25 0 0 1 55 30" fill="none" stroke="#374151" strokeWidth="6" />
                <path d="M 5 30 A 25 25 0 0 1 55 30" fill="none" stroke="#f97316" strokeWidth="6" strokeDasharray="78.5" strokeDashoffset="25" />
              </svg>
            </div>
          </div>

          {/* Success Rate */}
          <div className="p-6">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Success Rate</div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="transparent" stroke="#1f2937" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="transparent" stroke="#10b981" strokeWidth="3"
                    strokeDasharray="94.25" strokeDashoffset="5.66" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">99%</span>
                </div>
              </div>
              <div className="text-sm text-gray-400">Optimization in progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Velocity + Fraud Prevention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Revenue Velocity</h2>
              <p className="text-sm text-gray-400">Monthly earnings trajectory over the last 6 months</p>
            </div>
            <div className="flex bg-[#111318] rounded-lg p-1 border border-white/5">
              {["6M", "1Y", "MAX"].map((t) => (
                <button key={t} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${t === "6M" ? "bg-[#2A2E3D] text-white" : "text-gray-400 hover:text-white"}`}>{t}</button>
              ))}
            </div>
          </div>

          {/* SVG area chart */}
          <div className="relative h-48">
            <svg viewBox="0 0 520 140" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0,35,70,105,140].map((y) => (
                <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="#ffffff08" strokeWidth="1" />
              ))}
              {/* Area fill */}
              <path d="M 0 120 L 80 100 L 160 110 L 240 80 L 320 55 L 400 40 L 520 30 L 520 140 L 0 140 Z"
                fill="url(#revGrad)" />
              {/* Line */}
              <path d="M 0 120 L 80 100 L 160 110 L 240 80 L 320 55 L 400 40 L 520 30"
                fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {/* X labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-1">
              {["MAY","JUN","JUL","AUG","SEP","OCT"].map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>

        {/* Fraud Prevention */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          {/* mini preview image */}
          <div className="relative h-44 bg-[#161925] overflow-hidden flex-shrink-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: "url('/images/dashboard img')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1C1F2E]" />
            {/* Live badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Global Operations Live</span>
            </div>
          </div>
          <div className="p-5 flex flex-col flex-1">
            <h3 className="text-xl font-bold text-white mb-3">Intelligent Fraud Prevention</h3>
            <p className="text-sm text-gray-400 mb-5 flex-1">
              PICA Kinetic AI is currently monitoring 1,204 active sessions for anomalous transaction patterns.
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" /> Review Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Transaction History</h2>
          <div className="flex gap-2 flex-wrap">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-colors">
              <Calendar className="w-3.5 h-3.5" /> Last 30 Days
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Status
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-colors">
              <CreditCard className="w-3.5 h-3.5" /> Method
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["TRANSACTION ID","CUSTOMER","DATE","AMOUNT","METHOD","STATUS","ACTIONS"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{tx.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${tx.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {tx.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{tx.name}</div>
                        <div className="text-xs text-gray-500">{tx.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{tx.date}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{tx.amount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      {tx.methodIcon === "card"
                        ? <CreditCard className="w-4 h-4 text-gray-500" />
                        : <Building2 className="w-4 h-4 text-gray-500" />
                      }
                      {tx.method}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tx.statusColor}`}>
                      • {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <span className="text-sm text-gray-500">Showing 1-4 of 1,248 transactions</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[1, 2, 3].map((p) => (
              <button key={p} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === 1 ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>{p}</button>
            ))}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}