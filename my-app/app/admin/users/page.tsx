"use client";

import { useState } from "react";
import {
  Users,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Search,
  ChevronDown,
  SlidersHorizontal,
  Eye,
  FileText,
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  Table2,
} from "lucide-react";

const USERS = [
  {
    id: 1,
    name: "Alexander Thorne",
    email: "alex.t@nexuscorp.io",
    avatar: "https://i.pravatar.cc/150?u=alexthorne",
    segment: "MEDIUM ENTERPRISE",
    segmentColor: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    subscription: "Enterprise Plus",
    subNote: "BILLED ANNUALLY",
    active: true,
    lastSeen: "2 mins ago",
  },
  {
    id: 2,
    name: "Elena Rodriguez",
    email: "elena.rod@growthlabs.com",
    avatar: "https://i.pravatar.cc/150?u=elenarodriguez",
    segment: "SMALL BUSINESS",
    segmentColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    subscription: "Professional",
    subNote: "MONTHLY TIER",
    active: true,
    lastSeen: "1 hour ago",
  },
  {
    id: 3,
    name: "Julian Marsh",
    email: "j.marsh@legacyholdings.net",
    avatar: "https://i.pravatar.cc/150?u=julianmarsh",
    segment: "MEDIUM ENTERPRISE",
    segmentColor: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    subscription: "Enterprise",
    subNote: "INACTIVE",
    active: false,
    lastSeen: "14 days ago",
    canActivate: true,
  },
  {
    id: 4,
    name: "Sarah Jenkins",
    email: "sarah@creativeflow.studio",
    avatar: "https://i.pravatar.cc/150?u=sarahjenkins",
    segment: "SMALL BUSINESS",
    segmentColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    subscription: "Basic",
    subNote: "TRIAL ENDING",
    active: true,
    lastSeen: "Just now",
  },
  {
    id: 5,
    name: "Marcus Webb",
    email: "m.webb@pinnaclegroup.com",
    avatar: "https://i.pravatar.cc/150?u=marcuswebb",
    segment: "LARGE ENTERPRISE",
    segmentColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    subscription: "Enterprise Plus",
    subNote: "BILLED ANNUALLY",
    active: true,
    lastSeen: "30 mins ago",
  },
  {
    id: 6,
    name: "Priya Nair",
    email: "p.nair@techbridge.in",
    avatar: "https://i.pravatar.cc/150?u=priyanair",
    segment: "SMALL BUSINESS",
    segmentColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    subscription: "Professional",
    subNote: "MONTHLY TIER",
    active: false,
    lastSeen: "3 days ago",
    canActivate: true,
  },
];

export default function UsersPage() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");

  const filtered = USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Oversee platform access, monitor subscription status, and manage organizational health
            for all PICA active tenants.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === "table"
                ? "bg-white/10 border-white/20 text-white"
                : "border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Table2 className="w-4 h-4" />
            Table View
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              view === "grid"
                ? "bg-white/10 border-white/20 text-white"
                : "border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Grid View
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stat Banner with dashboard background image */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-[#111318]/60" />

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "TOTAL USERS",
              value: "14,208",
              badge: "+12%",
              badgeColor: "text-emerald-400",
              sub: null,
              bar: true,
              barColor: "bg-blue-500",
              barPct: "75%",
              border: "border-r border-white/10",
            },
            {
              label: "ACTIVE NOW",
              value: "3,892",
              badge: null,
              dot: true,
              dotColor: "bg-emerald-500",
              sub: "Real-time session count",
              bar: false,
              border: "border-r border-white/10",
            },
            {
              label: "PREMIUM SUBS",
              value: "4,510",
              badge: "Tier 3",
              badgeColor: "text-orange-400 text-[10px] font-bold bg-orange-500/10 px-2 py-0.5 rounded",
              sub: null,
              bar: true,
              barColor: "bg-orange-400",
              barPct: "55%",
              border: "border-r border-white/10",
            },
            {
              label: "FLAGGED ACCOUNTS",
              value: "24",
              badge: "Critical",
              badgeColor: "text-red-400 text-[10px] font-bold bg-red-500/10 px-2 py-0.5 rounded",
              sub: "Requiring review",
              bar: false,
              border: "",
            },
          ].map((stat, i) => (
            <div key={i} className={`p-6 ${stat.border}`}>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                {stat.label}
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              {stat.dot && (
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${stat.dotColor}`} />
                  <span className="text-xs text-gray-300">{stat.sub}</span>
                </div>
              )}
              {stat.badge && (
                <span className={`text-xs font-semibold ${stat.badgeColor}`}>{stat.badge}</span>
              )}
              {stat.sub && !stat.dot && (
                <div className="text-[10px] text-gray-400 mt-1">{stat.sub}</div>
              )}
              {stat.bar && (
                <div className="mt-3 h-1 w-full bg-white/10 rounded-full">
                  <div className={`h-full rounded-full ${stat.barColor}`} style={{ width: stat.barPct }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, email, or company..."
            className="w-full bg-[#1C1F2E] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1F2E] border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
          Business Type <ChevronDown className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1F2E] border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
          Plan Type <ChevronDown className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1F2E] border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Table View */}
      {view === "table" && (
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["NAME & CONTACT", "BUSINESS SEGMENT", "SUBSCRIPTION", "ACTIVE STATUS", "LAST SEEN", "ACTIONS"].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors ${!user.active ? "opacity-70" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        <div>
                          <div className={`text-sm font-semibold ${user.active ? "text-white" : "text-gray-400"}`}>{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${user.segmentColor}`}>{user.segment}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{user.subscription}</div>
                      <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{user.subNote}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${user.active ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className={`text-xs font-medium ${user.active ? "text-emerald-400" : "text-red-400"}`}>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.lastSeen}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.canActivate ? (
                          <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors">
                            ACTIVATE
                          </button>
                        ) : (
                          <>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                              <FileText className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <span className="text-sm text-gray-500">Showing 1-10 of 14,208 users</span>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[1, 2, 3, "...", 142].map((p, i) => (
                <button key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === 1 ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                  {p}
                </button>
              ))}
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => (
            <div key={user.id} className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-semibold text-white">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full mt-2 ${user.active ? "bg-emerald-500" : "bg-red-500"}`} />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Segment</span>
                  <span className={`font-semibold text-[10px] px-2 py-0.5 rounded border ${user.segmentColor}`}>{user.segment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="text-white font-medium">{user.subscription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Seen</span>
                  <span className="text-gray-300">{user.lastSeen}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                <button className="flex-1 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">View</button>
                {user.canActivate ? (
                  <button className="flex-1 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">Activate</button>
                ) : (
                  <button className="flex-1 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">Suspend</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}