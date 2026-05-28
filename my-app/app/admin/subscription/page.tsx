"use client";

import {
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight,
  Download,
  SlidersHorizontal,
  CreditCard,
  Building2,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";

const SUBSCRIBERS = [
  {
    initials: "NL",
    color: "bg-blue-500",
    name: "Nova Labs Inc.",
    email: "billing@novalabs.io",
    plan: "Plan 2A (Professional)",
    planDot: "bg-emerald-500",
    method: "Visa ending in 4429",
    methodIcon: "card",
    amount: "$79.00",
    amountSub: "Oct 12, 2023",
    amountColor: "text-white",
  },
  {
    initials: "AS",
    color: "bg-indigo-500",
    name: "Apex Systems",
    email: "finance@apex.com",
    plan: "Plan 2B (Enterprise)",
    planDot: "bg-amber-500",
    method: "Bank Transfer (ACH)",
    methodIcon: "bank",
    amount: "$1,250.00",
    amountSub: "Oct 09, 2023",
    amountColor: "text-white",
  },
  {
    initials: "QC",
    color: "bg-orange-500",
    name: "Quantum Core",
    email: "admin@qcore.tech",
    plan: "Plan 1A (Past Due)",
    planDot: "bg-red-500",
    method: "Mastercard ending in 1102",
    methodIcon: "card",
    amount: "$29.00",
    amountSub: "Failed Oct 01",
    amountColor: "text-red-400",
  },
];

export default function SubscriptionPage() {
  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">

      {/* Header row */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Monetization Control</h1>
          <p className="text-gray-400 text-sm max-w-lg">
            Configure core billing structures, plan feature sets, and manage global subscriber
            lifecycle events from the Obsidian command deck.
          </p>
        </div>
        <div className="flex gap-8 flex-shrink-0">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">ARR Estimate</div>
            <div className="text-2xl font-bold text-emerald-400">$2.4M</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Active Users</div>
            <div className="text-2xl font-bold text-white">12.8k</div>
          </div>
        </div>
      </div>

      {/* Plans + System Health — background image section */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Dashboard background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#111318]/70" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Plan Cards — col-span-3 */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
            {/* Standard */}
            <div className="bg-[#1C1F2E]/80 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Plan 1A</span>
                <button className="text-gray-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Standard</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-white">$29</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {["10 Team Members", "50 Assessments/mo"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4 flex-shrink-0" />Advanced Scoring
                </li>
              </ul>
              <button className="w-full py-2.5 border border-white/20 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-wider">
                Edit Features
              </button>
            </div>

            {/* Professional — featured */}
            <div className="relative bg-[#1e2235] border border-blue-500/40 rounded-2xl p-5 flex flex-col shadow-lg shadow-blue-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Best Seller
              </div>
              <div className="flex justify-between items-center mb-4 mt-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded">Plan 2A</span>
                <button className="text-gray-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Professional</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-blue-400">$79</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {["Unlimited Teams", "500 Assessments/mo", "Advanced Scoring"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 bg-white text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors uppercase tracking-wider">
                Edit Features
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-[#1C1F2E]/80 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Plan 2B</span>
                <button className="text-gray-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold text-white">Custom</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {["White-labeling", "Priority Support", "API Access"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 border border-white/20 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-wider">
                Manage Quotes
              </button>
            </div>
          </div>

          {/* System Health — col-span-1 */}
          <div className="border-l border-white/5 p-6 flex flex-col gap-5">
            <h3 className="flex items-center gap-2 text-white font-semibold">
              <Zap className="w-4 h-4 text-yellow-400" /> System Health
            </h3>

            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Churn Rate</div>
              <div className="text-2xl font-bold text-red-400 mb-2">2.4%</div>
              <div className="h-1.5 w-full bg-white/10 rounded-full">
                <div className="h-full bg-red-400 rounded-full" style={{ width: "24%" }} />
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Trial Conversion</div>
              <div className="text-2xl font-bold text-emerald-400 mb-2">64%</div>
              <div className="h-1.5 w-full bg-white/10 rounded-full">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: "64%" }} />
              </div>
            </div>

            <div className="mt-auto bg-[#1C1F2E]/80 border border-white/10 rounded-xl p-4">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Next Payout Cycle</div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Oct 24, 2023</span>
                <span className="text-sm font-bold text-emerald-400">$182,400.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Subscribers Table */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Active Subscribers & Billing History</h2>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["CUSTOMER", "PLAN STATUS", "PAYMENT METHOD", "LAST AMOUNT", "ACTION"].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SUBSCRIBERS.map((sub, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${sub.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {sub.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{sub.name}</div>
                        <div className="text-xs text-gray-500">{sub.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${sub.planDot}`} />
                      <span className="text-sm text-gray-300">{sub.plan}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      {sub.methodIcon === "card"
                        ? <CreditCard className="w-4 h-4 text-gray-500" />
                        : <Building2 className="w-4 h-4 text-gray-500" />
                      }
                      {sub.method}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-semibold ${sub.amountColor}`}>{sub.amount}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{sub.amountSub}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                      Manage →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <span className="text-sm text-gray-500">Showing 1-10 of 1,240 subscribers</span>
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

      {/* Bottom CTA row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {/* MRR card */}
        <div className="relative rounded-2xl overflow-hidden bg-[#1C1F2E] border border-white/5 p-8 flex flex-col justify-end min-h-[200px]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ backgroundImage: "url('/images/dashboard img')" }}
          />
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-1">Monthly Recurring Revenue</h3>
            <p className="text-gray-400 text-sm mb-4">Steady 12% increase week-over-week.</p>
            <button className="flex items-center gap-2 text-sm font-semibold text-white border-b border-white/30 pb-0.5 hover:border-white transition-colors uppercase tracking-wider">
              View Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create New Tier CTA */}
        <div className="bg-[#1C1F2E] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <ShoppingCart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Create New Tier?</h3>
            <p className="text-gray-400 text-sm max-w-xs">
              Expand your monetization strategy by adding a specific tier for non-profit organizations.
            </p>
          </div>
          <button className="px-6 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
            Launch Plan Wizard
          </button>
        </div>
      </div>

    </div>
  );
}