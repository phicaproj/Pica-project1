"use client";

import {
  Users,
  ShieldCheck,
  CheckSquare,
  HeartPulse,
  MoreHorizontal,
  FileText,
  DollarSign,
  UserPlus,
  AlertCircle,
  Activity,
  Server,
  Headphones
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1C1F2E] rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Users</h3>
            <Users className="text-white/10 w-10 h-10 absolute right-4 top-4" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">12,842</div>
          <div className="flex items-center text-xs">
            <span className="text-emerald-400 font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              14.2%
            </span>
            <span className="text-gray-500 ml-2 uppercase text-[10px] font-semibold">vs last month</span>
          </div>
        </div>

        <div className="bg-[#1C1F2E] rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Active Subscriptions</h3>
            <ShieldCheck className="text-white/10 w-10 h-10 absolute right-4 top-4" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">8,902</div>
          <div className="flex items-center text-xs">
            <span className="text-emerald-400 font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              8.5%
            </span>
            <span className="text-gray-500 ml-2 uppercase text-[10px] font-semibold">of total users</span>
          </div>
        </div>

        <div className="bg-[#1C1F2E] rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Assessments Taken</h3>
            <CheckSquare className="text-white/10 w-10 h-10 absolute right-4 top-4" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">45,321</div>
          <div className="flex items-center text-xs">
            <span className="text-emerald-400 font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              22.1%
            </span>
            <span className="text-gray-500 ml-2 uppercase text-[10px] font-semibold">global engagement</span>
          </div>
        </div>

        <div className="bg-[#1C1F2E] rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Avg Health Score</h3>
            <HeartPulse className="text-white/10 w-10 h-10 absolute right-4 top-4" />
          </div>
          <div className="text-3xl font-bold text-orange-400 mb-3">78.4</div>
          <div className="w-full bg-white/10 rounded-full h-1.5 flex overflow-hidden">
            <div className="bg-orange-400 h-full rounded-full w-[78.4%]"></div>
          </div>
        </div>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview Chart */}
        <div className="bg-[#1C1F2E] rounded-2xl p-6 border border-white/5 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Revenue Overview</h2>
              <p className="text-sm text-gray-400">Global platform earnings and forecast.</p>
            </div>
            <div className="flex bg-[#111318] rounded-md p-1 border border-white/5">
              <button className="px-3 py-1 text-xs font-medium bg-[#2A2E3D] text-white rounded shadow-sm">Monthly</button>
              <button className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white">Quarterly</button>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-auto pb-6 relative">
            {/* Y-axis could be added here, but relying on tooltip per design */}
            {[
              { label: "JAN", h: "40%" },
              { label: "FEB", h: "55%" },
              { label: "MAR", h: "55%" },
              { label: "APR", h: "70%" },
              { label: "MAY", h: "50%" },
              { label: "JUN", h: "85%" },
              { label: "JUL", h: "60%" },
              { label: "AUG", h: "95%", active: true, value: "$34.2k" },
              { label: "SEP", h: "65%" },
              { label: "OCT", h: "50%" },
              { label: "NOV", h: "40%" },
              { label: "DEC", h: "35%" },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="w-full relative flex justify-center h-[180px] items-end">
                  {bar.active && (
                    <div className="absolute -top-8 bg-[#2A2E3D] text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      {bar.value}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#2A2E3D]"></div>
                    </div>
                  )}
                  <div 
                    className={`w-full max-w-[32px] rounded-t-sm transition-all duration-300 ${bar.active ? 'bg-blue-500' : 'bg-[#3A3F58] group-hover:bg-[#4A506E]'}`} 
                    style={{ height: bar.h }}
                  ></div>
                </div>
                <span className="text-[10px] font-semibold text-gray-500 mt-3">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriptions Donut */}
        <div className="bg-[#1C1F2E] rounded-2xl p-6 border border-white/5 flex flex-col items-center">
          <div className="w-full flex justify-start mb-6">
            <h2 className="text-lg font-semibold text-white">Subscriptions</h2>
          </div>
          
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2A2E3D" strokeWidth="12" />
              {/* Enterprise 65% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.65)} className="transition-all duration-1000 ease-out" />
              {/* Professional 25% (starts after 65%) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.25)} transform="rotate(234 50 50)" className="transition-all duration-1000 ease-out delay-300" />
              {/* Standard 10% (starts after 90%) */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.10)} transform="rotate(324 50 50)" className="transition-all duration-1000 ease-out delay-500" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">8.9k</span>
              <span className="text-[9px] font-bold text-gray-500 tracking-wider uppercase mt-1">Total Active</span>
            </div>
          </div>

          <div className="w-full space-y-3 mt-auto">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-300">Enterprise</span>
              </div>
              <span className="text-white font-semibold">65%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-gray-300">Professional</span>
              </div>
              <span className="text-white font-semibold">25%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="text-gray-300">Standard</span>
              </div>
              <span className="text-white font-semibold">10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Categories & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment Categories */}
        <div className="bg-[#1C1F2E] rounded-2xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-semibold text-white">Assessment Categories</h2>
            <button className="text-gray-400 hover:text-white">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {[
              { label: "Cybersecurity Compliance", value: "12,402", color: "bg-indigo-400", p: "85%" },
              { label: "Internal Process Audit", value: "9,120", color: "bg-emerald-400", p: "65%" },
              { label: "Financial Risk Assessment", value: "6,504", color: "bg-orange-400", p: "45%" },
              { label: "ESG Sustainability", value: "4,210", color: "bg-gray-400", p: "30%" },
            ].map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2 text-sm">
                  <span className="text-gray-200">{cat.label}</span>
                  <span className="text-gray-400 text-xs">{cat.value} taken</span>
                </div>
                <div className="w-full bg-[#2A2E3D] rounded-full h-1.5">
                  <div className={`${cat.color} h-1.5 rounded-full`} style={{ width: cat.p }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1C1F2E] rounded-2xl p-6 border border-white/5 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6">Recent Activity</h2>
          
          <div className="space-y-5 flex-1">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">New High-Risk Assessment</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Global Corp completed 'Cyber-Audit 2024' with a score of <span className="text-gray-300 font-semibold">42/100</span>.</p>
                <div className="flex items-center mt-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                  2 minutes ago
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Enterprise Upgrade</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Alpha Logistics upgraded to 'Enterprise Premium' annual plan.</p>
                <div className="flex items-center mt-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  45 minutes ago
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <UserPlus className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">New Admin User Joined</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Sarah Jenkins was added to the 'The Architect' internal team.</p>
                <div className="flex items-center mt-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  2 hours ago
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Failed Payment Attempt</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Subscription for 'Midtown Tech' failed due to expired card.</p>
                <div className="flex items-center mt-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  5 hours ago
                </div>
              </div>
            </div>
          </div>

          <button className="w-full mt-6 py-2.5 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-gray-300 uppercase tracking-wider transition-colors">
            View Full Audit Log
          </button>
        </div>
      </div>

      {/* Bottom Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 pb-12">
        <div className="bg-[#212435] rounded-xl p-4 flex items-center gap-4 border border-white/5">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Platform Speed</div>
            <div className="text-lg font-bold text-white leading-none">98.2ms</div>
            <div className="flex items-center mt-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Optimal
            </div>
          </div>
        </div>

        <div className="bg-[#212435] rounded-xl p-4 flex items-center gap-4 border border-white/5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
            <Server className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Server Status</div>
            <div className="text-lg font-bold text-white leading-none">100% Uptime</div>
            <div className="text-[10px] text-gray-500 mt-1">All regions operational</div>
          </div>
        </div>

        <div className="bg-[#212435] rounded-xl p-4 flex items-center gap-4 border border-white/5">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 border border-orange-500/20">
            <Headphones className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Support Queue</div>
            <div className="text-lg font-bold text-white leading-none">12 Active Tickets</div>
            <div className="text-[10px] text-gray-500 mt-1">Avg response: 14m</div>
          </div>
        </div>
      </div>
    </div>
  );
}