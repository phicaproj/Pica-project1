"use client";

// Polished consultation surface — Section E content rebuilt in the dashboard's
// visual language (rounded-2xl cards, #111827 surfaces, white/5 borders,
// orange accent on CTAs) so it slots in next to /dashboard/plans and
// /dashboard/subscription.
//
// Layout:
//   1. Hero strip — title + lead, optional subscription-credits badge,
//      "Book another" CTA that anchors to the request form.
//   2. Bookings strip — responsive card grid; each card is a self-contained
//      status + tier + scheduled-time + meeting-link tile.
//   3. Request form — two columns: form fields left, tier selector right.
//      Footer carries the explainer copy + the Book button so the user
//      always sees what's about to happen before they click.
//
// Data flow + API calls + quota-vs-paywall branching are unchanged from the
// Section E build — only the markup and class names move.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Loader,
  MessageSquare,
  Plus,
  Sparkles,
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

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  REQUESTED: { label: "Requested", tone: "bg-amber-500/15 text-amber-300" },
  CONFIRMED: { label: "Confirmed", tone: "bg-emerald-500/15 text-emerald-300" },
  ATTENDED: { label: "Attended", tone: "bg-blue-500/15 text-blue-300" },
  NO_SHOW: { label: "No show", tone: "bg-rose-500/15 text-rose-300" },
  CANCELLED: { label: "Cancelled", tone: "bg-gray-500/15 text-gray-300" },
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

// ─── Page ────────────────────────────────────────────────────────────────

export default function ConsultationPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [tiers, setTiers] = useState<ConsultationTierPublic[]>([]);
  const [usdToNgn, setUsdToNgn] = useState(1);
  const [bookings, setBookings] = useState<ConsultationBookingPayload[]>([]);
  const [results, setResults] = useState<CompletedResultOption[]>([]);
  // Pre-select-by-subscription depends on this; null = no active sub.
  const [mySub, setMySub] = useState<MySubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);

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
      // Pulled here so a refresh after booking also re-reads the usage
      // counter — the BE has just decremented `consultationsUsed`.
      getMySubscription(),
    ]);
    if (meRes.data) setMe(meRes.data.user);
    if (tiersRes.data) {
      setTiers(tiersRes.data.tiers);
      setUsdToNgn(tiersRes.data.usdToNgn);
    }
    if (bookingsRes.data) setBookings(bookingsRes.data.bookings);
    if (resultsRes.data) setResults(resultsRes.data.results);
    // Only treat ACTIVE/PAST_DUE as "covered" — cancelled/expired subs don't
    // grant quota. The BE quota check applies the same rule.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return <ConsultationSkeleton />;
  }

  if (error || !me) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
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
    <div className="space-y-10">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#1a2030] to-[#111827] p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-300">
              <MessageSquare className="h-3 w-3" />
              Talk to an expert
            </div>
            <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
              Book a consultation
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-400 md:text-base">
              Pick a tier, tell us what you want to talk about, and we&apos;ll
              confirm a time by email. Subscribers use a consultation credit
              automatically — otherwise you&apos;ll go through a secure checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            {bookings.length === 0 ? "Book your first" : "Book another"}
          </button>
        </div>
      </section>

      {toast && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="text-emerald-300 hover:text-emerald-100"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Bookings strip ──────────────────────────────────────── */}
      {bookings.length > 0 ? (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-white">Your consultations</h2>
            <p className="text-xs text-gray-500">
              {bookings.length} {bookings.length === 1 ? "request" : "requests"}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-white/10 bg-[#111827]/40 p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <MessageSquare className="h-5 w-5 text-gray-500" />
          </div>
          <p className="text-sm text-gray-400">
            No consultations yet — fill the form below to book your first.
          </p>
        </section>
      )}

      {/* ── Request form ───────────────────────────────────────── */}
      <section ref={formRef}>
        <BookingForm
          me={me}
          tiers={tiers}
          usdToNgn={usdToNgn}
          displayCurrency={displayCurrency}
          results={results}
          mySub={mySub}
          onBooked={async (msg) => {
            setToast(msg);
            await refresh();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BOOKING CARD — one card per request, with status, tier meta,
// scheduled time + meeting CTA when confirmed, and a payment-pending CTA
// when checkout was abandoned.
// ─────────────────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: ConsultationBookingPayload }) {
  const status = STATUS_COPY[booking.status] ?? {
    label: booking.status,
    tone: "bg-gray-500/15 text-gray-300",
  };
  const paymentPending =
    booking.payment !== null && booking.payment.status !== "SUCCESS";
  // Notes panel collapses by default — the card stays compact in the grid;
  // the user opts in to read the consultant's feedback.
  const [notesOpen, setNotesOpen] = useState(false);
  const consultantName = booking.adminNotesUpdatedBy
    ? [
        booking.adminNotesUpdatedBy.firstName,
        booking.adminNotesUpdatedBy.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/5 bg-[#111827] p-5 transition hover:border-white/10">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${status.tone}`}
        >
          {status.label}
        </span>
        {booking.coveredBySubscription && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-300">
            <Crown className="h-3 w-3" />
            Subscription
          </span>
        )}
        {paymentPending && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
            Payment pending
          </span>
        )}
      </div>

      <p className="text-base font-semibold leading-snug text-white">
        {booking.topic}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        <span>{booking.tier.name}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {booking.tier.durationMinutes} min
        </span>
        <span>· Requested {formatDate(booking.requestedAt)}</span>
      </p>

      {booking.relatedResult && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-400">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-orange-400" />
          <span>
            Related to{" "}
            <span className={`font-semibold ${bandColor(booking.relatedResult.colorBand)}`}>
              {labelForResult(booking.relatedResult)}
            </span>
          </span>
        </p>
      )}

      {booking.status === "CONFIRMED" && booking.scheduledAt && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <Calendar className="h-3.5 w-3.5" />
            Scheduled
          </p>
          <p className="text-sm font-medium text-white">
            {formatDateTime(booking.scheduledAt)}
          </p>
          {booking.meetingLink && (
            <a
              href={booking.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              Join meeting <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {booking.notes && (
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-gray-500">
          <span className="font-semibold text-gray-400">Notes:</span> {booking.notes}
        </p>
      )}

      {paymentPending && booking.payment?.authorizationUrl && (
        <a
          href={booking.payment.authorizationUrl}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
        >
          Complete payment
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {/* Consultant feedback panel — only rendered when the admin has saved
          notes. Collapsed by default so the card stays compact in the grid;
          the user clicks "View notes" to expand. `whitespace-pre-wrap`
          preserves the admin's line breaks. */}
      {booking.adminNotes && (
        <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
          <button
            type="button"
            onClick={() => setNotesOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              <MessageSquare className="h-3.5 w-3.5" />
              Consultant left feedback
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
              {notesOpen ? "Hide" : "View notes"}
            </span>
          </button>
          {notesOpen && (
            <>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                {booking.adminNotes}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-widest text-indigo-300/70">
                Updated {booking.adminNotesUpdatedAt ? formatDate(booking.adminNotesUpdatedAt) : ""}
                {consultantName ? ` · ${consultantName}` : ""}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BOOKING FORM — two-column on desktop, stacked on mobile.
// ─────────────────────────────────────────────────────────────────────────

function BookingForm({
  me: _me,
  tiers,
  usdToNgn,
  displayCurrency,
  results,
  mySub,
  onBooked,
}: {
  me: MeUser;
  tiers: ConsultationTierPublic[];
  usdToNgn: number;
  displayCurrency: Currency;
  results: CompletedResultOption[];
  mySub: MySubscriptionPayload | null;
  onBooked: (message: string) => void;
}) {
  // The tier that the user's subscription plan covers, joined by tier number.
  // SubscriptionPlan.tier and ConsultationTier.tier are both 1/2/3, so this is
  // a direct match. When the user has no active sub `coveredTier` is null and
  // the form behaves like the legacy free-pick UI.
  const coveredTier = useMemo(() => {
    if (!mySub) return null;
    return tiers.find((t) => t.tier === mySub.plan.tier) ?? null;
  }, [mySub, tiers]);

  const consultationsRemaining = mySub
    ? Math.max(0, mySub.plan.consultationsPerMonth - mySub.usage.consultationsUsed)
    : 0;
  const subCoversBooking = Boolean(coveredTier) && consultationsRemaining > 0;

  // Default selection: the subscription-covered tier when one exists, even
  // if quota is spent (the user can still see/pick it; they just pay).
  // Otherwise fall back to the first tier in the catalogue.
  const [tierId, setTierId] = useState<string>(
    coveredTier?.id ?? tiers[0]?.id ?? "",
  );
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [relatedSessionResultId, setRelatedSessionResultId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-sync the default when the covered tier resolves after first render
  // (the subscription endpoint can land slightly after the tiers endpoint).
  useEffect(() => {
    if (coveredTier && !tierId) {
      setTierId(coveredTier.id);
    }
  }, [coveredTier, tierId]);

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === tierId) ?? null,
    [tiers, tierId],
  );

  const priceDisplay = selectedTier
    ? convertFromUsd(selectedTier.priceUsd, displayCurrency, usdToNgn) ?? 0
    : null;

  // Selected tier is "free under subscription" when it's the covered tier AND
  // there's at least one slot left this period. Used to swap the price label,
  // submit-button copy, and footer messaging.
  const selectedCoveredFree =
    selectedTier !== null &&
    coveredTier !== null &&
    selectedTier.id === coveredTier.id &&
    consultationsRemaining > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tierId) {
      setError("Pick a consultation tier first.");
      return;
    }
    if (topic.trim().length < 3) {
      setError("Tell us what you want to talk about (at least 3 characters).");
      return;
    }

    setBusy(true);
    const res = await bookConsultation({
      tierId,
      topic: topic.trim(),
      notes: notes.trim() || undefined,
      preferredTimes: preferredTimes.trim() || undefined,
      relatedSessionResultId: relatedSessionResultId || undefined,
    });
    setBusy(false);

    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not submit your booking.");
      return;
    }

    if (res.data.coveredBySubscription) {
      onBooked(
        "Booking submitted from your subscription credits — we'll confirm by email.",
      );
      // Reset so the form is ready for the next request.
      setTopic("");
      setNotes("");
      setPreferredTimes("");
      setRelatedSessionResultId("");
      return;
    }

    const auth = res.data.booking.payment?.authorizationUrl;
    if (auth) {
      window.location.href = auth;
      return;
    }

    onBooked(
      "Booking saved — finish payment from the card above to complete your request.",
    );
  };

  if (tiers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#111827] p-10 text-center">
        <p className="text-sm text-gray-400">
          Consultations aren&apos;t available right now. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#111827]">
      <div className="border-b border-white/5 px-6 py-5">
        <h2 className="text-lg font-bold text-white">New request</h2>
        <p className="mt-1 text-sm text-gray-400">
          Pick the tier that fits, then tell us about the call.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-5">
        {/* ── Tier selector (right column on desktop, top on mobile) ── */}
        <div className="space-y-3 lg:order-2 lg:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Choose a tier
          </p>
          <div className="space-y-3">
            {tiers.map((t) => {
              const tPriceDisplay =
                convertFromUsd(t.priceUsd, displayCurrency, usdToNgn) ?? 0;
              const selected = t.id === tierId;
              // This tier is the one the user's subscription plan covers
              // (matched by integer tier number). When there's still quota,
              // show the green "Included" treatment; when quota is spent,
              // show a muted "Quota exhausted" line and revert to price.
              const isCovered = coveredTier?.id === t.id;
              const hasQuotaLeft = isCovered && consultationsRemaining > 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTierId(t.id)}
                  className={`block w-full rounded-xl border p-4 text-left transition ${
                    selected
                      ? hasQuotaLeft
                        ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                        : "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/30"
                      : isCovered && hasQuotaLeft
                        ? "border-emerald-500/40 bg-[#0d1117] hover:border-emerald-500/70"
                        : "border-white/5 bg-[#0d1117] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-white">{t.name}</p>
                        {hasQuotaLeft && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                            <Crown className="h-3 w-3" />
                            Included
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {t.durationMinutes} min session
                      </p>
                    </div>
                    {hasQuotaLeft ? (
                      <div className="text-right">
                        <p className="text-base font-extrabold text-emerald-300">
                          Free
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-500">
                          {mySub!.usage.consultationsUsed} of{" "}
                          {mySub!.plan.consultationsPerMonth} used
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-extrabold text-white">
                        {formatMoney(tPriceDisplay, displayCurrency)}
                      </p>
                    )}
                  </div>
                  {isCovered && !hasQuotaLeft && (
                    <p className="mt-2 text-[11px] font-semibold text-amber-300">
                      Quota exhausted this period — pay to book this tier.
                    </p>
                  )}
                  {t.freeP2ARuns > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-300">
                      + {t.freeP2ARuns} free Strategic Scan
                      {t.freeP2ARuns > 1 ? "s" : ""} ({t.freeP2ACreditWindowDays}
                      d)
                    </p>
                  )}
                  {t.description && (
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      {t.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Form fields (left column on desktop) ── */}
        <div className="space-y-4 lg:order-1 lg:col-span-3">
          <Field label="What do you want to talk about?" required>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={200}
              placeholder="e.g. go-to-market plan for Q3"
              className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-orange-500/50"
            />
          </Field>

          {results.length > 0 && (
            <Field
              label="Consult on a previous scan (optional)"
              hint="The consultant will read the result before the call."
            >
              <select
                value={relatedSessionResultId}
                onChange={(e) => setRelatedSessionResultId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-orange-500/50"
              >
                <option value="">— No related scan —</option>
                {results.map((r) => (
                  <option key={r.sessionResultId} value={r.sessionResultId}>
                    {labelForResult(r)}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Notes / context (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Anything the consultant should know going in"
              className="w-full resize-none rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-orange-500/50"
            />
          </Field>

          <Field
            label="Preferred times (optional)"
            hint="Free-form — we'll match one of these or propose a time near them."
          >
            <input
              value={preferredTimes}
              onChange={(e) => setPreferredTimes(e.target.value)}
              maxLength={500}
              placeholder="e.g. Mon/Wed AM, weekday afternoons"
              className="w-full rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2.5 text-sm text-white outline-none transition focus:border-orange-500/50"
            />
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Footer: explainer + submit ── */}
        <div className="lg:order-3 lg:col-span-5">
          <div className="-mx-6 -mb-6 mt-2 flex flex-col-reverse gap-3 border-t border-white/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              {selectedCoveredFree ? (
                <span className="text-emerald-300">
                  <span className="font-semibold">Included with your subscription</span>{" "}
                  — booking will use 1 of {consultationsRemaining} remaining
                  consultations this period.
                </span>
              ) : selectedTier && priceDisplay !== null ? (
                <>
                  You&apos;ll be charged{" "}
                  <span className="font-semibold text-white">
                    {formatMoney(priceDisplay, displayCurrency)}
                  </span>
                  {subCoversBooking
                    ? " — your subscription covers a different tier."
                    : "."}
                </>
              ) : null}
            </p>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {busy && <Loader className="h-4 w-4 animate-spin" />}
              Book consultation
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
        {label}
        {required && <span className="ml-1 text-orange-400">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-gray-600">{hint}</span>}
    </label>
  );
}
