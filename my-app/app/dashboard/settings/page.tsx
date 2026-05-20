"use client";

import { useState } from "react";
import {
  Camera,
  CheckCircle2,
  Lock,
  Monitor,
  Smartphone,
  Building2,
  MapPin,
  TrendingUp,
  Search,
  Activity,
  AlertCircle,
  FileText,
  ChevronRight,
  Printer,
  Share2,
  User,
  ChevronDown,
  Users,
  Banknote,
  BadgeCheck,
  Info,
  Clock,
  LineChart,
  Lightbulb,
  ArrowRight,
  Plus,
  CreditCard,
  Download,
  Check,
  ArrowLeftRight,
  Filter,
  Mail,
  CheckSquare,
  Sparkles,
  Megaphone,
  Bell,
  BarChart2,
  Calendar
} from "lucide-react";

type Tab =
  | "Profile"
  | "Business Info"
  | "Reports & Assessments"
  | "Notifications"
  | "Billing"
  | "Security"
  | "Integrations";

const TABS: Tab[] = [
  "Profile",
  "Business Info",
  "Reports & Assessments",
  "Notifications",
  "Billing",
  "Security",
  "Integrations",
];

export default function DashboardSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  return (
    <div className="max-w-full min-h-screen bg-[#0d1117] text-white">
      {/* Top Nav */}
      <div className="flex items-center gap-6 border-b border-white/5 pb-4 mb-8 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap text-sm font-semibold transition ${
              activeTab === tab
                ? "text-orange-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "Profile" && <ProfileSettings />}
      {activeTab === "Business Info" && <BusinessInfoSettings />}
      {activeTab === "Reports & Assessments" && <ReportsAssessmentsSettings />}
      {activeTab === "Billing" && <BillingSettings />}
      {activeTab === "Notifications" && <NotificationsSettings />}
      {["Security", "Integrations"].includes(
        activeTab
      ) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-sm text-gray-400 max-w-md">
            This section is currently under development. Check back later for updates.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Profile Settings ────────────────────────────────────────────────────────
function ProfileSettings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-sm text-gray-400">
            Update your personal information and how others see you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-full border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition">
            Cancel
          </button>
          <button className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-6 flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-[#0d1117]">
              AJ
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-400 text-white flex items-center justify-center shadow-lg transition border-2 border-[#111827]">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Alex James</h3>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-6">
            ADMIN ROLE
          </p>
          <button className="w-full py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition">
            Replace Image
          </button>
        </div>

        {/* Right Column: General Info */}
        <div className="lg:col-span-2 rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white">
              General Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                FULL NAME
              </label>
              <input
                type="text"
                defaultValue="Alex James"
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-white/20 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                PHONE NUMBER
              </label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue="+1 (555) 012-3456"
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-white/20 transition pr-10"
                />
                <PhoneIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <input
                type="email"
                defaultValue="alex.james@pica.io"
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-white/20 transition pr-28"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-teal-500/20 text-teal-400">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Primary email for account access and critical notifications.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2FA */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8 flex items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex flex-shrink-0 items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.3)]">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-2">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Add an extra layer of security to your account. When enabled,
              you&apos;ll be asked for a code from your mobile device.
            </p>
            <button className="text-teal-400 text-sm font-semibold flex items-center gap-1.5 hover:text-teal-300 transition">
              Setup Security Key <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Login Activity */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-white mb-5">
            LOGIN ACTIVITY
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-[#0d1117] border border-white/5">
              <Monitor className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  MacBook Pro 16&quot;
                </p>
                <p className="text-xs text-gray-500">San Francisco, CA</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400">
                Current
              </span>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-[#0d1117] border border-white/5">
              <Smartphone className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  iPhone 15 Pro
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <button className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300 transition">
                REVOKE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// ─── Business Info Settings ──────────────────────────────────────────────────
function BusinessInfoSettings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Business Information
          </h1>
          <p className="text-sm text-gray-400">
            Detailed organizational metrics and identity parameters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-full border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition">
            Discard Changes
          </button>
          <button className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
            Save Configuration
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Core Identity */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Core Identity
                  </h2>
                  <p className="text-xs text-gray-400">
                    Update your public business profile
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  COMPANY CLASSIFICATION
                </p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0d1117] border border-white/10 text-xs font-semibold text-teal-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Medium Business
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  BUSINESS NAME
                </label>
                <input
                  type="text"
                  defaultValue="Aether Dynamics Global"
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-white/20 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  INDUSTRY
                </label>
                <div className="relative">
                  <select className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm appearance-none focus:outline-none focus:border-white/20 transition">
                    <option>Aerospace &amp; Engineering</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  LOCATION
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
                  <input
                    type="text"
                    defaultValue="Stockholm, Sweden"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-white/20 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  YEARS IN OPERATION
                </label>
                <input
                  type="text"
                  defaultValue="12"
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm focus:outline-none focus:border-white/20 transition"
                />
              </div>
            </div>
          </div>

          {/* Operational Structure */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-bold text-white">
                Operational Structure
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                  FOUNDER INVOLVEMENT LEVEL
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 p-4 rounded-xl border-2 border-teal-500 bg-teal-500/5 flex flex-col items-center justify-center text-center cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center mb-2">
                      <Lightbulb className="w-4 h-4 text-teal-400" />
                    </div>
                    <p className="text-sm font-bold text-teal-400 mb-1">
                      Strategic Oversight
                    </p>
                    <p className="text-[10px] text-teal-500">
                      Hands-off daily ops, focused on long-term vision.
                    </p>
                  </div>
                  <div className="flex-1 p-4 rounded-xl border border-white/5 bg-[#0d1117] hover:border-white/10 transition flex flex-col items-center justify-center text-center cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-2">
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 mb-1">
                      Operational Lead
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Directly managing key product streams.
                    </p>
                  </div>
                  <div className="flex-1 p-4 rounded-xl border border-white/5 bg-[#0d1117] hover:border-white/10 transition flex flex-col items-center justify-center text-center cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 mb-1">
                      Fully Integrated
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Involved in all granular decision making.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="rounded-xl bg-[#0d1117] border border-white/5 p-5">
                  <h3 className="text-sm font-bold text-white mb-1">
                    Regional Mapping
                  </h3>
                  <p className="text-[10px] text-gray-500 mb-4">
                    Primary operational hub and jurisdiction.
                  </p>
                  <div className="relative h-32 rounded-lg bg-gradient-to-br from-teal-900/40 to-[#0d1117] border border-white/5 overflow-hidden flex items-center justify-center">
                    {/* Placeholder for map */}
                    <svg
                      className="absolute inset-0 w-full h-full text-white/5"
                      fill="currentColor"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <path d="M0 50 Q 25 30 50 50 T 100 50 V 100 H 0 Z" />
                      <path d="M0 70 Q 25 50 50 70 T 100 70 V 100 H 0 Z" opacity="0.5" />
                    </svg>
                    <MapPin className="w-10 h-10 text-orange-500 relative z-10" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Human Capital */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-bold text-white">Human Capital</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0d1117] border border-white/5">
                <span className="text-sm text-gray-400">Number of Staff</span>
                <span className="text-xl font-bold text-white">248</span>
              </div>
              <div className="p-4 rounded-lg bg-[#0d1117] border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Target Expansion</span>
                  <span className="text-sm font-bold text-teal-400">+15%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-teal-400 w-[60%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Tier */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Banknote className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Revenue Tier</h3>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                ANNUAL RANGE (USD)
              </label>
              <div className="relative mb-4">
                <select className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-white/5 text-white text-sm appearance-none focus:outline-none focus:border-white/20 transition">
                  <option>$10M - $50M</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                <BadgeCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Tier 2 Verification: Financial statements reconciled for Q3.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/5 text-gray-500 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          Last updated: Mar 24, 2026 by Administrator. Next mandatory review in 45 days.
        </div>
        <div className="flex items-center gap-4">
          <button className="hover:text-white transition">
            <Printer className="w-4 h-4" />
          </button>
          <button className="hover:text-white transition">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reports & Assessments Settings ──────────────────────────────────────────
function ReportsAssessmentsSettings() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Reports & Assessments
          </h1>
          <p className="text-sm text-gray-400">
            Track your business health and progress over time with data-driven architectural insights.
          </p>
        </div>
        <div>
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.2)] text-white text-sm font-semibold transition">
            <Plus className="w-4 h-4" />
            Take New Assessment
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">
            TOTAL ASSESSMENTS
          </h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-white">12</span>
            <span className="text-sm font-bold text-teal-400 mb-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2 this month
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">
            HEALTH SCORE
          </h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-teal-400">72%</span>
            <span className="text-xs font-bold text-teal-400 mb-1 flex items-center bg-teal-500/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-1.5" />
              HEALTHY
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">
            SCORE TREND
          </h3>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-white leading-none mb-1">Improving</p>
              <p className="text-sm font-bold text-teal-400">+5%</p>
            </div>
            <div className="flex items-end gap-1 h-10">
              <div className="w-3 h-4 bg-white/10 rounded-sm" />
              <div className="w-3 h-5 bg-white/10 rounded-sm" />
              <div className="w-3 h-4 bg-white/10 rounded-sm" />
              <div className="w-3 h-6 bg-white/20 rounded-sm" />
              <div className="w-3 h-8 bg-blue-400/50 rounded-sm" />
              <div className="w-3 h-10 bg-teal-400 rounded-sm" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">
            LAST ASSESSMENT
          </h3>
          <p className="text-xl font-bold text-white mb-1">Oct 24, 2025</p>
          <p className="text-xs text-gray-500 mb-3">Next due in 12 days</p>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
             <div className="h-full bg-indigo-500 w-[80%]" />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Filter by keyword..."
            className="w-full pl-11 pr-4 py-3 rounded-full bg-[#111827] border border-white/5 text-white text-sm focus:outline-none focus:border-white/20 transition"
          />
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#111827] border border-white/5 text-sm text-gray-300 hover:bg-white/5 transition">
            Date Range <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#111827] border border-white/5 text-sm text-gray-300 hover:bg-white/5 transition">
            Diagnostic Type <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#111827] border border-white/5 text-sm text-gray-300 hover:bg-white/5 transition">
            Score Range <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Recent History */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-4">
          RECENT HISTORY
        </h3>
        <div className="space-y-4">
          {/* Item 1 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-[#111827] border border-white/5 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0d1117] border border-white/5 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Strategic Diagnostic</h4>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Oct 24, 2023</span>
                  <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Medium Business</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">STATUS</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
                  Healthy
                </span>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">SCORE</p>
                <p className="text-xl font-bold text-white">72</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition">
                  View Report
                </button>
                <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition">
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl bg-[#111827] border border-white/5 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0d1117] border border-white/5 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Operations Audit</h4>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Sept 12, 2023</span>
                  <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Medium Business</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">STATUS</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                  Needs Attention
                </span>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">SCORE</p>
                <p className="text-xl font-bold text-white">48</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition">
                  View Report
                </button>
                <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition">
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State / Call to Action */}
      <div className="rounded-2xl border border-white/5 border-dashed bg-[#111827]/50 p-10 flex flex-col items-center justify-center text-center mt-6">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Build Your Data Timeline</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
          Take regular assessments to see how your business health evolves. Consistent reporting unlocks predictive trends and deep-benchmarking.
        </p>
        <button className="text-sm font-semibold text-teal-400 hover:text-teal-300 transition flex items-center gap-2">
          Schedule next assessment <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Billing & Subscription Settings ─────────────────────────────────────────
function BillingSettings() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Billing & Subscription
        </h1>
        <p className="text-sm text-gray-400">
          Manage your organizational plan, payment methods, and review transaction history across the PICA ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2 rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8 relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-2">
                CURRENT PLAN
              </p>
              <h2 className="text-2xl font-bold text-white mb-1">2A - Diagnosis</h2>
              <p className="text-sm text-gray-400">
                Your next billing date is <span className="text-white font-medium">October 24, 2024</span>
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider">
              ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Users</p>
              <p className="text-lg font-bold text-white">12 <span className="text-sm text-gray-500 font-normal">/ 20</span></p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Storage</p>
              <p className="text-lg font-bold text-white">45.2 GB</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">API Calls</p>
              <p className="text-lg font-bold text-white">850k <span className="text-sm text-gray-500 font-normal">/ 1M</span></p>
            </div>
          </div>

          <div className="flex gap-4 relative z-10">
            <button className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
              Upgrade Plan
            </button>
            <button className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition">
              Manage Add-ons
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-4">
              PAYMENT METHOD
            </p>
            <div className="rounded-xl bg-gradient-to-br from-[#1c2333] to-[#0d1117] border border-white/5 p-5 mb-6">
              <div className="flex items-center justify-between mb-8">
                <CreditCard className="w-6 h-6 text-gray-400" />
                <span className="text-sm font-bold text-gray-300 italic tracking-wider">VISA</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-1">Card Number</p>
              <p className="text-sm tracking-widest text-white font-mono">
                **** **** **** 4412
              </p>
            </div>
          </div>
          <div>
            <button className="w-full py-2.5 rounded-lg bg-[#0d1117] border border-white/10 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition flex items-center justify-center gap-2 mb-3">
              <CreditCard className="w-4 h-4" /> Update Card
            </button>
            <p className="text-[9px] text-center text-gray-600 uppercase tracking-wider">
              YOUR PAYMENT DATA IS ENCRYPTED AND SECURE.
            </p>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="rounded-xl bg-[#111827] border border-white/5 p-6 md:p-8">
        <h3 className="text-base font-bold text-white mb-6">Billing History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500">
                <th className="pb-4 font-bold">INVOICE</th>
                <th className="pb-4 font-bold">STATUS</th>
                <th className="pb-4 font-bold">DATE</th>
                <th className="pb-4 font-bold">AMOUNT</th>
                <th className="pb-4 font-bold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-white/5">
                <td className="py-4 font-medium text-white">INV-2024-009</td>
                <td className="py-4">
                  <span className="flex items-center gap-1.5 text-white text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Paid
                  </span>
                </td>
                <td className="py-4 text-gray-400 text-xs">Sep 24, 2024</td>
                <td className="py-4 font-medium text-white text-xs">$129.00</td>
                <td className="py-4 text-right">
                  <button className="text-gray-400 hover:text-white transition">
                    <Download className="w-4 h-4 inline-block" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 font-medium text-white">INV-2024-008</td>
                <td className="py-4">
                  <span className="flex items-center gap-1.5 text-white text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Paid
                  </span>
                </td>
                <td className="py-4 text-gray-400 text-xs">Aug 24, 2024</td>
                <td className="py-4 font-medium text-white text-xs">$129.00</td>
                <td className="py-4 text-right">
                  <button className="text-gray-400 hover:text-white transition">
                    <Download className="w-4 h-4 inline-block" />
                  </button>
                </td>
              </tr>
              <tr>
                <td className="py-4 font-medium text-white">INV-2024-007</td>
                <td className="py-4">
                  <span className="flex items-center gap-1.5 text-white text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Paid
                  </span>
                </td>
                <td className="py-4 text-gray-400 text-xs">Jul 24, 2024</td>
                <td className="py-4 font-medium text-white text-xs">$129.00</td>
                <td className="py-4 text-right">
                  <button className="text-gray-400 hover:text-white transition">
                    <Download className="w-4 h-4 inline-block" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Scale your workflow */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Scale your workflow</h3>
          <div className="flex items-center bg-[#111827] rounded-lg border border-white/5 p-1">
            <button className="px-4 py-1.5 rounded-md bg-white/10 text-white text-xs font-semibold">
              Monthly
            </button>
            <button className="px-4 py-1.5 rounded-md text-gray-400 text-xs font-semibold hover:text-white transition">
              Yearly <span className="text-teal-400 font-normal">(Save 20%)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 3A */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6 flex flex-col">
            <h4 className="text-sm font-bold text-white mb-2">3A - Analysis</h4>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-3xl font-extrabold text-white">$299</span>
              <span className="text-xs text-gray-500 mb-1">/ month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                Up to 50 active users
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                500 GB Cloud Storage
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                Advanced AI reporting
              </li>
            </ul>
            <button className="w-full py-2.5 rounded-lg border border-orange-500/50 text-orange-400 text-sm font-semibold hover:bg-orange-500/10 transition">
              Choose Plan
            </button>
          </div>

          {/* 4A RECOMMENDED */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6 flex flex-col relative mt-4 md:mt-0 md:-translate-y-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-200 text-orange-800 text-[9px] font-extrabold uppercase tracking-widest">
              RECOMMENDED
            </div>
            <h4 className="text-sm font-bold text-white mb-2">4A - Optimization</h4>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-3xl font-extrabold text-white">$899</span>
              <span className="text-xs text-gray-500 mb-1">/ month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-gray-300">Unlimited user accounts</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-gray-300">2 TB High-speed storage</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-gray-300">Predictive analytics engine</span>
              </li>
            </ul>
            <button className="w-full py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition">
              Choose Plan
            </button>
          </div>

          {/* Custom Shell */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6 flex flex-col">
            <h4 className="text-sm font-bold text-white mb-2">Custom Shell</h4>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-white">Contact</span>
            </div>
            <p className="text-xs text-gray-400 mb-8 flex-1 leading-relaxed">
              Tailored solutions for large-scale operations requiring custom integrations and dedicated support.
            </p>
            <button className="w-full py-2.5 rounded-lg bg-[#0d1117] border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition">
              Talk to Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Settings ──────────────────────────────────────────────────
function NotificationsSettings() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [assessmentAlerts, setAssessmentAlerts] = useState(true);
  const [insightsAlerts, setInsightsAlerts] = useState(true);
  const [marketingAlerts, setMarketingAlerts] = useState(false);

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
    <button 
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-teal-400' : 'bg-[#0d1117] border border-white/10'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-1 flex items-center gap-2">
          PREFERENCES <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Notifications
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl">
          Manage how you receive alerts and stay updated with your team's progress. Configure specific triggers for assessments, insights, and platform updates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-6 rounded-xl bg-[#111827] border border-white/5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Email Notifications</h3>
                <p className="text-sm text-gray-400">The master switch for all email communication. Disabling this will mute all transactional and alert emails.</p>
              </div>
            </div>
            <Toggle checked={emailNotif} onChange={setEmailNotif} />
          </div>

          {/* Assessment Completion Alerts */}
          <div className="flex items-center justify-between p-6 rounded-xl bg-[#111827] border border-white/5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Assessment Completion Alerts</h3>
                <p className="text-sm text-gray-400">Receive instant notifications when a team member finishes a risk assessment or structural audit.</p>
              </div>
            </div>
            <Toggle checked={assessmentAlerts} onChange={setAssessmentAlerts} />
          </div>

          {/* New Insights & Recommendations */}
          <div className="flex items-center justify-between p-6 rounded-xl bg-[#111827] border border-white/5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">New Insights & Recommendations</h3>
                <p className="text-sm text-gray-400">Get notified when PICA's engine identifies new patterns or suggests optimizations based on your data.</p>
              </div>
            </div>
            <Toggle checked={insightsAlerts} onChange={setInsightsAlerts} />
          </div>

          {/* Marketing & Product Updates */}
          <div className="flex items-center justify-between p-6 rounded-xl bg-[#111827] border border-white/5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Megaphone className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Marketing & Product Updates</h3>
                <p className="text-sm text-gray-400">Stay in the loop with new feature releases, best practice guides, and occasional special offers.</p>
              </div>
            </div>
            <Toggle checked={marketingAlerts} onChange={setMarketingAlerts} />
          </div>

          <div className="pt-4 flex justify-end">
            <button className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
              Save Preferences
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Live Status */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6 relative overflow-hidden">
            <Bell className="absolute -right-6 -top-6 w-32 h-32 text-white/[0.02] pointer-events-none" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
              LIVE STATUS
            </p>
            <h3 className="text-2xl font-bold text-white mb-3">You're all set.</h3>
            <p className="text-sm text-gray-400 mb-6 relative z-10">
              Your current notification settings are optimized for high-priority alerts without the clutter.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-400 relative z-10">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              Active Delivery
            </div>
          </div>

          {/* Pro Tip */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-3 text-teal-400">
              <Lightbulb className="w-4 h-4" />
              <h3 className="text-sm font-bold">Pro Tip</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Teams that enable "New Insights" respond to structural anomalies 40% faster than those that don't.
            </p>
            <div className="h-24 bg-gradient-to-t from-[#0d1117] to-transparent border border-white/5 rounded-lg flex items-end justify-between px-2 pb-2 gap-1">
               {/* Tiny bar chart placeholder */}
               {[40, 50, 30, 60, 45, 70, 55, 80, 65, 90].map((h, i) => (
                 <div key={i} className={`w-full rounded-sm ${i > 5 ? 'bg-teal-500/50' : 'bg-white/10'}`} style={{ height: `${h}%` }} />
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
