"use client";

// Recurring subscription tier picker + active-subscription management.
// Distinct from /dashboard/subscription, which is the one-off pay-per-use
// flow (Phase 2A unlock, Phase 2B pillar unlock). This page owns the
// Starter/Growth/Scale tiers and the post-subscribe management surface
// (quota meters, card on file, cancel).
//
// Country-aware display: USD base everywhere, NGN converted via the FX rate
// from /subscription/plans (which mirrors getUsdToNgnRate on the BE) for
// users whose country resolves to Nigeria.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle,
  CreditCard,
  Crown,
  Loader,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  cancelMySubscription,
  getMe,
  getMySubscription,
  getSubscriptionPlans,
  subscribeToPlan,
  type MeUser,
  type MySubscriptionPayload,
  type SubscriptionPlanPublic,
} from "@/lib/authClient";
import {
  convertFromUsd,
  formatMoney,
  resolveDisplayCurrency,
  type Currency,
} from "@/lib/utils";

type ViewState = "picker" | "manage";

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
  ACTIVE: { label: "Active", tone: "bg-emerald-500/15 text-emerald-300" },
  PAST_DUE: { label: "Past due", tone: "bg-amber-500/15 text-amber-300" },
  CANCELLED: { label: "Cancelled", tone: "bg-rose-500/15 text-rose-300" },
  EXPIRED: { label: "Expired", tone: "bg-gray-500/15 text-gray-300" },
};

export default function PlansPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanPublic[]>([]);
  const [usdToNgn, setUsdToNgn] = useState(1);
  const [mySub, setMySub] = useState<MySubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  // NG users see NGN, everyone else USD. Same resolver the existing
  // /dashboard/subscription page uses.
  const displayCurrency: Currency = useMemo(
    () => resolveDisplayCurrency(me?.country ?? null),
    [me?.country],
  );

  const view: ViewState = mySub ? "manage" : "picker";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Three calls run in parallel — me to know the user's country, plans
      // for the picker, and the active subscription (if any) for the manage
      // surface. The /me endpoint is the only one that can fail-on-auth.
      const [meRes, plansRes, subRes] = await Promise.all([
        getMe(),
        getSubscriptionPlans(),
        getMySubscription(),
      ]);
      if (cancelled) return;

      if (meRes.error || !meRes.data) {
        setMeError(meRes.error?.message ?? "Could not load your account.");
      } else {
        setMe(meRes.data.user);
      }

      if (plansRes.data) {
        setPlans(plansRes.data.plans);
        setUsdToNgn(plansRes.data.usdToNgn);
      }

      if (subRes.data) {
        setMySub(subRes.data.subscription);
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubscribe = async (planId: string) => {
    setActionBusy(planId);
    setActionError(null);
    const res = await subscribeToPlan(planId);
    setActionBusy(null);
    if (res.error || !res.data) {
      setActionError(res.error?.message ?? "Could not start subscription.");
      return;
    }
    // Paystack hands us a hosted checkout URL — full redirect rather than
    // popup. Cleaner for recurring because the user lands back on this page
    // and the webhook has already activated their subscription by then.
    window.location.href = res.data.authorizationUrl;
  };

  const handleCancel = async () => {
    setActionBusy("cancel");
    setActionError(null);
    const res = await cancelMySubscription();
    setActionBusy(null);
    setCancelOpen(false);
    if (res.error || !res.data) {
      setActionError(res.error?.message ?? "Could not cancel subscription.");
      return;
    }
    // Refresh — status flips to cancelAtPeriodEnd; full CANCELLED comes
    // later from the subscription.disable webhook.
    const refreshed = await getMySubscription();
    if (refreshed.data) setMySub(refreshed.data.subscription);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <Loader className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (meError || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-6">
        <div className="max-w-md text-center">
          <p className="text-red-400 mb-4">{meError ?? "Account unavailable"}</p>
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
      {actionError && (
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
            {actionError}
          </div>
        </div>
      )}

      {view === "manage" && mySub ? (
        <ManageView
          me={me}
          sub={mySub}
          displayCurrency={displayCurrency}
          usdToNgn={usdToNgn}
          onOpenCancel={() => setCancelOpen(true)}
        />
      ) : (
        <PickerView
          plans={plans}
          displayCurrency={displayCurrency}
          usdToNgn={usdToNgn}
          actionBusy={actionBusy}
          onSubscribe={handleSubscribe}
        />
      )}

      {cancelOpen && mySub && (
        <CancelConfirmModal
          periodEnd={mySub.currentPeriodEnd}
          busy={actionBusy === "cancel"}
          onConfirm={handleCancel}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PICKER VIEW — Starter / Growth / Scale
// ─────────────────────────────────────────────────────────────────────────

function PickerView({
  plans,
  displayCurrency,
  usdToNgn,
  actionBusy,
  onSubscribe,
}: {
  plans: SubscriptionPlanPublic[];
  displayCurrency: Currency;
  usdToNgn: number;
  actionBusy: string | null;
  onSubscribe: (planId: string) => void;
}) {
  if (plans.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-20 text-center">
        <p className="text-gray-400 text-sm">
          No subscription plans are configured yet. Please check back later or
          contact support.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="text-center px-4 pt-16 pb-12 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 mb-4">
          <Crown className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
            Monthly Plans
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          Pick a plan that{" "}
          <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
            scales with you.
          </span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Every plan renews monthly. Quotas reset at the start of each billing
          period and don&apos;t roll over — once a period ends, unused tests
          expire. Need more for a one-off scan? Pay-per-use is always available.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, idx) => {
            const priceDisplay =
              convertFromUsd(plan.priceUsd, displayCurrency, usdToNgn) ?? 0;
            const isRecommended = idx === 1;
            return (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                priceDisplay={priceDisplay}
                displayCurrency={displayCurrency}
                recommended={isRecommended}
                busy={actionBusy === plan.id}
                disabled={actionBusy !== null && actionBusy !== plan.id}
                onSubscribe={() => onSubscribe(plan.id)}
              />
            );
          })}
        </div>
      </section>

      <p className="text-center text-xs text-gray-500 mt-10 px-4">
        Already exhausted your quota? You can still{" "}
        <Link
          href="/dashboard/subscription"
          className="underline text-orange-400 hover:text-orange-300"
        >
          pay per use
        </Link>
        .
      </p>
    </>
  );
}

function SubscriptionCard({
  plan,
  priceDisplay,
  displayCurrency,
  recommended,
  busy,
  disabled,
  onSubscribe,
}: {
  plan: SubscriptionPlanPublic;
  priceDisplay: number;
  displayCurrency: Currency;
  recommended: boolean;
  busy: boolean;
  disabled: boolean;
  onSubscribe: () => void;
}) {
  return (
    <div
      className={`relative bg-[#111827] border rounded-2xl p-6 flex flex-col justify-between ${
        recommended
          ? "border-orange-500/40 shadow-lg shadow-orange-500/10"
          : "border-white/5"
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">
          Most Popular
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
          Tier {plan.tier}
        </p>
        <h3 className="text-3xl font-extrabold text-white mb-1">{plan.name}</h3>
        <p className="text-gray-400 text-sm mb-4">
          <span className="text-3xl font-bold text-white">
            {formatMoney(priceDisplay, displayCurrency)}
          </span>{" "}
          <span className="text-gray-500">/ month</span>
        </p>

        {plan.description && (
          // Description renders inline above the feature bullets — matches
          // the spec from the planning conversation.
          <p className="text-sm text-gray-400 mb-5 leading-relaxed">
            {plan.description}
          </p>
        )}

        <ul className="space-y-3 mb-8">
          <QuotaLine label="Phase 2A diagnostics" count={plan.phase2aPerMonth} />
          <QuotaLine label="Phase 2B deep dives" count={plan.phase2bPerMonth} />
          <QuotaLine
            label="Expert consultations"
            count={plan.consultationsPerMonth}
          />
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm text-gray-300"
            >
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onSubscribe}
        disabled={busy || disabled}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
          recommended
            ? "bg-orange-500 hover:bg-orange-600 text-white"
            : "border border-white/20 text-white hover:bg-white/5"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {busy && <Loader className="w-4 h-4 animate-spin" />}
        {busy ? "Redirecting…" : `Subscribe to ${plan.name}`}
      </button>
    </div>
  );
}

function QuotaLine({ label, count }: { label: string; count: number }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-300">
      <Sparkles className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
      <span>
        <span className="font-semibold text-white">{count}</span> {label} per
        month
      </span>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MANAGE VIEW — active subscription
// ─────────────────────────────────────────────────────────────────────────

function ManageView({
  me,
  sub,
  displayCurrency,
  usdToNgn,
  onOpenCancel,
}: {
  me: MeUser;
  sub: MySubscriptionPayload;
  displayCurrency: Currency;
  usdToNgn: number;
  onOpenCancel: () => void;
}) {
  const status = STATUS_COPY[sub.status] ?? {
    label: sub.status,
    tone: "bg-gray-500/15 text-gray-300",
  };
  const priceDisplay =
    convertFromUsd(sub.plan.priceUsd, displayCurrency, usdToNgn) ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-2">
            Your subscription
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            {sub.plan.name}
          </h1>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest ${status.tone}`}
        >
          {status.label}
        </span>
      </div>

      {sub.cancelAtPeriodEnd && (
        <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-300 flex items-start gap-3">
          <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Your subscription is set to end on{" "}
            <span className="font-bold">
              {formatDate(sub.currentPeriodEnd)}
            </span>
            . You&apos;ll keep your remaining quota until then. After that
            you&apos;ll be on pay-per-use unless you resubscribe.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
            Quota usage this period
          </p>
          <div className="space-y-5">
            <QuotaMeter
              label="Phase 2A diagnostics"
              used={sub.usage.phase2aUsed}
              total={sub.plan.phase2aPerMonth}
            />
            <QuotaMeter
              label="Phase 2B deep dives"
              used={sub.usage.phase2bUsed}
              total={sub.plan.phase2bPerMonth}
            />
            <QuotaMeter
              label="Expert consultations"
              used={sub.usage.consultationsUsed}
              total={sub.plan.consultationsPerMonth}
            />
          </div>
          <p className="text-xs text-gray-500 mt-6 leading-relaxed">
            Quotas reset at the start of every billing period. Unused tests
            don&apos;t roll over. When a quota is exhausted, the matching test
            falls back to pay-per-use automatically.
          </p>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
            Billing
          </p>
          <p className="text-2xl font-extrabold text-white mb-1">
            {formatMoney(priceDisplay, displayCurrency)}
          </p>
          <p className="text-xs text-gray-500 mb-5">billed monthly</p>

          <div className="border-t border-white/5 pt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Period started</span>
              <span className="text-white font-medium">
                {formatDate(sub.currentPeriodStart)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Next renewal</span>
              <span className="text-white font-medium">
                {sub.cancelAtPeriodEnd ? "—" : formatDate(sub.currentPeriodEnd)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 mb-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
          Card on file
        </p>
        {sub.card ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                {sub.card.brand ? `${sub.card.brand} ` : ""}
                <span className="font-mono tracking-wider">
                  •••• {sub.card.last4}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {sub.card.bank ? `${sub.card.bank} · ` : ""}
                {sub.card.expMonth && sub.card.expYear
                  ? `Expires ${sub.card.expMonth}/${sub.card.expYear.slice(-2)}`
                  : "Expiry unknown"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Card details will appear here after your first successful payment.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="flex-1 py-3 rounded-xl text-sm font-semibold border border-white/10 text-white hover:bg-white/5 transition flex items-center justify-center gap-2"
        >
          Back to dashboard <ArrowRight className="w-4 h-4" />
        </Link>
        {!sub.cancelAtPeriodEnd && sub.status === "ACTIVE" && (
          <button
            onClick={onOpenCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Cancel subscription
          </button>
        )}
      </div>

      {/* Tiny note acknowledging the email — same kindness the one-off
          success page extends. */}
      <p className="mt-6 text-xs text-gray-600 text-center">
        Billing receipts go to {me.email}.
      </p>
    </div>
  );
}

function QuotaMeter({
  label,
  used,
  total,
}: {
  label: string;
  used: number;
  total: number;
}) {
  // Defensive when total is 0 (a tier with 0 of something is a valid
  // configuration — show the meter empty rather than dividing by zero).
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;
  const remaining = Math.max(total - used, 0);
  const exhausted = remaining === 0 && total > 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-3">
        <span className="text-sm font-medium text-white">{label}</span>
        <span
          className={`text-xs font-mono ${
            exhausted ? "text-rose-300" : "text-gray-400"
          }`}
        >
          {used} / {total}
          {exhausted && " · falls back to pay-per-use"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            exhausted
              ? "bg-rose-500"
              : ratio > 0.75
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

function CancelConfirmModal({
  periodEnd,
  busy,
  onConfirm,
  onClose,
}: {
  periodEnd: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#111827] border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
          <XCircle className="w-5 h-5 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Cancel subscription?
        </h2>
        <p className="text-sm text-gray-400 mb-5">
          You&apos;ll keep your remaining quota and continue with full access
          until{" "}
          <span className="text-white font-semibold">
            {formatDate(periodEnd)}
          </span>
          . After that, you&apos;ll be on pay-per-use. You can resubscribe any
          time.
        </p>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300 flex items-start gap-2 mb-5">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Unused tests do not roll over — they expire when the period ends.
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-white/10 text-white hover:bg-white/5 transition disabled:opacity-60"
          >
            Keep subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && <Loader className="w-4 h-4 animate-spin" />}
            Confirm cancel
          </button>
        </div>
      </div>
    </div>
  );
}
