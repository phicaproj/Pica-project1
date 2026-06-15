"use client";

// Real consultation booking surface — replaces the prior mock-consultant
// landing page. Two layers in one route:
//   - Bookings list (top): the user's existing requests with status badges
//   - Request form (bottom, expanding): tier select + topic + notes +
//     preferred times + an optional "consult on a previous scan" dropdown
//     populated from /consultation/me/results.
//
// The backend decides quota vs paywall — single Book button. When the
// response says coveredBySubscription=true, we show a success toast and
// re-fetch. When the response carries a paystackAuthorizationUrl, we
// redirect to Paystack hosted checkout (same UX as /dashboard/plans).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Loader,
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
  type CompletedResultOption,
  type ConsultationBookingPayload,
  type ConsultationTierPublic,
  type MeUser,
} from "@/lib/authClient";
import {
  convertFromUsd,
  formatMoney,
  resolveDisplayCurrency,
  type Currency,
} from "@/lib/utils";

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

const STATUS_COPY: Record<
  string,
  { label: string; tone: string }
> = {
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
  const pillar = r.pillarName ?? (r.phase === "PHASE2B" ? r.pillarCode ?? "Pillar" : "All pillars");
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const displayCurrency: Currency = useMemo(
    () => resolveDisplayCurrency(me?.country ?? null),
    [me?.country],
  );

  const refresh = async () => {
    const [meRes, tiersRes, bookingsRes, resultsRes] = await Promise.all([
      getMe(),
      getConsultationTiers(),
      getMyConsultations(),
      getMyConsultationResults(),
    ]);
    if (meRes.data) setMe(meRes.data.user);
    if (tiersRes.data) {
      setTiers(tiersRes.data.tiers);
      setUsdToNgn(tiersRes.data.usdToNgn);
    }
    if (bookingsRes.data) setBookings(bookingsRes.data.bookings);
    if (resultsRes.data) setResults(resultsRes.data.results);
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

  // No active bookings → form expanded by default so the page isn't empty.
  useEffect(() => {
    if (!loading && bookings.length === 0) setShowForm(true);
  }, [loading, bookings.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <Loader className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-6">
        <div className="max-w-md text-center">
          <p className="text-red-400 mb-4">{error ?? "Account unavailable"}</p>
          <Link
            href="/Auth/login"
            className="inline-block px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-20">
      <section className="max-w-5xl mx-auto px-4 pt-12 mb-10">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Book a consultation
          </h1>
          {bookings.length > 0 && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Book another
            </button>
          )}
        </div>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl">
          Pick a tier, tell us what you want to talk about, and we&apos;ll
          confirm a time by email. Subscribers use a consultation credit
          automatically — otherwise you&apos;ll be sent to a secure checkout.
        </p>
      </section>

      {toast && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="flex-1">{toast}</span>
            <button
              onClick={() => setToast(null)}
              className="text-emerald-300 hover:text-emerald-100"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {bookings.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 mb-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Your bookings
          </p>
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      {showForm && (
        <section className="max-w-5xl mx-auto px-4">
          <BookingForm
            me={me}
            tiers={tiers}
            usdToNgn={usdToNgn}
            displayCurrency={displayCurrency}
            results={results}
            onBooked={async (msg) => {
              setToast(msg);
              setShowForm(false);
              await refresh();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onCancel={() => bookings.length > 0 && setShowForm(false)}
            canCancel={bookings.length > 0}
          />
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BOOKING CARD
// ─────────────────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: ConsultationBookingPayload }) {
  const status = STATUS_COPY[booking.status] ?? {
    label: booking.status,
    tone: "bg-gray-500/15 text-gray-300",
  };
  const paymentPending =
    booking.payment !== null && booking.payment.status !== "SUCCESS";

  return (
    <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.tone}`}
            >
              {status.label}
            </span>
            {booking.coveredBySubscription && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-500/15 text-orange-300">
                <Crown className="w-3 h-3" />
                Subscription
              </span>
            )}
            {paymentPending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/15 text-amber-300">
                Payment pending
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-white">{booking.topic}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {booking.tier.name} · {booking.tier.durationMinutes} min · Requested{" "}
            {formatDate(booking.requestedAt)}
          </p>
        </div>

        {paymentPending && booking.payment?.authorizationUrl && (
          <a
            href={booking.payment.authorizationUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
          >
            Complete payment
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {booking.relatedResult && (
        <p className="text-xs text-gray-400 mb-2 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 text-orange-400 flex-shrink-0" />
          <span>
            Related to{" "}
            <span className={`font-semibold ${bandColor(booking.relatedResult.colorBand)}`}>
              {labelForResult(booking.relatedResult)}
            </span>
          </span>
        </p>
      )}

      {booking.status === "CONFIRMED" && booking.scheduledAt && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Scheduled
          </p>
          <p className="text-sm text-white font-medium">
            {formatDateTime(booking.scheduledAt)}
          </p>
          {booking.meetingLink && (
            <a
              href={booking.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              Join meeting <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {booking.notes && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          <span className="font-semibold text-gray-400">Notes:</span> {booking.notes}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BOOKING FORM
// ─────────────────────────────────────────────────────────────────────────

function BookingForm({
  me: _me,
  tiers,
  usdToNgn,
  displayCurrency,
  results,
  onBooked,
  onCancel,
  canCancel,
}: {
  me: MeUser;
  tiers: ConsultationTierPublic[];
  usdToNgn: number;
  displayCurrency: Currency;
  results: CompletedResultOption[];
  onBooked: (message: string) => void;
  onCancel: () => void;
  canCancel: boolean;
}) {
  const [tierId, setTierId] = useState<string>(tiers[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [relatedSessionResultId, setRelatedSessionResultId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === tierId) ?? null,
    [tiers, tierId],
  );

  const priceDisplay = selectedTier
    ? (convertFromUsd(selectedTier.priceUsd, displayCurrency, usdToNgn) ?? 0)
    : null;

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

    // Quota path: success toast and refresh.
    if (res.data.coveredBySubscription) {
      onBooked(
        "Booking submitted from your subscription credits — we'll confirm by email.",
      );
      return;
    }

    // Paywall path: backend returned a Paystack auth URL on the booking's
    // payment. Send the user straight to checkout.
    const auth = res.data.booking.payment?.authorizationUrl;
    if (auth) {
      window.location.href = auth;
      return;
    }

    // Edge case — paywall booking with no auth URL yet. Toast and refresh so
    // the user sees the "Complete payment" link on the card.
    onBooked(
      "Booking saved — finish payment from the card above to complete your request.",
    );
  };

  if (tiers.length === 0) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-8 text-center">
        <p className="text-gray-400 text-sm">
          Consultations aren&apos;t available right now. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#111827] border border-white/5 rounded-2xl p-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
        New consultation request
      </p>

      {/* Tier picker as cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {tiers.map((t) => {
          const tPriceDisplay =
            convertFromUsd(t.priceUsd, displayCurrency, usdToNgn) ?? 0;
          const selected = t.id === tierId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTierId(t.id)}
              className={`text-left rounded-xl p-4 border transition ${
                selected
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-white/5 hover:border-white/20 bg-[#0d1117]"
              }`}
            >
              <p className="text-sm font-bold text-white mb-1">{t.name}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-2">
                <Clock className="w-3 h-3" />
                {t.durationMinutes} min
              </p>
              <p className="text-lg font-extrabold text-white">
                {formatMoney(tPriceDisplay, displayCurrency)}
              </p>
              {t.description && (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {t.description}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <Field label="What do you want to talk about?" required>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={200}
          placeholder="e.g. go-to-market plan for Q3"
          className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
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
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
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
          rows={3}
          maxLength={2000}
          placeholder="Anything the consultant should know going in"
          className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white resize-none"
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
          className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
        />
      </Field>

      {error && (
        <div className="mt-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="text-xs text-gray-500">
          {selectedTier && priceDisplay !== null && (
            <span>
              You&apos;ll be charged{" "}
              <span className="text-white font-semibold">
                {formatMoney(priceDisplay, displayCurrency)}
              </span>{" "}
              if you don&apos;t have an active subscription credit.
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition disabled:opacity-60"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {busy && <Loader className="w-4 h-4 animate-spin" />}
            Book consultation
          </button>
        </div>
      </div>
    </form>
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
    <label className="block mb-4">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
        {label}
        {required && <span className="text-orange-400 ml-1">*</span>}
      </span>
      {children}
      {hint && (
        <span className="block text-[10px] text-gray-600 mt-1">{hint}</span>
      )}
    </label>
  );
}
