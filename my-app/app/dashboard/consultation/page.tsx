"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader,
  Lock,
  MessageSquare,
  Plus,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react";
import {
  bookConsultation,
  getConsultationTiers,
  getMe,
  getMyConsultationResults,
  getMyConsultations,
  getMySubscription,
  type CompletedResultOption,
  type ConsultationBookingPayload,
  type ConsultationTierPublic,
  type MeUser,
  type MySubscriptionPayload,
} from "@/lib/authClient";
import { ConsultationSkeleton } from "@/components/ui/skeleton";
import {
  convertFromUsd,
  formatMoney,
  resolveDisplayCurrency,
  type Currency,
} from "@/lib/utils";

// ─── Constants & Mock Data ──────────────────────────────────────────────────

const EXPERTS = [
  {
    id: "exp-1",
    name: "Dr. Aris Thorne",
    title: "Operations & Logistics Architecture",
    role: "Chief Systems Architect",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120&h=120",
    specialty: "Global Markets Expert",
    rating: 4.9,
    reviews: 124,
    availability: "Today, 2:30 PM",
    tier: 3,
    domain: "Operations",
  },
  {
    id: "exp-2",
    name: "Sarah Jenkins",
    title: "Financial Growth Engineer",
    role: "Financial Growth Specialist",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120",
    specialty: "Scalability Specialist",
    rating: 5.0,
    reviews: 89,
    availability: "Tomorrow, 10:00 AM",
    tier: 2,
    domain: "Finance",
  },
  {
    id: "exp-3",
    name: "Marcus Vane",
    title: "Marketing & Brand Physics",
    role: "Omnichannel Strategist",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120&h=120",
    specialty: "Omnichannel Expert",
    rating: 4.8,
    reviews: 210,
    availability: "Wed, 1:00 PM",
    tier: 1,
    domain: "Marketing",
  },
  {
    id: "exp-4",
    name: "Elena Rossi",
    title: "Human Resource Dynamics",
    role: "Culture Strategist",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120",
    specialty: "Talent Architect",
    rating: 4.9,
    reviews: 156,
    availability: "Today, 4:00 PM",
    tier: 1,
    domain: "HR",
  },
  {
    id: "exp-5",
    name: "David Chen",
    title: "Corporate Strategy & AI",
    role: "Process Optimizer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
    specialty: "Automation Architect",
    rating: 4.7,
    reviews: 42,
    availability: "Monday, 9:00 AM",
    tier: 2,
    domain: "Strategy",
  },
  {
    id: "exp-6",
    name: "Amara Okafor",
    title: "International Expansion Strategy",
    role: "Market Penetration Specialist",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=120&h=120",
    specialty: "Cross-border Expansion",
    rating: 5.0,
    reviews: 312,
    availability: "Today, 1:15 PM",
    tier: 3,
    domain: "Strategy",
  },
];

const SPOTLIGHTS = [
  {
    name: "Saira Jenkins",
    role: "Security & Compliance",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=80&h=80",
  },
  {
    name: "Julian Vane",
    role: "Capital Deployment",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=80&h=80",
  },
];

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  REQUESTED: { label: "Requested", tone: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  CONFIRMED: { label: "Confirmed", tone: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  ATTENDED: { label: "Attended", tone: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  NO_SHOW: { label: "No show", tone: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
  CANCELLED: { label: "Cancelled", tone: "bg-gray-500/10 text-gray-400 border border-gray-500/20" },
};

// ─── Formatters ──────────────────────────────────────────────────────────

const formatDateTime = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const bandColor = (band: string) => {
  const b = band.toUpperCase();
  if (b === "GREEN") return "text-emerald-400";
  if (b === "RED") return "text-rose-400";
  return "text-amber-400";
};

const labelForResult = (r: CompletedResultOption) => {
  const phase = r.phase === "PHASE2B" ? "Phase 2B" : "Phase 2A";
  const pillar =
    r.pillarName ?? (r.phase === "PHASE2B" ? r.pillarCode ?? "Pillar" : "All pillars");
  const date = formatDate(r.generatedAt);
  const score = Math.round(r.totalScore);
  return `${pillar} • ${phase} • ${date} • ${score} ${r.colorBand}`;
};

export default function ConsultationPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [tiers, setTiers] = useState<ConsultationTierPublic[]>([]);
  const [usdToNgn, setUsdToNgn] = useState(1);
  const [bookings, setBookings] = useState<ConsultationBookingPayload[]>([]);
  const [results, setResults] = useState<CompletedResultOption[]>([]);
  const [mySub, setMySub] = useState<MySubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1 = select expert/tier, 2 = schedule/details, 3 = confirmed
  const [selectedExpert, setSelectedExpert] = useState<typeof EXPERTS[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate() + 1); // Mock date selection day
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("11:00 AM");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [relatedSessionResultId, setRelatedSessionResultId] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const displayCurrency: Currency = useMemo(
    () => resolveDisplayCurrency(me?.country ?? null),
    [me?.country],
  );

  const refresh = async () => {
    const [meRes, tiersRes, bookingsRes, resultsRes, subRes] = await Promise.all([
      getMe(),
      getConsultationTiers(),
      getMyConsultations(),
      getMyConsultationResults(),
      getMySubscription(),
    ]);
    if (meRes.data) setMe(meRes.data.user);
    if (tiersRes.data) {
      setTiers(tiersRes.data.tiers);
      setUsdToNgn(tiersRes.data.usdToNgn);
    }
    if (bookingsRes.data) setBookings(bookingsRes.data.bookings);
    if (resultsRes.data) setResults(resultsRes.data.results);
    if (subRes.data?.subscription) {
      const s = subRes.data.subscription;
      setMySub(s.status === "ACTIVE" || s.status === "PAST_DUE" ? s : null);
    } else {
      setMySub(null);
    }
    if (meRes.error && !me) {
      setError(meRes.error.message ?? "Could not load your account.");
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openBookingModal = () => {
    setSelectedExpert(EXPERTS[0]);
    setBookingStep(1);
    setTopic("");
    setNotes("");
    setRelatedSessionResultId("");
    setCheckoutUrl(null);
    setBookingModalOpen(true);
  };

  // Performance calculations
  const maxScore = useMemo(() => {
    if (results.length === 0) return 96.2;
    return Math.max(...results.map((r) => r.totalScore));
  }, [results]);

  const percentile = useMemo(() => {
    if (results.length === 0) return "96.2%";
    return `${Math.min(99.9, Math.round(maxScore * 10) / 10)}%`;
  }, [maxScore]);

  const percentileText = useMemo(() => {
    if (results.length === 0) return "Top 4%";
    const rank = Math.max(1, 100 - maxScore);
    return `Top ${Math.round(rank)}%`;
  }, [maxScore]);

  const coveredTier = useMemo(() => {
    if (!mySub) return null;
    return tiers.find((t) => t.tier === mySub.plan.tier) ?? null;
  }, [mySub, tiers]);

  const activeBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === "CONFIRMED" || b.status === "REQUESTED",
    );
  }, [bookings]);

  const pastBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status !== "CONFIRMED" && b.status !== "REQUESTED",
    );
  }, [bookings]);

  const consultationsRemaining = useMemo(() => {
    if (!mySub) return 0;
    return Math.max(
      0,
      mySub.plan.consultationsPerMonth - mySub.usage.consultationsUsed,
    );
  }, [mySub]);

  // Maps expert config tier back to actual DB tier record
  const getDbTierForExpert = (expert: typeof EXPERTS[0]) => {
    return tiers.find((t) => t.tier === expert.tier) || tiers[0] || null;
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpert) return;

    const dbTier = getDbTierForExpert(selectedExpert);
    if (!dbTier) {
      alert("Consultation tiers are currently unavailable.");
      return;
    }

    if (topic.trim().length < 3) {
      alert("Provide a briefing topic (minimum 3 characters).");
      return;
    }

    setSubmittingBooking(true);
    const mockPreferred = `September ${selectedDate}, 2024 at ${selectedTimeSlot} (CET)`;

    const res = await bookConsultation({
      tierId: dbTier.id,
      topic: topic.trim(),
      notes: notes.trim() || undefined,
      preferredTimes: mockPreferred,
      relatedSessionResultId: relatedSessionResultId || undefined,
    });
    setSubmittingBooking(false);

    if (res.error || !res.data) {
      alert(res.error?.message ?? "Failed to book session.");
      return;
    }

    await refresh();

    if (res.data.coveredBySubscription) {
      setBookingStep(3);
    } else {
      const auth = res.data.booking.payment?.authorizationUrl;
      if (auth) {
        setCheckoutUrl(auth);
        setBookingStep(3);
      } else {
        setBookingStep(3);
      }
    }
  };

  if (loading) {
    return <ConsultationSkeleton />;
  }

  if (error || !me) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 bg-[#090b0f]">
        <div className="max-w-md text-center">
          <p className="mb-4 text-red-400">{error ?? "Account unavailable"}</p>
          <Link
            href="/Auth/login"
            className="inline-block rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-200">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-[#0d1512] p-4 text-sm text-emerald-300 shadow-2xl">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
          <span className="flex-1 font-medium">{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="text-emerald-300 hover:text-emerald-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {bookings.length > 0 ? (
        // ─── ACTIVE BOOKINGS DASHBOARD LAYOUT ───
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c1a26] via-[#0b141e] to-[#090d16] p-8 md:p-10">
            <div className="absolute right-0 top-0 h-40 w-40 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="absolute left-1/3 bottom-0 h-32 w-32 bg-emerald-500/5 rounded-full blur-3xl" />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  Your Strategic Advisory
                </h1>
                <p className="mt-2 text-sm md:text-base text-gray-400 max-w-2xl leading-relaxed">
                  Optimize your operational trajectory with high-performance architect
                  insights. Currently tracking at the {percentile} efficiency tier.
                </p>
              </div>

              {/* Performance Index Box */}
              <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#121620]/60 p-4 md:p-5 backdrop-blur">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                    Performance Index
                  </p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {percentile}
                  </p>
                </div>
                <div className="h-10 w-[1px] bg-white/10" />
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  {percentileText}
                </span>
              </div>
            </div>
          </div>

          {/* Two-Column Workspace */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column (Main Engagement Content) */}
            <div className="space-y-8 lg:col-span-2">
              {/* Current Engagements */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                  Current Engagement
                </h3>
                {activeBookings.length > 0 ? (
                  <div className="space-y-4">
                    {activeBookings.map((b) => {
                      const matchedExpert =
                        EXPERTS.find((e) => e.tier === b.tier.tier) || EXPERTS[0];
                      const isConfirmed = b.status === "CONFIRMED";
                      const displayTitle = b.topic;

                      return (
                        <div
                          key={b.id}
                          className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#111318] p-6 hover:border-white/10 transition duration-300"
                        >
                          <div className="absolute right-0 top-0 h-24 w-24 bg-white/[0.01] rounded-bl-full" />
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                  STATUS_COPY[b.status]?.tone || ""
                                }`}
                              >
                                {STATUS_COPY[b.status]?.label || b.status}
                              </span>
                              {b.coveredBySubscription && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                                  <Crown className="h-3 w-3" />
                                  Subscription Credit
                                </span>
                              )}
                            </div>
                            {isConfirmed && b.meetingLink ? (
                              <a
                                href={b.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Enter Briefing Room
                              </a>
                            ) : (
                              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/15">
                                <Clock className="h-3.5 w-3.5" />
                                Awaiting Scheduler Confirmation
                              </span>
                            )}
                          </div>

                          <h2 className="text-xl font-bold text-white mt-4 leading-tight">
                            {displayTitle}
                          </h2>

                          {/* Related Results linked indicator */}
                          {b.relatedResult && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 w-fit">
                              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                              <span>
                                Linked Scan:{" "}
                                <span className={`font-semibold ${bandColor(b.relatedResult.colorBand)}`}>
                                  {b.relatedResult.pillarCode || "Diagnostic"} ({Math.round(b.relatedResult.totalScore)} Score)
                                </span>
                              </span>
                            </div>
                          )}

                          <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                            {/* Expert Info */}
                            <div className="flex items-center gap-3">
                              <img
                                src={matchedExpert.avatar}
                                alt={matchedExpert.name}
                                className="h-10 w-10 rounded-full object-cover border border-white/10"
                              />
                              <div>
                                <p className="text-sm font-bold text-white">
                                  {matchedExpert.name}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {matchedExpert.role}
                                </p>
                              </div>
                            </div>

                            {/* Schedule details */}
                            <div className="flex items-center gap-6 text-xs text-gray-400">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-[9px] uppercase tracking-wider text-gray-600 font-bold">
                                    Session Date
                                  </p>
                                  <p className="font-semibold text-white mt-0.5">
                                    {b.scheduledAt ? formatDate(b.scheduledAt) : "Proposing Slots"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-[9px] uppercase tracking-wider text-gray-600 font-bold">
                                    Time/Duration
                                  </p>
                                  <p className="font-semibold text-white mt-0.5">
                                    {b.scheduledAt
                                      ? formatDateTime(b.scheduledAt).split(",")[1]?.trim() || "11:00 AM"
                                      : `${b.tier.durationMinutes} min Call`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/5 bg-[#111318]/40 p-8 text-center">
                    <Calendar className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No active bookings scheduled.</p>
                  </div>
                )}
              </div>

              {/* Historical Archive */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                  Historical Archive
                </h3>
                {pastBookings.length > 0 ? (
                  <div className="space-y-3">
                    {pastBookings.map((b) => (
                      <HistoryRow key={b.id} booking={b} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/5 bg-[#111318]/40 p-8 text-center">
                    <FileText className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No completed advisory history.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Sidebar Quick Actions) */}
            <div className="space-y-8">
              {/* Quick Booking */}
              <div className="rounded-2xl border border-white/5 bg-[#111318] p-6">
                <h4 className="text-lg font-bold text-white mb-2">Quick Booking</h4>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  Fast track an operational briefing with Pica&apos;s lead celestial architects.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 block">
                      Select Domain
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={openBookingModal}
                        className="py-2.5 px-3 rounded-lg border border-orange-500/20 hover:border-orange-500 bg-orange-500/5 hover:bg-orange-500/10 text-xs font-semibold text-white transition text-center"
                      >
                        Cloud Arch
                      </button>
                      <button
                        onClick={openBookingModal}
                        className="py-2.5 px-3 rounded-lg border border-white/5 hover:border-white/20 bg-white/[0.02] text-xs font-semibold text-white transition text-center"
                      >
                        Security
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 block">
                      Urgency Level
                    </label>
                    <div className="relative pt-1">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-1/3 rounded-full" />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 font-medium">
                        <span>Standard</span>
                        <span>Rush</span>
                        <span>Critical</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={openBookingModal}
                    className="w-full mt-6 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white uppercase tracking-wider transition shadow-lg shadow-orange-500/15"
                  >
                    Request Priority Scan
                  </button>
                </div>
              </div>

              {/* Consultant Spotlights */}
              <div className="rounded-2xl border border-white/5 bg-[#111318] p-6">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Consultant Spotlights
                </h4>
                <div className="space-y-4">
                  {SPOTLIGHTS.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0c0d12] border border-white/[0.02]"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={s.avatar}
                          alt={s.name}
                          className="h-9 w-9 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">{s.name}</p>
                          <p className="text-[9px] text-gray-500">{s.role}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Synchronization Widget */}
              <div className="rounded-2xl border border-white/5 bg-[#111318] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-white">Data Synchronization</h4>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                {/* Visual Representation of Sync Bars */}
                <div className="flex items-end gap-1.5 h-16 mb-4">
                  <div className="bg-white/5 h-1/3 flex-1 rounded-sm" />
                  <div className="bg-white/5 h-1/2 flex-1 rounded-sm" />
                  <div className="bg-white/5 h-3/4 flex-1 rounded-sm" />
                  <div className="bg-emerald-400 h-full flex-1 rounded-sm" />
                  <div className="bg-white/5 h-2/3 flex-1 rounded-sm" />
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Real-time sync active. Consultation metrics are currently 12% above quarterly baseline.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ─── EMPTY STATE DESIGN LAYOUT ───
        <div className="space-y-12 animate-fadeIn max-w-5xl mx-auto">
          {/* Hero Banner Grid */}
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c1a26] via-[#0b141e] to-[#090d16] p-8 md:p-12">
            <div className="absolute right-0 top-0 h-64 w-64 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="absolute left-1/4 bottom-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  Performance Index: Top 4%
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                  Unlock <span className="text-orange-500">Strategic</span> Guidance
                </h1>
                <p className="mt-4 text-sm md:text-base text-gray-400 leading-relaxed">
                  Connect with world-class consultants to accelerate your performance
                  improvements based on your {percentile} rank and +24.8%
                  competitive delta findings.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={openBookingModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-3.5 text-sm font-bold text-white uppercase tracking-wider transition shadow-lg shadow-orange-500/20 active:scale-95"
                  >
                    <Calendar className="h-4 w-4" />
                    Schedule First Consultation
                  </button>
                  <button
                    onClick={openBookingModal}
                    className="rounded-xl border border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] px-6 py-3.5 text-sm font-semibold text-white transition"
                  >
                    View Methodology
                  </button>
                </div>
              </div>

              {/* Decorative performance index circle gauge widget */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-[#121620]/60 backdrop-blur min-w-[200px]">
                <div className="relative flex items-center justify-center h-28 w-28">
                  <svg className="absolute h-full w-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1a202c"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#34d399"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset="9.5" // 96.2%
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-2xl font-black text-white">96.2%</span>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4 text-center">
                  Percentile Delta
                </p>
              </div>
            </div>
          </div>

          {/* Three Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/5 bg-[#111318] p-6 hover:border-white/10 transition group">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 group-hover:scale-105 transition">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI-Assisted Pre-briefing</h3>
              <p className="mt-2.5 text-xs text-gray-500 leading-relaxed">
                Our neural engine analyzes your data delta before you meet, providing
                consultants with an instant 360° context map of your operational architecture.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#111318] p-6 hover:border-white/10 transition group">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Expert Strategy Mapping</h3>
              <p className="mt-2.5 text-xs text-gray-500 leading-relaxed">
                Translate high-level percentile rankings into concrete structural shifts through
                visual roadmap sessions with lead celestial architects.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#111318] p-6 hover:border-white/10 transition group">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Actionable Execution Plans</h3>
              <p className="mt-2.5 text-xs text-gray-500 leading-relaxed">
                Walk away from every session with a prioritized sprint backlog designed to close
                your competitive delta by an additional 12% in Q3.
              </p>
            </div>
          </div>

          {/* Upcoming Sessions Box (Empty State Version) */}
          <div className="rounded-2xl border border-white/5 bg-[#111318] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Upcoming Sessions
              </h3>
              <span className="text-[10px] text-gray-600 uppercase font-semibold">
                No Active Bookings
              </span>
            </div>
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <h4 className="text-lg font-bold text-white">No consultations scheduled</h4>
              <p className="mt-2 text-xs text-gray-500 max-w-md leading-relaxed mx-auto">
                Your performance data suggests high-impact gains are available in the current
                cycle. Start your first session to capture this alpha.
              </p>
            </div>
            <div className="px-6 py-4 bg-[#0a0d13] border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <img
                  src={EXPERTS[0].avatar}
                  alt="Dr. Thorne"
                  className="h-6 w-6 rounded-full object-cover border border-white/10"
                />
                <span className="font-semibold text-gray-400">Lead Architect Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Next Slot: Today, 14:00 UTC</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={openBookingModal}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-2xl shadow-orange-500/30 transition hover:scale-105 active:scale-95 z-40"
        aria-label="Book Consultation"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* ─── MULTI-STEP BOOKING MODAL (SCHEDULER WIZARD) ─── */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0c0e14] shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>Step {bookingStep} of 3</span>
                <span>•</span>
                <span>
                  {bookingStep === 1
                    ? "Consultant Selection"
                    : bookingStep === 2
                      ? "Scheduling & Protocol"
                      : "Booking Confirmed"}
                </span>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="rounded-lg p-1 text-gray-500 hover:text-white hover:bg-white/5 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {/* STEP 1: SELECT EXPERT / TIER */}
              {bookingStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                      Architect your next breakthrough.
                    </h2>
                    <p className="mt-2 text-xs md:text-sm text-gray-400 max-w-3xl leading-relaxed">
                      Select a specialized consultant to guide your celestial business
                      transformation. Our experts are mathematically vetted for precision in their
                      specific architecture pillars.
                    </p>
                  </div>

                  {/* Vetted Experts Card Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {EXPERTS.map((exp) => {
                      const dbTier = getDbTierForExpert(exp);
                      const isSelected = selectedExpert?.id === exp.id;
                      if (!dbTier) return null;

                      const isCovered = coveredTier?.id === dbTier.id;
                      const hasQuotaLeft = isCovered && consultationsRemaining > 0;
                      const priceConverted = convertFromUsd(
                        dbTier.priceUsd,
                        displayCurrency,
                        usdToNgn,
                      );

                      return (
                        <div
                          key={exp.id}
                          onClick={() => setSelectedExpert(exp)}
                          className={`relative flex flex-col justify-between rounded-xl border p-5 cursor-pointer transition duration-200 hover:scale-[1.01] ${
                            isSelected
                              ? "border-orange-500 bg-orange-500/[0.03] ring-1 ring-orange-500/20"
                              : "border-white/5 bg-[#111318] hover:border-white/10"
                          }`}
                        >
                          {/* Checked Indicator */}
                          {isSelected && (
                            <span className="absolute top-4 right-4 h-5 w-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          )}

                          {/* Profile Header */}
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={exp.avatar}
                                  alt={exp.name}
                                  className="h-12 w-12 rounded-full object-cover border border-white/15"
                                />
                                <span className="absolute -bottom-1.5 -right-1 rounded-full bg-emerald-500 px-1 py-0.5 text-[7px] font-black text-black tracking-wide uppercase">
                                  Verified
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-orange-400">
                                    ★ {exp.rating}
                                  </span>
                                  <span className="text-[9px] text-gray-500">
                                    ({exp.reviews} reviews)
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-white mt-0.5">
                                  {exp.name}
                                </h4>
                              </div>
                            </div>

                            {/* Expertise info */}
                            <p className="mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              {exp.title}
                            </p>
                            <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
                              {exp.specialty}
                            </p>
                            <p className="mt-3 text-[10px] text-gray-500">
                              Next availability:{" "}
                              <span className="text-white font-semibold">
                                {exp.availability}
                              </span>
                            </p>
                          </div>

                          {/* Price Tag Info */}
                          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-gray-600">
                              {dbTier.name}
                            </span>
                            {hasQuotaLeft ? (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                <Crown className="h-3 w-3" />
                                Included
                              </span>
                            ) : (
                              <span className="text-sm font-extrabold text-white">
                                {formatMoney(priceConverted ?? 0, displayCurrency)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      onClick={() => setBookingStep(2)}
                      disabled={!selectedExpert}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-3 text-xs font-bold text-white uppercase tracking-wider transition disabled:opacity-50"
                    >
                      Proceed to Schedule
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SCHEDULING & PROTOCOL */}
              {bookingStep === 2 && selectedExpert && (
                <form onSubmit={handleBookSubmit} className="space-y-8 animate-fadeIn">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingStep(1)}
                        className="text-xs font-semibold text-orange-400 hover:underline"
                      >
                        ← Back to experts
                      </button>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                      Architectural <span className="text-orange-500">Consultation</span>
                    </h2>
                    <p className="mt-2 text-xs md:text-sm text-gray-400 max-w-3xl leading-relaxed">
                      Map your operational trajectory with our leads. Dates highlighted in emerald
                      represent peak architectural availability for your sector.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left Column: Calendar Slots Mock */}
                    <div className="lg:col-span-3 space-y-6">
                      <div className="p-5 rounded-xl border border-white/5 bg-[#111318]">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-white">September 2024</span>
                          <span className="text-[10px] text-gray-500">CET Timezone</span>
                        </div>
                        {/* Grid representing days of the week */}
                        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-gray-600 mb-2 uppercase">
                          <span>Mon</span>
                          <span>Tue</span>
                          <span>Wed</span>
                          <span>Thu</span>
                          <span>Fri</span>
                          <span>Sat</span>
                          <span>Sun</span>
                        </div>
                        {/* Custom Mock Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: 14 }).map((_, idx) => {
                            const dayNum = idx + 1;
                            const isSelectable = [4, 5, 11, 12].includes(dayNum);
                            const isSelected = selectedDate === dayNum;

                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={!isSelectable}
                                onClick={() => setSelectedDate(dayNum)}
                                className={`h-9 rounded-lg flex items-center justify-center text-xs font-bold transition relative ${
                                  isSelected
                                    ? "bg-emerald-400 text-black shadow-lg shadow-emerald-400/20"
                                    : isSelectable
                                      ? "border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500/60"
                                      : "text-gray-700 cursor-not-allowed"
                                }`}
                              >
                                {dayNum}
                                {isSelectable && !isSelected && (
                                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Expert Detail Card */}
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-[#111318]">
                        <img
                          src={selectedExpert.avatar}
                          alt={selectedExpert.name}
                          className="h-12 w-12 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                            Selected Strategist
                          </p>
                          <h4 className="text-sm font-bold text-white mt-0.5">
                            {selectedExpert.name}
                          </h4>
                          <p className="text-[10px] text-orange-400 mt-0.5">
                            {selectedExpert.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Time slots & Briefing Inputs */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Slots Selector */}
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                          Select Time (CET)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {["09:30 AM", "11:00 AM", "02:30 PM", "04:00 PM"].map((slot) => {
                            const isSelected = selectedTimeSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedTimeSlot(slot)}
                                className={`py-3 text-xs font-semibold rounded-lg text-center border transition ${
                                  isSelected
                                    ? "border-emerald-400 bg-emerald-500/5 text-emerald-400"
                                    : "border-white/5 bg-[#111318] hover:border-white/15 text-gray-400 hover:text-white"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Briefing inputs */}
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                            Critical Focus Area *
                          </label>
                          <input
                            required
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Scaling bottlenecks, security compliance"
                            className="w-full bg-[#111318] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                          />
                        </div>

                        {results.length > 0 && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                              Link Diagnostic Scan (Optional)
                            </label>
                            <select
                              value={relatedSessionResultId}
                              onChange={(e) => setRelatedSessionResultId(e.target.value)}
                              className="w-full bg-[#111318] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500 transition"
                            >
                              <option value="">— Choose scan result —</option>
                              {results.map((r) => (
                                <option key={r.sessionResultId} value={r.sessionResultId}>
                                  {labelForResult(r)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                            Special Requirements
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Detail any specific anomalies or metrics you want reviewed..."
                            className="w-full bg-[#111318] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white outline-none resize-none focus:border-orange-500 transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer checkout bar */}
                  <div className="border-t border-white/5 pt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-xs text-gray-500 max-w-md">
                      {getDbTierForExpert(selectedExpert) && (
                        <>
                          {coveredTier?.tier === selectedExpert.tier && consultationsRemaining > 0 ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Crown className="h-3.5 w-3.5" />
                              Included with subscription ({consultationsRemaining} left)
                            </span>
                          ) : (
                            <span>
                              Booking fee:{" "}
                              <span className="font-semibold text-white">
                                {formatMoney(
                                  convertFromUsd(
                                    getDbTierForExpert(selectedExpert)!.priceUsd,
                                    displayCurrency,
                                    usdToNgn,
                                  ) ?? 0,
                                  displayCurrency,
                                )}
                              </span>{" "}
                              will apply.
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setBookingStep(1)}
                        className="py-3 px-5 text-xs font-semibold text-gray-400 hover:text-white transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingBooking}
                        className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white uppercase tracking-wider transition disabled:opacity-50"
                      >
                        {submittingBooking && <Loader className="h-4 w-4 animate-spin" />}
                        Confirm Booking
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* STEP 3: SUCCESS CONFIRMATION / PAY CHEKOUT */}
              {bookingStep === 3 && selectedExpert && (
                <div className="text-center py-8 max-w-md mx-auto space-y-6 animate-fadeIn">
                  <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>

                  {checkoutUrl ? (
                    <>
                      <h2 className="text-2xl font-black text-white">Payment Secure Checkout</h2>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        To lock in your strategic advisory call with {selectedExpert.name}, please
                        complete the secure card checkout using the link below.
                      </p>
                      <div className="pt-4 flex flex-col gap-2">
                        <a
                          href={checkoutUrl}
                          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white uppercase tracking-wider transition"
                        >
                          Redirect to Secure Payment
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setBookingModalOpen(false)}
                          className="text-xs text-gray-500 hover:text-white transition py-2"
                        >
                          Close Window
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-black text-white leading-tight">
                        Your Strategy Session is Locked In
                      </h2>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        The Celestial Architect is preparing your deep-dive workspace. We&apos;ve
                        notified {selectedExpert.name} of your high-priority request.
                      </p>

                      {/* Briefing Details Card */}
                      <div className="text-left rounded-xl border border-white/5 bg-[#111318] p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedExpert.avatar}
                            alt={selectedExpert.name}
                            className="h-10 w-10 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white">
                              {selectedExpert.name}
                            </h4>
                            <p className="text-[10px] text-gray-500">
                              {selectedExpert.role}
                            </p>
                          </div>
                        </div>

                        <div className="h-[1px] bg-white/5" />

                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-gray-600 font-bold">
                              Consultation Date
                            </p>
                            <p className="font-semibold text-white mt-0.5">
                              September {selectedDate}, 2024
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-gray-600 font-bold">
                              Scheduled Time
                            </p>
                            <p className="font-semibold text-white mt-0.5">
                              {selectedTimeSlot} EST
                            </p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-[9px] uppercase tracking-wider text-gray-600 font-bold">
                            Location
                          </p>
                          <p className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" />
                            Celestial Architecture Suite (Secure Link)
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            alert("Calendar sync configuration initiated!");
                          }}
                          className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white uppercase tracking-wider transition"
                        >
                          Sync with Calendar
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingModalOpen(false)}
                          className="w-full py-3.5 px-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-bold text-white uppercase tracking-wider transition"
                        >
                          Go to Dashboard
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HISTORY ROW — Past/attended/canceled bookings drawn in list format
// ─────────────────────────────────────────────────────────────────────────

function HistoryRow({ booking }: { booking: ConsultationBookingPayload }) {
  const [open, setOpen] = useState(false);
  const consultantName = booking.adminNotesUpdatedBy
    ? [booking.adminNotesUpdatedBy.firstName, booking.adminNotesUpdatedBy.lastName]
        .filter(Boolean)
        .join(" ")
    : "PICA Consultant";

  const matchedExpert =
    EXPERTS.find((e) => e.tier === booking.tier.tier) || EXPERTS[0];

  return (
    <div className="rounded-xl border border-white/5 bg-[#111318] p-4 hover:border-white/10 transition duration-200">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#0c0d12] flex items-center justify-center border border-white/[0.05]">
            <FileText className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white leading-tight">
              {booking.topic}
            </h4>
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
              <span>{formatDate(booking.requestedAt)}</span>
              <span>•</span>
              <span>Consultant: {consultantName}</span>
            </p>
          </div>
        </div>

        {/* Notes & Actions */}
        <div className="flex items-center gap-2">
          {booking.adminNotes && (
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-gray-400 hover:text-white transition"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Notes
            </button>
          )}
          <button
            onClick={() => {
              alert("Downloading notes pack...");
            }}
            className="p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-gray-400 hover:text-white transition"
            aria-label="Download Summary"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Feedback Panel */}
      {open && booking.adminNotes && (
        <div className="mt-4 p-4 rounded-lg bg-[#0c0d12] border border-indigo-500/10 text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-400 uppercase tracking-widest text-[9px]">
              Consultant Briefing Notes
            </span>
            <span className="text-[9px] text-gray-600">
              Updated {booking.adminNotesUpdatedAt ? formatDate(booking.adminNotesUpdatedAt) : ""}
            </span>
          </div>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {booking.adminNotes}
          </p>
        </div>
      )}
    </div>
  );
}
