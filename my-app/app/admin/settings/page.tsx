"use client";

import { useState } from "react";
import {
  Download,
  Plus,
  Search,
  MoreVertical,
  ChevronRight,
  AlertTriangle,
  BarChart2,
  CreditCard,
  Shuffle,
  Eye,
  EyeOff,
  Wrench,
  Activity,
  Shield,
  RefreshCw,
  TrendingUp,
  Users,
  Settings2,
  Megaphone,
  Scale,
  Cpu,
  Rocket,
  CheckCircle2,
  Info,
} from "lucide-react";

// ─── Shared Toggle ────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-blue-500" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── TAB 1: Roles & Permissions ───────────────────────────────────
function RolesTab() {
  const [permissions, setPermissions] = useState({
    analytics: true,
    ledger: true,
    scoring: false,
  });

  const admins = [
    { initials: "JH", color: "bg-blue-600",   name: "Julian Hensey",  email: "j.hensey@pica.ai",  role: "SUPER ADMIN", roleStyle: "text-white bg-white/10 border-white/20",       active: true },
    { initials: "SM", color: "bg-purple-600",  name: "Sarah Miller",   email: "s.miller@pica.ai",  role: "EDITOR",      roleStyle: "text-gray-300 bg-white/5 border-white/10",      active: true },
    { initials: "AT", color: "bg-teal-600",    name: "Arjun Theron",   email: "a.theron@pica.ai",  role: "AUDITOR",     roleStyle: "text-gray-300 bg-white/5 border-white/10",      active: false },
  ];

  const roleTypes = ["Super Admin", "Editor", "Auditor", "Viewer"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left — System Admins + Permissions (col-span-2) */}
      <div className="lg:col-span-2 space-y-6">

        {/* System Administrators card with bg image */}
        <div className="relative bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-24 bg-cover bg-top bg-no-repeat opacity-25 pointer-events-none"
            style={{ backgroundImage: "url('/images/dashboard img')" }}
          />
          <div className="relative z-10">
            {/* Table header row */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <h2 className="text-base font-semibold text-white">System Administrators</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  className="bg-[#111318] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-52"
                />
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-3 px-6 py-3 border-b border-white/5">
              {["ADMINISTRATOR", "ASSIGNED ROLE", "STATUS"].map((h) => (
                <span key={h} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</span>
              ))}
            </div>

            {/* Admin rows */}
            {admins.map((a, i) => (
              <div key={i} className="grid grid-cols-3 items-center px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${a.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {a.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.email}</div>
                  </div>
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border ${a.roleStyle}`}>
                    {a.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${a.active ? "bg-emerald-500" : "bg-gray-500"}`} />
                    <span className={`text-sm ${a.active ? "text-emerald-400" : "text-gray-500"}`}>
                      {a.active ? "Active" : "Offline"}
                    </span>
                  </div>
                  <button className="text-gray-500 hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Color bar accent */}
            <div className="h-[3px] flex">
              <div className="flex-1 bg-blue-500" />
              <div className="flex-1 bg-emerald-500" />
              <div className="flex-1 bg-amber-500" />
            </div>
          </div>
        </div>

        {/* Granular Module Permissions */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <div>
              <h2 className="text-base font-semibold text-white">Granular Module Permissions</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Editing permissions for: <span className="text-blue-400 font-semibold">Super Admin</span>
              </p>
            </div>
            <span className="text-[10px] font-bold px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 uppercase tracking-wider">
              Inherited Authority
            </span>
          </div>

          <div className="divide-y divide-white/5">
            {/* Core Analytics */}
            <div className="flex items-center gap-4 px-6 py-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <BarChart2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Core Analytics</div>
                <div className="text-xs text-gray-400 mt-0.5">Full CRUD access to assessment data and global trends.</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enable All</span>
                <Toggle checked={permissions.analytics} onChange={() => setPermissions(p => ({ ...p, analytics: !p.analytics }))} />
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="flex items-center gap-4 px-6 py-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Financial Ledger</div>
                <div className="text-xs text-gray-400 mt-0.5">Access to billing modules, payment histories, and invoices.</div>
              </div>
              <Toggle checked={permissions.ledger} onChange={() => setPermissions(p => ({ ...p, ledger: !p.ledger }))} />
            </div>

            {/* Scoring Logic */}
            <div className="flex items-center gap-4 px-6 py-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <Shuffle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Scoring Logic</div>
                <div className="text-xs text-gray-400 mt-0.5">Modify weighted scoring systems and logic trees.</div>
              </div>
              <Toggle checked={permissions.scoring} onChange={() => setPermissions(p => ({ ...p, scoring: !p.scoring }))} />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
            <button className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
              Discard Changes
            </button>
            <button className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors">
              Save Authority Mapping
            </button>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="space-y-6">
        {/* Authority Overview */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Authority Overview</div>
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <span className="text-sm text-gray-300">Total Admin Seats</span>
            <span className="text-xl font-bold text-white">12 / 20</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full mb-4">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: "60%" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Super Admins</div>
              <div className="text-2xl font-bold text-white">03</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Editors</div>
              <div className="text-2xl font-bold text-white">09</div>
            </div>
          </div>
        </div>

        {/* Active Role Types */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Role Types</div>
            <Info className="w-4 h-4 text-gray-500" />
          </div>
          <div className="space-y-2">
            {roleTypes.map((role) => (
              <button key={role} className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-gray-500 group-hover:bg-blue-400 transition-colors" />
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{role}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Elevated Privileges warning */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm font-bold text-red-400">Elevated Privileges</span>
          </div>
          <p className="text-xs text-red-300/80 leading-relaxed">
            Assigning Super Admin roles grants full data deletion authority. Use extreme caution when expanding this group.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: Platform Configuration ───────────────────────────────
function PlatformTab() {
  const [showKey1, setShowKey1] = useState(false);
  const [showKey2, setShowKey2] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [heuristics, setHeuristics] = useState({ predictive: true, validation: true, legacy: false });

  const latencyBars = [55, 40, 70, 45, 60, 80, 50, 65, 90, 55, 85, 70, 45, 75, 60, 80];

  return (
    <div className="space-y-6">

      {/* Row 1: Global API Keys + Maintenance */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#111318]/72" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* API Keys */}
          <div className="p-7 border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-gray-300" />
                <h2 className="text-lg font-semibold text-white">Global API Keys</h2>
              </div>
              <button className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Rotate All Keys
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                  Core Engine Provider
                </label>
                <div className="relative">
                  <input
                    type={showKey1 ? "text" : "password"}
                    defaultValue="sk_live_7f4c2b9e1a3d8f6e"
                    className="w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 pr-12"
                  />
                  <button
                    onClick={() => setShowKey1(!showKey1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showKey1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                  Vector Database Secret
                </label>
                <div className="relative">
                  <input
                    type={showKey2 ? "text" : "password"}
                    defaultValue="vdb_9c3e5a1f2b7d4e8c"
                    className="w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 pr-12"
                  />
                  <button
                    onClick={() => setShowKey2(!showKey2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showKey2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="p-7">
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="w-5 h-5 text-gray-300" />
              <h2 className="text-lg font-semibold text-white">Maintenance</h2>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Activating maintenance mode will suspend all active assessment sessions and prevent new logins across the platform.
            </p>
            <div className="flex items-center justify-between bg-[#111318] border border-white/10 rounded-xl px-5 py-4">
              <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">System Lockdown</span>
              <Toggle checked={lockdown} onChange={() => setLockdown(!lockdown)} />
            </div>
            {lockdown && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                System lockdown active — all sessions suspended.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Logic & Heuristics */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-7">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Assessment Logic & Heuristics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              key: "predictive" as const,
              icon: TrendingUp,
              iconColor: "text-blue-400",
              label: "Predictive Scoring",
              desc: "Enable real-time outcome prediction based on historical benchmark data.",
            },
            {
              key: "validation" as const,
              icon: Shield,
              iconColor: "text-emerald-400",
              label: "Strict Validation",
              desc: "Mandatory double-pass verification for all assessment submissions.",
            },
            {
              key: "legacy" as const,
              icon: RefreshCw,
              iconColor: "text-amber-400",
              label: "Legacy Sync",
              desc: "Background synchronization with older v1.x architectural protocols.",
            },
          ].map((item) => (
            <div key={item.key} className="bg-[#111318] rounded-xl border border-white/5 p-5">
              <div className="flex items-start justify-between mb-4">
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                <Toggle
                  checked={heuristics[item.key]}
                  onChange={() => setHeuristics(h => ({ ...h, [item.key]: !h[item.key] }))}
                />
              </div>
              <div className="text-sm font-semibold text-white mb-1">{item.label}</div>
              <div className="text-xs text-gray-400 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Health + Throughput Latency */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#111318]/78" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
          {/* Database Health */}
          <div className="p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="relative w-36 h-36 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="transparent" stroke="#ffffff08" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="transparent"
                  stroke="#10b981" strokeWidth="8"
                  strokeDasharray={`${92 * 2.639} 263.9`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-emerald-400">92%</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Integrity</span>
              </div>
            </div>
            <div className="text-lg font-bold text-white mb-1">Database Health</div>
            <div className="text-sm text-gray-400">Last full audit completed 14 minutes ago.</div>
          </div>

          {/* Throughput Latency */}
          <div className="p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BarChart2 className="w-5 h-5 text-gray-300" />
                <h3 className="text-base font-semibold text-white">Throughput Latency</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-gray-400">READ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-gray-400">WRITE</span>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-28">
              {latencyBars.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm transition-all ${
                    i % 3 === 2 ? "bg-white/20" : "bg-white/[0.12]"
                  } hover:bg-blue-500/60`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save footer */}
      <div className="flex items-center justify-between bg-[#1C1F2E] rounded-2xl border border-white/5 px-6 py-4">
        <p className="text-xs text-gray-500">Changes are logged in the audit trail.</p>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors">Discard</button>
          <button className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 3: Category Management ───────────────────────────────────
function CategoryTab() {
  const pillars = [
    { key: "finance",    label: "Finance",         icon: CreditCard,  weight: 15, questions: 42, desc: "Fiscal health metrics, burn rate efficiency, and investment readiness indicators.",     master: false, density: 65 },
    { key: "hr",         label: "Human Resources", icon: Users,       weight: 12, questions: 38, desc: "Talent retention, cultural alignment, and organizational leadership structure.",         master: false, density: 70 },
    { key: "operations", label: "Operations",      icon: Settings2,   weight: 18, questions: 55, desc: "Workflow efficiency, supply chain robustness, and process scalability.",                master: false, density: 80 },
    { key: "technology", label: "Technology",      icon: Cpu,         weight: 20, questions: 84, desc: "Architecture scalability, technical debt oversight, security compliance protocols, and stack modernization readiness.", master: true,  density: 90 },
    { key: "strategy",   label: "Strategy",        icon: Rocket,      weight: 10, questions: 29, desc: "Market positioning, competitive moats, and long-term vision execution.",               master: false, density: 55 },
    { key: "marketing",  label: "Marketing",       icon: Megaphone,   weight: 8,  questions: 31, desc: "Brand awareness, customer acquisition costs, and market sentiment analysis across digital and physical channels.", master: false, density: 65 },
    { key: "legal",      label: "Legal",           icon: Scale,       weight: 7,  questions: 22, desc: "IP protection, regulatory compliance, contract management, and liability mitigation strategies.", master: false, density: 90 },
  ];

  const topRow = pillars.slice(0, 3);
  const masterPillar = pillars[3];
  const strategyPillar = pillars[4];
  const bottomRow = pillars.slice(5);

  const PillarCard = ({ p, large = false }: { p: typeof pillars[0]; large?: boolean }) => (
    <div className={`relative bg-[#1C1F2E] rounded-2xl border overflow-hidden flex flex-col ${
      p.master ? "border-white/20 shadow-lg shadow-blue-500/10" : "border-white/5"
    } ${large ? "min-h-[220px]" : ""}`}>
      {/* bg image subtle for master */}
      {p.master && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
      )}
      <div className="relative z-10 p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            p.master ? "bg-white text-gray-900" : "bg-white/10 text-gray-300"
          }`}>
            <p.icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-gray-500">Weight: {p.weight}%</span>
        </div>

        <div className="mb-1">
          <h3 className={`font-bold ${large ? "text-xl" : "text-lg"} text-white`}>{p.label}</h3>
          {p.master && (
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Master Pillar • Weight: {p.weight}%
            </div>
          )}
        </div>

        <p className={`text-gray-400 leading-relaxed flex-1 ${large ? "text-sm" : "text-xs"} mb-4`}>{p.desc}</p>

        {/* density bar for bottom cards */}
        {!p.master && !large && (
          <div className="mb-3">
            <div className="h-[3px] w-full bg-white/10 rounded-full">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.density}%` }} />
            </div>
            <div className="text-[10px] text-gray-500 mt-1 text-right">{p.density}% Content Density</div>
          </div>
        )}

        {large ? (
          <div className="flex gap-3 mt-auto">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold rounded-lg transition-colors">
              Edit Definitions
            </button>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              Manage Question Bank ({p.questions})
            </button>
          </div>
        ) : (
          <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors mt-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {p.questions} Questions
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Badge + Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg mb-3">
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Configuration Stage</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">The 7 Pillars</h1>
        <p className="text-gray-400 text-sm max-w-2xl">
          Define the core framework for PICA's Kinetic Assessments. Manage individual pillar significance, weighting logic, and relational question clusters.
        </p>
      </div>

      {/* Top 3 pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {topRow.map((p) => <PillarCard key={p.key} p={p} />)}
      </div>

      {/* bg image separator row: Technology (large) + Strategy */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
          style={{ backgroundImage: "url('/images/dashboard img')" }}
        />
        <div className="absolute inset-0 bg-[#111318]/60 pointer-events-none rounded-2xl" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-5 p-5">
          <div className="lg:col-span-2">
            <PillarCard p={masterPillar} large />
          </div>
          <div>
            <PillarCard p={strategyPillar} />
          </div>
        </div>
      </div>

      {/* Bottom 2 pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {bottomRow.map((p) => <PillarCard key={p.key} p={p} />)}
      </div>

      {/* Global Weighting Calibration */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Global Weighting Calibration</h2>
            <p className="text-sm text-gray-400">Adjust the mathematical influence of each pillar on the final Kinetic Score.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">Total: 100% Normalized</span>
          </div>
        </div>

        {/* Weight dials */}
        <div className="grid grid-cols-7 gap-3 mb-6">
          {pillars.map((p) => {
            const circumference = 2 * Math.PI * 18;
            const offset = circumference * (1 - p.weight / 100);
            return (
              <div key={p.key} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${
                p.master
                  ? "border-blue-500/40 bg-blue-500/10"
                  : "border-white/5 bg-white/[0.02]"
              }`}>
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate w-full text-center">
                  {p.label.split(" ")[0].substring(0, 5).toUpperCase()}
                </div>
                <div className="relative w-12 h-12">
                  <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                    <circle cx="20" cy="20" r="18" fill="transparent" stroke="#ffffff10" strokeWidth="3" />
                    <circle
                      cx="20" cy="20" r="18" fill="transparent"
                      stroke={p.master ? "#3b82f6" : "#4b5563"}
                      strokeWidth="3"
                      strokeDasharray={`${(p.weight / 100) * circumference} ${circumference}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-bold ${p.master ? "text-blue-400" : "text-white"}`}>
                      {p.weight}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <button className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            Reset Defaults
          </button>
          <button className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors">
            Apply Global Weights
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────
const TABS = [
  { key: "roles",    label: "Roles & Permissions" },
  { key: "platform", label: "Platform Configuration" },
  { key: "category", label: "Category Management" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("roles");

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* Tab strip — matches header nav style from the design */}
      <div className="flex gap-6 border-b border-white/5 mb-8 -mt-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
              activeTab === tab.key
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab header (only for roles + platform tabs) */}
      {activeTab === "roles" && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Roles & Permissions</h1>
            <p className="text-gray-400 text-sm max-w-lg">
              Define the structural authority within your workspace. Manage granular module access and operational boundaries for your team.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
              <Download className="w-4 h-4" /> Export Log
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Create New Role
            </button>
          </div>
        </div>
      )}

      {activeTab === "platform" && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Platform Configuration</h1>
          <p className="text-gray-400 text-sm">
            Modify global system parameters, manage database integrity, and control assessment engine heuristics.
          </p>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "roles"    && <RolesTab />}
      {activeTab === "platform" && <PlatformTab />}
      {activeTab === "category" && <CategoryTab />}
    </div>
  );
}