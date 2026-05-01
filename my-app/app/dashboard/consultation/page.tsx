"use client";

import { useState } from "react";
import {
  Sparkles,
  Network,
  Presentation,
  CalendarX2,
  Rocket,
  Star,
  BadgeCheck,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  Monitor,
  Link2,
  BarChart3,
  TrendingUp,
  FileText,
  Download,
  Plus,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
type ViewState =
  | "empty"
  | "selectExpert"
  | "schedule"
  | "confirmed"
  | "activeSessions";

// ─── Consultant Data ────────────────────────────────────────────────────────
const consultants = [
  {
    name: "Dr. Aris Thorne",
    initials: "AT",
    role: "OPERATIONS & LOGISTICS ARCHITECTURE",
    rating: 4.9,
    reviews: 124,
    nextSlot: "Next: Today, 2:30 PM",
    badge: "Global Markets Expert",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    name: "Sarah Jenkins",
    initials: "SJ",
    role: "FINANCIAL GROWTH ENGINEER",
    rating: 5.0,
    reviews: 89,
    nextSlot: "Next: Tomorrow, 10:00 AM",
    badge: "Scalability Specialist",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    name: "Marcus Vane",
    initials: "MV",
    role: "MARKETING & BRAND PHYSICS",
    rating: 4.8,
    reviews: 210,
    nextSlot: "Next: Wed, 1:00 PM",
    badge: "Omnichannel Expert",
    gradient: "from-orange-400 to-red-500",
  },
  {
    name: "Elena Rossi",
    initials: "ER",
    role: "HUMAN RESOURCE DYNAMICS",
    rating: 4.9,
    reviews: 156,
    nextSlot: "Next: Today, 4:00 PM",
    badge: "Culture Strategist",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    name: "David Chen",
    initials: "DC",
    role: "CORPORATE STRATEGY & AI",
    rating: 4.7,
    reviews: 42,
    nextSlot: "Next: Monday, 9:00 AM",
    badge: "Process Optimizer",
    gradient: "from-green-400 to-teal-500",
  },
  {
    name: "Amara Okafor",
    initials: "AO",
    role: "INTERNATIONAL EXPANSION STRATEGY",
    rating: 5.0,
    reviews: 312,
    nextSlot: "Next: Today, 1:15 PM",
    badge: "Market Penetration Specialist",
    gradient: "from-yellow-400 to-orange-500",
  },
];

const filterPills = [
  "All Specialists",
  "Finance",
  "HR",
  "Operations",
  "Marketing",
  "Strategy",
];

// ─── STATE 1: Empty State ───────────────────────────────────────────────────
function EmptyState({ onSchedule }: { onSchedule: () => void }) {
  return (
    <div className="space-y-6 max-w-full">
      {/* Hero */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] overflow-hidden p-6 md:p-10 border border-white/5">
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider mb-5">
            <Rocket className="w-3 h-3" />
            Performance Index: Top 4%
          </span>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            Unlock Strategic{" "}
            <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
              Guidance
            </span>
          </h1>

          <p className="text-gray-400 text-sm md:text-base max-w-2xl mb-6">
            Connect with world-class consultants to accelerate your performance
            improvements based on your{" "}
            <strong className="text-white underline">96.2 percentile rank</strong>{" "}
            and{" "}
            <strong className="text-white underline">
              +24.8% competitive delta
            </strong>{" "}
            findings.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onSchedule}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
            >
              Schedule First Consultation
            </button>
            <button className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition">
              View Methodology
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Sparkles,
            title: "AI-Assisted Pre-briefing",
            desc: "Our neural engine analyzes your data delta before you meet, providing consultants with an instant 360\u00B0 context map of your operational architecture.",
            color: "text-teal-400 bg-teal-500/20",
          },
          {
            icon: Network,
            title: "Expert Strategy Mapping",
            desc: "Translate high-level percentile rankings into concrete structural shifts through visual roadmap sessions with lead celestial architects.",
            color: "text-purple-400 bg-purple-500/20",
          },
          {
            icon: Presentation,
            title: "Actionable Execution Plans",
            desc: "Walk away from every session with a prioritized sprint backlog designed to close your competitive delta by an additional 12% in Q3.",
            color: "text-orange-400 bg-orange-500/20",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-xl bg-[#111827] border border-white/5 p-6"
          >
            <div
              className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-4`}
            >
              <card.icon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Sessions */}
      <div className="rounded-2xl bg-[#111827] border border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Upcoming Sessions</h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 text-gray-500">
            No Active Bookings
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <CalendarX2 className="w-7 h-7 text-gray-500" />
          </div>
          <h4 className="text-lg font-bold text-white mb-2">
            No consultations scheduled
          </h4>
          <p className="text-gray-400 text-sm max-w-md mb-5">
            Your performance data suggests high-impact gains are available in the
            current cycle. Start your first session to capture this alpha.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
              <Rocket className="w-3 h-3" />
              Lead Architect Available
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              Next Slot: Today, 14:00 UTC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STATE 2: Select Expert ─────────────────────────────────────────────────
function SelectExpertState({
  onSelect,
}: {
  onSelect: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState("All Specialists");

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Architect your next breakthrough.
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl">
          Select a specialized consultant to guide your celestial business
          transformation. Our experts are mathematically vetted for precision in
          their specific architecture pillars.
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1">
          Filter Pillars:
        </span>
        {filterPills.map((pill) => (
          <button
            key={pill}
            onClick={() => setActiveFilter(pill)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              activeFilter === pill
                ? "bg-orange-500 text-white"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Consultant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {consultants.map((c) => (
          <div
            key={c.name}
            className="rounded-xl bg-[#111827] border border-white/5 p-5 flex flex-col"
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ring-2 ring-white/10`}
              >
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-sm font-bold text-white truncate">
                    {c.name}
                  </h4>
                  <BadgeCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span className="text-[9px] font-bold uppercase text-teal-400">
                    Verified
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  {c.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-semibold">{c.rating}</span>
              </span>
              <span>{c.reviews} Reviews</span>
            </div>

            <div className="flex items-center justify-between text-xs mb-4">
              <span className="flex items-center gap-1 text-gray-400">
                <Calendar className="w-3 h-3 text-teal-400" />
                {c.nextSlot}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-[10px] font-medium">
                {c.badge}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <button
                onClick={onSelect}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
              >
                Select Profile
              </button>
              <button className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between pt-4">
        <div />
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm font-semibold hover:text-white hover:bg-white/10 transition">
          <HelpCircle className="w-4 h-4" />
          Need Guidance?
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-gray-500">
        <div className="flex gap-4">
          <span className="hover:text-gray-300 cursor-pointer">
            Privacy Architecture
          </span>
          <span className="hover:text-gray-300 cursor-pointer">
            Term Protocols
          </span>
          <span className="hover:text-gray-300 cursor-pointer">
            System Status
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          All Engines Optimal
        </span>
      </div>
    </div>
  );
}

// ─── STATE 3: Schedule Session ──────────────────────────────────────────────
function ScheduleSessionState({
  onConfirm,
  onBack,
}: {
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState(11);
  const [selectedTime, setSelectedTime] = useState("11:00 AM");
  const [focusOpen, setFocusOpen] = useState(false);

  // September 2024 starts on Sunday (0-indexed: Sun=0)
  const daysInMonth = 30;
  const startDay = 0; // Sunday
  const availableDays = [4, 5, 11, 12];
  const dottedDays = [5, 12];

  const timeSlots = [
    { label: "Morning Slot", time: "09:30 AM" },
    { label: "SELECTED", time: "11:00 AM" },
    { label: "Afternoon Slot", time: "02:30 PM" },
    { label: "Afternoon Slot", time: "04:00 PM" },
  ];

  const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  // Sunday start -> shift to Monday start
  const offset = startDay === 0 ? 6 : startDay - 1;
  for (let i = 0; i < offset; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  return (
    <div className="space-y-6 max-w-full">
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          Step 2 of 3: Scheduling &amp; Protocol
        </span>
      </button>

      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
          Architectural{" "}
          <span className="text-orange-400">Consultation</span>
        </h1>
        <p className="text-gray-400 text-sm max-w-xl">
          Map your operational trajectory with our leads. Dates highlighted in
          emerald represent peak architectural availability for your sector.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Calendar */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <button className="p-1 text-gray-400 hover:text-white transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <h3 className="text-sm font-bold text-white">September 2024</h3>
                <p className="text-[10px] text-gray-500">
                  Central European Time (GMT +2)
                </p>
              </div>
              <button className="p-1 text-gray-400 hover:text-white transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayLabels.map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-bold text-gray-500 text-center py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                if (day === null)
                  return <div key={`empty-${i}`} className="h-9" />;
                const isAvailable = availableDays.includes(day);
                const isSelected = day === selectedDay;
                const hasDot = dottedDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => isAvailable && setSelectedDay(day)}
                    className={`h-9 rounded-lg text-sm font-medium flex flex-col items-center justify-center relative transition ${
                      isSelected
                        ? "bg-teal-500 text-white"
                        : isAvailable
                        ? "bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"
                        : "text-gray-500 hover:bg-white/5"
                    }`}
                  >
                    {day}
                    {hasDot && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-teal-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Available Session
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-600" />
                Standard Capacity
              </span>
            </div>
          </div>

          {/* Consultant Info */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-teal-400/30">
              EV
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Elena Vance</h4>
              <p className="text-xs text-gray-400">
                Principal Architect &bull; Operations Strategy
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-bold">
                Specialist: High-Density Logistics
              </span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Time Slots */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-bold text-white">
                Select Time (CET)
              </h3>
            </div>
            <div className="space-y-2">
              {timeSlots.map((slot) => {
                const isActive = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition text-left ${
                      isActive
                        ? "border-orange-500 bg-orange-500/5"
                        : "border-white/5 bg-[#0d1117] hover:border-white/10"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold uppercase ${
                        isActive ? "text-orange-400" : "text-gray-500"
                      }`}
                    >
                      {isActive ? "Selected" : slot.label}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        isActive ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {slot.time}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Briefing */}
          <div className="rounded-xl bg-[#111827] border border-white/5 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Session Briefing</h3>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400">
                Report Linked
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                v4.2.1-Alpha
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-300 font-semibold">
                  Operations Deep Dive
                </span>
                <span className="text-xs text-teal-400 font-semibold">
                  96.2% Findings
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-teal-400 w-[96%]" />
              </div>
            </div>

            {/* Focus Area */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Critical Focus Area
              </label>
              <button
                onClick={() => setFocusOpen(!focusOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#0d1117] border border-white/5 text-sm text-gray-300"
              >
                Efficiency Optimization &amp; Bottlenecks
                {focusOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>

            {/* Special Requirements */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Special Requirements
              </label>
              <textarea
                className="w-full px-4 py-2.5 rounded-lg bg-[#0d1117] border border-white/5 text-sm text-gray-300 placeholder-gray-600 resize-none h-20 focus:outline-none focus:border-white/10"
                placeholder="Highlight specific operational anomalies for the Architect to review..."
              />
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition flex items-center justify-center gap-2"
          >
            Confirm Booking
            <ChevronRight className="w-4 h-4" />
          </button>
          <p className="text-center text-[10px] text-gray-500 uppercase tracking-wider">
            Secured by PICA Protocol &bull; No Refund Policy
          </p>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Architecture Load",
            value: "Optimal",
            sub: "84% Capacity",
            color: "text-teal-400",
          },
          {
            label: "Sector Benchmark",
            value: "Top Tier",
            sub: "+12.4% vs Industry",
            color: "text-teal-400",
          },
          {
            label: "Architect Feedback",
            value: "High Priority",
            sub: "Synced",
            color: "text-teal-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-[#111827] border border-white/5 p-5"
          >
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STATE 4: Booking Confirmed ─────────────────────────────────────────────
function BookingConfirmedState({
  onDashboard,
}: {
  onDashboard: () => void;
}) {
  return (
    <div className="space-y-6 max-w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">PICA Consultation</h2>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-400 hover:text-white transition">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-teal-400/30">
            A
          </div>
        </div>
      </div>

      {/* Teal gradient bar */}
      <div className="h-1 rounded-full bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-400" />

      {/* Success Section */}
      <div className="flex flex-col items-center text-center py-8">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
          Your Strategy Session is Locked In
        </h1>
        <p className="text-gray-400 text-sm max-w-lg">
          The Celestial Architect is preparing your deep-dive workspace.
          We&apos;ve notified Dr. Thorne of your high-priority request.
        </p>
      </div>

      {/* Consultant Card */}
      <div className="rounded-2xl bg-[#111827] border border-white/5 p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Consultant */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold ring-4 ring-teal-400/20 mb-4">
              AT
            </div>
            <h3 className="text-lg font-bold text-white">Dr. Aris Thorne</h3>
            <p className="text-sm text-gray-400 mb-3">
              Lead Strategic Architect
            </p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>
                Expertise:{" "}
                <span className="text-gray-300">Neural Markets</span>
              </p>
              <p>
                Tier:{" "}
                <span className="text-gray-300">Founding Partner</span>
              </p>
            </div>
          </div>

          {/* Right - Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">
                  Consultation Date
                </p>
                <p className="text-sm text-white font-semibold">
                  October 24, 2024
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">
                  Scheduled Time
                </p>
                <p className="text-sm text-white font-semibold">
                  02:00 PM EST
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Monitor className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">
                  Location
                </p>
                <p className="text-sm text-white font-semibold">
                  Celestial Architecture Suite (Secure Link)
                </p>
              </div>
            </div>

            <button className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
              <Link2 className="w-4 h-4" />
              Sync with Calendar
            </button>

            <div className="flex gap-3">
              <button className="flex-1 py-2.5 rounded-lg bg-[#0d1117] border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition">
                Prepare Briefing
              </button>
              <button
                onClick={onDashboard}
                className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
        <span className="hover:text-gray-300 cursor-pointer">
          Support Desk
        </span>
        <span className="hover:text-gray-300 cursor-pointer">
          Reschedule Consultation
        </span>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#111827] border border-white/5 text-xs">
        <span className="text-orange-400 font-mono font-semibold">
          TRANSACTION ID: PIC-992-AXL
        </span>
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Secure Connection Established
        </span>
      </div>
    </div>
  );
}

// ─── STATE 5: Active Sessions ───────────────────────────────────────────────
function ActiveSessionsState() {
  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Your Strategic Advisory
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Optimize your operational trajectory with high-performance architect
            insights. Currently tracking at the{" "}
            <span className="text-teal-400 font-semibold">
              96.2 percentile
            </span>{" "}
            efficiency tier.
          </p>
        </div>
        <div className="rounded-xl bg-[#111827] border border-white/5 px-5 py-3 flex-shrink-0">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            Performance Index
          </p>
          <p className="text-xl font-bold text-teal-400">96.2%</p>
        </div>
      </div>

      {/* Current Engagement + Quick Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Engagement */}
        <div className="lg:col-span-2 rounded-xl bg-[#111827] border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Current Engagement
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400">
              Confirmed
            </span>
          </div>

          <h4 className="text-lg font-bold text-white mb-4">
            Operations Architecture Review
          </h4>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
              AT
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Dr. Aris Thorne
              </p>
              <p className="text-xs text-teal-400">
                Chief Systems Architect
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-400" />
              Oct 24, 2:00 PM
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-400" />
              Duration: 60 min
            </span>
          </div>

          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition">
            <Monitor className="w-4 h-4" />
            Enter Briefing Room
          </button>
        </div>

        {/* Quick Booking */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Quick Booking</h3>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
              Select Domain
            </label>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-full text-xs font-semibold border border-teal-500 text-teal-400 bg-teal-500/5">
                Cloud Arch
              </button>
              <button className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10 text-gray-400 hover:border-white/20 transition">
                Security
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
              Urgency Level
            </label>
            <div className="h-1.5 rounded-full bg-white/5 relative">
              <div className="h-full rounded-full bg-teal-400 w-3/5" />
              <div className="absolute top-1/2 -translate-y-1/2 left-[60%] w-3 h-3 rounded-full bg-teal-400 border-2 border-[#111827]" />
            </div>
          </div>

          <button className="w-full py-2.5 rounded-lg bg-white/5 border border-teal-500/30 text-teal-400 text-sm font-semibold hover:bg-teal-500/5 transition">
            Request Priority Scan
          </button>
        </div>
      </div>

      {/* Historical Archive + Consultant Spotlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Historical Archive */}
        <div className="lg:col-span-2 rounded-xl bg-[#111827] border border-white/5 p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Historical Archive
          </h3>

          <div className="space-y-3">
            {[
              {
                icon: BarChart3,
                title: "Scalability Bottleneck Analysis",
                date: "Oct 12, 2023",
                consultant: "Elena Vance",
              },
              {
                icon: TrendingUp,
                title: "Global Distribution Strategy",
                date: "Sep 28, 2023",
                consultant: "Marcus Wei",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-4 p-4 rounded-lg bg-[#0d1117] border border-white/5"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.date} &bull; Consultant: {item.consultant}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 font-semibold hover:text-white hover:bg-white/10 transition">
                    Notes
                  </button>
                  <button className="p-1.5 text-gray-500 hover:text-white transition">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consultant Spotlights */}
        <div className="rounded-xl bg-[#111827] border border-white/5 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Consultant Spotlights
          </h3>

          {[
            {
              name: "Saira Jenkins",
              role: "Security & Compliance",
              initials: "SJ",
              gradient: "from-purple-400 to-pink-500",
            },
            {
              name: "Julian Vane",
              role: "Capital Deployment",
              initials: "JV",
              gradient: "from-blue-400 to-cyan-500",
            },
          ].map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-white/5 cursor-pointer hover:border-white/10 transition"
            >
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
              >
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs text-gray-500">{c.role}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Data Sync */}
      <div className="rounded-xl bg-[#111827] border border-white/5 p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-white">
                Data Synchronization
              </h3>
              <span className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="flex gap-1 items-end h-6 mb-2">
              {[40, 65, 50, 80, 55, 70, 90, 60, 75, 85, 45, 70].map(
                (h, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full bg-teal-400/60"
                    style={{ height: `${h}%` }}
                  />
                )
              )}
            </div>
            <p className="text-xs text-gray-400">
              Real-time sync active. Consultation metrics are currently 12%
              above quarterly baseline.
            </p>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-40">
        <button className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 transition">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page Export ───────────────────────────────────────────────────────
export default function ConsultationPage() {
  const [view, setView] = useState<ViewState>("empty");

  return (
    <>
      {view === "empty" && (
        <EmptyState onSchedule={() => setView("selectExpert")} />
      )}
      {view === "selectExpert" && (
        <SelectExpertState onSelect={() => setView("schedule")} />
      )}
      {view === "schedule" && (
        <ScheduleSessionState
          onConfirm={() => setView("confirmed")}
          onBack={() => setView("selectExpert")}
        />
      )}
      {view === "confirmed" && (
        <BookingConfirmedState onDashboard={() => setView("activeSessions")} />
      )}
      {view === "activeSessions" && <ActiveSessionsState />}
    </>
  );
}
