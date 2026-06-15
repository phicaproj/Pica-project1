"use client";

// Admin booking inbox. Status-filter tabs at the top; each row is a request
// with the user, tier, topic, related-result context (if any), and action
// buttons that depend on the row's current status.
//
// Confirm modal collects scheduledAt + meetingLink, BE flips status to
// CONFIRMED and fires the confirmation email. Post-confirm rows expose
// "Mark attended" / "No show" / "Cancel". Pre-confirm rows expose "Cancel".

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Inbox,
  Loader,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  adminConfirmConsultationBooking,
  adminListConsultationBookings,
  adminUpdateConsultationBookingStatus,
  type AdminBookingRow,
  type CompletedResultOption,
  type ConsultationBookingStatus,
} from "@/lib/authClient";
import { formatMoney } from "@/lib/utils";

const STATUS_TABS: { key: ConsultationBookingStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "REQUESTED", label: "Requested" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "ATTENDED", label: "Attended" },
  { key: "NO_SHOW", label: "No show" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_TONE: Record<string, string> = {
  REQUESTED: "bg-amber-500/15 text-amber-300",
  CONFIRMED: "bg-emerald-500/15 text-emerald-300",
  ATTENDED: "bg-blue-500/15 text-blue-300",
  NO_SHOW: "bg-rose-500/15 text-rose-300",
  CANCELLED: "bg-gray-500/15 text-gray-300",
};

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
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const labelForResult = (r: CompletedResultOption) => {
  const phase = r.phase === "PHASE2B" ? "Phase 2B" : "Phase 2A";
  const pillar = r.pillarName ?? (r.phase === "PHASE2B" ? r.pillarCode ?? "Pillar" : "All pillars");
  return `${pillar} · ${phase} · ${formatDate(r.generatedAt)} · ${Math.round(r.totalScore)} ${r.colorBand}`;
};

export default function ConsultationsAdminPage() {
  const [filter, setFilter] = useState<ConsultationBookingStatus | "ALL">("ALL");
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<AdminBookingRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const res = await adminListConsultationBookings(
      filter === "ALL" ? undefined : { status: filter, pageSize: 50 },
    );
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not load bookings.");
      return;
    }
    setBookings(res.data.bookings);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Quick counts for the tab labels so the admin sees at a glance where the
  // backlog is. Derived from the most recent fetch under the current filter
  // — when the filter is ALL this is accurate; otherwise only the current
  // bucket is non-zero. Good enough for a small inbox.
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of bookings) map[b.status] = (map[b.status] ?? 0) + 1;
    return map;
  }, [bookings]);

  const handleConfirm = async (
    booking: AdminBookingRow,
    scheduledAt: string,
    meetingLink: string,
  ) => {
    setBusyId(booking.id);
    setError(null);
    const res = await adminConfirmConsultationBooking(booking.id, {
      scheduledAt,
      meetingLink,
    });
    setBusyId(null);
    setConfirming(null);
    if (res.error) {
      setError(res.error.message ?? "Could not confirm booking.");
      return;
    }
    setSuccess(`Confirmed booking for ${booking.user.email}.`);
    await refresh();
  };

  const handleStatus = async (
    booking: AdminBookingRow,
    status: "ATTENDED" | "NO_SHOW" | "CANCELLED",
  ) => {
    const ok =
      status === "CANCELLED"
        ? window.confirm(`Cancel this booking for ${booking.user.email}?`)
        : true;
    if (!ok) return;

    setBusyId(booking.id);
    setError(null);
    const res = await adminUpdateConsultationBookingStatus(booking.id, status);
    setBusyId(null);
    if (res.error) {
      setError(res.error.message ?? "Could not update booking.");
      return;
    }
    setSuccess(`Booking marked ${status.toLowerCase().replace("_", " ")}.`);
    await refresh();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Inbox className="w-5 h-5 text-orange-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold">Consultations</h1>
          </div>
          <p className="text-sm text-gray-400 max-w-2xl">
            Booking inbox. Confirm requested calls with a time and a meeting
            link; the user is emailed automatically.
          </p>
        </header>

        <div className="flex flex-wrap gap-1 mb-6 border-b border-white/5">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === "ALL" ? bookings.length : counts[tab.key];
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2.5 text-sm font-semibold transition relative ${
                  active ? "text-orange-400" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.label}
                {count ? (
                  <span className="ml-2 text-[10px] font-mono text-gray-500">
                    {count}
                  </span>
                ) : null}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400" />
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl bg-[#111827] border border-white/5 p-10 text-center">
            <Inbox className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {filter === "ALL" ? "No bookings yet." : `No bookings in ${filter.toLowerCase().replace("_", " ")}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                busy={busyId === b.id}
                onConfirm={() => setConfirming(b)}
                onMarkAttended={() => handleStatus(b, "ATTENDED")}
                onMarkNoShow={() => handleStatus(b, "NO_SHOW")}
                onCancel={() => handleStatus(b, "CANCELLED")}
              />
            ))}
          </div>
        )}

        {confirming && (
          <ConfirmModal
            booking={confirming}
            busy={busyId === confirming.id}
            onConfirm={(scheduledAt, meetingLink) =>
              handleConfirm(confirming, scheduledAt, meetingLink)
            }
            onClose={() => setConfirming(null)}
          />
        )}
      </div>
    </div>
  );
}

function BookingRow({
  booking,
  busy,
  onConfirm,
  onMarkAttended,
  onMarkNoShow,
  onCancel,
}: {
  booking: AdminBookingRow;
  busy: boolean;
  onConfirm: () => void;
  onMarkAttended: () => void;
  onMarkNoShow: () => void;
  onCancel: () => void;
}) {
  const paymentPending =
    booking.payment !== null && booking.payment.status !== "SUCCESS";
  const userName = [booking.user.firstName, booking.user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUS_TONE[booking.status] ?? ""}`}
            >
              {booking.status.replace("_", " ")}
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
            {booking.payment?.status === "SUCCESS" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300">
                Paid {formatMoney(booking.payment.amount, booking.payment.currency === "NGN" ? "NGN" : "USD")}
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-white">{booking.topic}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-400">
              {userName || booking.user.businessName || booking.user.email}
            </span>{" "}
            · {booking.user.email}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{booking.tier.name}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {booking.tier.durationMinutes} min
            </span>
            <span>· Requested {formatDate(booking.requestedAt)}</span>
          </p>
        </div>
      </div>

      {booking.relatedResult && (
        <p className="text-xs text-gray-400 mb-2 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 text-orange-400 flex-shrink-0" />
          <span>Related to {labelForResult(booking.relatedResult)}</span>
        </p>
      )}

      {booking.notes && (
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          <span className="font-semibold text-gray-500">Notes:</span> {booking.notes}
        </p>
      )}

      {booking.preferredTimes && (
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          <span className="font-semibold text-gray-500">Preferred:</span>{" "}
          {booking.preferredTimes}
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
              {booking.meetingLink} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2 flex-wrap">
        {booking.status === "REQUESTED" && !paymentPending && (
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-60"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirm
          </button>
        )}
        {booking.status === "CONFIRMED" && (
          <>
            <button
              onClick={onMarkAttended}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 transition disabled:opacity-60"
            >
              Mark attended
            </button>
            <button
              onClick={onMarkNoShow}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition disabled:opacity-60"
            >
              Mark no-show
            </button>
          </>
        )}
        {(booking.status === "REQUESTED" || booking.status === "CONFIRMED") && (
          <button
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-gray-300 hover:bg-white/5 transition disabled:opacity-60"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({
  booking,
  busy,
  onConfirm,
  onClose,
}: {
  booking: AdminBookingRow;
  busy: boolean;
  onConfirm: (scheduledAt: string, meetingLink: string) => void;
  onClose: () => void;
}) {
  // Default to "+1 hour from now" so the picker isn't a blank field; the
  // admin almost always edits it before submitting anyway.
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    // datetime-local needs YYYY-MM-DDTHH:mm in the user's locale; ISO works
    // close enough for the input default and round-trips to ISO on submit.
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [meetingLink, setMeetingLink] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    setLocalError(null);
    if (!scheduledAt) {
      setLocalError("Pick a date and time.");
      return;
    }
    if (!/^https?:\/\//i.test(meetingLink.trim())) {
      setLocalError("Meeting link must be a full URL (https://…).");
      return;
    }
    const iso = new Date(scheduledAt).toISOString();
    onConfirm(iso, meetingLink.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#111827] border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-1">Confirm booking</h2>
        <p className="text-sm text-gray-400 mb-5">
          {booking.user.email} · {booking.tier.name} ·{" "}
          {booking.tier.durationMinutes} min
        </p>

        <label className="block mb-4">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            Scheduled at
          </span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </label>

        <label className="block mb-5">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            Meeting link
          </span>
          <input
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        </label>

        {localError && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && <Loader className="w-4 h-4 animate-spin" />}
            Confirm & send email
          </button>
        </div>
      </div>
    </div>
  );
}
