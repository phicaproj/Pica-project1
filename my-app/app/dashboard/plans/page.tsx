"use client";

// Subscription tier picker. The active-subscription management surface
// (quota meters, card on file, cancel button) lives in Settings → Billing
// now — this page only sells the tiers and decorates whichever one the user
// is currently on. The previous in-page ManageView was confusing because the
// picker disappeared the moment a user subscribed, leaving no way to compare
// tiers from a logged-in state.
//
// Checkout is fully inline: clicking a card opens SubscriptionCheckoutModal,
// which optionally applies a coupon and either short-circuits to the success
// state (100%-off coupon) or opens the Paystack popup over the modal. No
// full-page redirects.

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPhaseLabel } from "@/lib/phaseLabels";
import Script from "next/script";
import { useTheme } from "@/components/ThemeContext";
import {
  ArrowRight,
  Check,
  CheckCircle,
  Crown,
  Loader,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import {
  getMe,
  getMySubscription,
  getSubscriptionPlans,
  subscribeToPlan,
  type BillingInterval,
  type MeUser,
  type MySubscriptionPayload,
  type SubscriptionPlanPublic,
} from "@/lib/authClient";
import {
  validateCoupon,
  verifyPayment,
  type CouponPricing,
} from "@/lib/api/payment";
import {
  convertFromUsd,
  formatMoney,
  resolveDisplayCurrency,
  type Currency,
} from "@/lib/utils";
import { PlansSkeleton } from "@/components/ui/skeleton";

// Paystack inline-widget shape — kept in this file so plans/page is
// self-contained (the pay-per-use checkout has its own copy).
type PaystackHandler = { openIframe: () => void };
type PaystackSetupOptions = {
  key: string;
  email: string;
  amount: number;
  ref: string;
  currency?: string;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
};
declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => PaystackHandler;
    };
  }
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

export default function PlansPage() {
  const { dark } = useTheme();
  const d = dark;
  const [me, setMe] = useState<MeUser | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanPublic[]>([]);
  const [usdToNgn, setUsdToNgn] = useState(1);
  const [sectionsLive, setSectionsLive] = useState({
    payPerUse: true,
    subscription: true,
  });
  const [mySub, setMySub] = useState<MySubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlanPublic | null>(
    null,
  );
  // Monthly/Annual pill — local state, defaults to MONTHLY. The toggle is
  // only shown when at least one tier has annualDiscountPct > 0.
  const [interval, setIntervalState] = useState<BillingInterval>("MONTHLY");

  const displayCurrency: Currency = useMemo(
    () => resolveDisplayCurrency(me?.country ?? null),
    [me?.country],
  );

  const refreshSubscription = async () => {
    const res = await getMySubscription();
    if (res.data) setMySub(res.data.subscription);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        setSectionsLive({
          payPerUse: plansRes.data.sections?.payPerUse ?? true,
          subscription: plansRes.data.sections?.subscription ?? true,
        });
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

  if (loading) {
    return <PlansSkeleton />;
  }

  if (meError || !me) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${d ? 'bg-[#0d1117]' : 'bg-gray-50'} px-6`}>
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

  const activePlanId =
    mySub && (mySub.status === "ACTIVE" || mySub.status === "PAST_DUE")
      ? mySub.plan.id
      : null;

  return (
    <div className={`min-h-screen ${d ? 'bg-[#0d1117] text-white' : 'bg-gray-50 text-gray-900'} pb-20`}>
      {/* Paystack inline SDK — loaded once, used when a paid plan opens the
          checkout modal. Kept at page scope so the script is ready by the
          time the modal mounts. */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
      />

      {pageError && (
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
            {pageError}
          </div>
        </div>
      )}

      <PickerView
        plans={plans}
        displayCurrency={displayCurrency}
        usdToNgn={usdToNgn}
        activePlanId={activePlanId}
        hasActiveSub={!!activePlanId}
        subscriptionSectionLive={sectionsLive.subscription}
        payPerUseSectionLive={sectionsLive.payPerUse}
        interval={interval}
        onIntervalChange={setIntervalState}
        onSelectPlan={(plan) => {
          setPageError(null);
          setCheckoutPlan(plan);
        }}
      />

      {checkoutPlan && (
        <Suspense fallback={null}>
          <SubscriptionCheckoutModal
            plan={checkoutPlan}
            interval={interval}
            me={me}
            displayCurrency={displayCurrency}
            usdToNgn={usdToNgn}
            onClose={() => setCheckoutPlan(null)}
            onSuccess={async () => {
              setCheckoutPlan(null);
              await refreshSubscription();
            }}
            onError={(msg) => setPageError(msg)}
          />
        </Suspense>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PICKER VIEW — Starter / Growth / Scale (always rendered)
// ─────────────────────────────────────────────────────────────────────────

function PickerView({
  plans,
  displayCurrency,
  usdToNgn,
  activePlanId,
  hasActiveSub,
  subscriptionSectionLive,
  payPerUseSectionLive,
  interval,
  onIntervalChange,
  onSelectPlan,
}: {
  plans: SubscriptionPlanPublic[];
  displayCurrency: Currency;
  usdToNgn: number;
  activePlanId: string | null;
  hasActiveSub: boolean;
  subscriptionSectionLive: boolean;
  payPerUseSectionLive: boolean;
  interval: BillingInterval;
  onIntervalChange: (next: BillingInterval) => void;
  onSelectPlan: (plan: SubscriptionPlanPublic) => void;
}) {
  const { dark } = useTheme();
  const d = dark;
  // Show the toggle only when at least one tier has annual enabled — keeps the
  // UI honest on a fresh DB where no admin has set annualDiscountPct yet.
  const annualAvailable = plans.some((p) => p.annualDiscountPct > 0);
  // Section F — admin paused subscriptions. The BE returns an empty array;
  // we show a friendlier paused-state copy than the generic empty.
  if (!subscriptionSectionLive) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-20 text-center">
        <h2 className={`text-2xl font-bold ${d ? "text-white" : "text-gray-900"} mb-3`}>
          Subscriptions are paused
        </h2>
        <p className={`${d ? "text-gray-400" : "text-gray-600"} text-sm mb-6`}>
          Monthly plans aren&apos;t available right now.
          {payPerUseSectionLive
            ? " You can still pay per use for individual diagnostics."
            : " Please check back later."}
        </p>
        {payPerUseSectionLive && (
          <Link
            href="/dashboard/subscription"
            className="inline-block py-3 px-6 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white transition"
          >
            Go to pay-per-use
          </Link>
        )}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-20 text-center">
        <p className={`${d ? "text-gray-400" : "text-gray-600"} text-sm`}>
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
            Subscription Plans
          </span>
        </div>
        <h1 className={`text-4xl md:text-5xl font-extrabold leading-tight mb-4 ${d ? "text-white" : "text-gray-900"}`}>
          Pick a plan that{" "}
          <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
            scales with you.
          </span>
        </h1>
        <p className={`${d ? "text-gray-400" : "text-gray-600"} text-sm md:text-base max-w-2xl mx-auto`}>
          Pick monthly or annual billing. Quotas reset at the start of each
          billing period and don&apos;t roll over — once a period ends, unused
          tests expire. Need more for a one-off scan? Pay-per-use is always
          available.
        </p>
        {hasActiveSub && (
          // Anchor to /dashboard/settings with the deep-link param the
          // billing tab will read to land on the Subscription sub-tab.
          <div className="mt-6">
            <Link
              href="/dashboard/settings?tab=Billing&billingTab=Subscription"
              className="inline-flex items-center gap-2 text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
            >
              Manage subscription <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4">
        {/* Billing cadence toggle. Bold, centred, always rendered so the
            choice is discoverable even before an admin configures any
            annual discount — `annualAvailable === false` just disables the
            Annual side rather than hiding the whole control. The per-card
            cadence pill (rendered inside SubscriptionCard) drives the same
            global state, so clicking Annual on any tier swaps every tier. */}
        <div className="mb-10 flex flex-col items-center gap-2">
          <div className={`inline-flex items-center gap-2 rounded-2xl ${d ? "bg-white/5 border-white/10 shadow-black/20" : "bg-white border-gray-200 shadow-gray-200/60"} border p-1.5 shadow-lg`}>
            <button
              type="button"
              onClick={() => onIntervalChange("MONTHLY")}
              className={`px-6 py-2.5 text-sm font-extrabold uppercase tracking-wider rounded-xl transition ${
                interval === "MONTHLY"
                  ? "bg-orange-500 text-white shadow"
                  : d
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => annualAvailable && onIntervalChange("ANNUAL")}
              disabled={!annualAvailable}
              className={`px-6 py-2.5 text-sm font-extrabold uppercase tracking-wider rounded-xl transition flex items-center gap-2 ${
                interval === "ANNUAL"
                  ? "bg-orange-500 text-white shadow"
                  : annualAvailable
                    ? d
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-600 hover:text-gray-900"
                    : d
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
              }`}
            >
              Annual
              {annualAvailable && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                  Save
                </span>
              )}
            </button>
          </div>
          {!annualAvailable && (
            <p className={`text-[11px] ${d ? "text-gray-500" : "text-gray-400"}`}>
              Annual billing not yet enabled — contact support if you&apos;d like to commit yearly.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {plans.map((plan, idx) => {
            // Annual price falls back to monthly when the tier has no annual
            // option — the toggle is hidden in that case so users never see
            // a misleading "save 0%" badge.
            const effectiveInterval: BillingInterval =
              interval === "ANNUAL" && plan.annualDiscountPct > 0
                ? "ANNUAL"
                : "MONTHLY";
            const priceUsd =
              effectiveInterval === "ANNUAL"
                ? plan.priceUsdAnnual
                : plan.priceUsd;
            const priceDisplay =
              convertFromUsd(priceUsd, displayCurrency, usdToNgn) ?? 0;
            const isRecommended = idx === 1;
            const isCurrent = activePlanId === plan.id;
            return (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                priceDisplay={priceDisplay}
                displayCurrency={displayCurrency}
                interval={effectiveInterval}
                recommended={isRecommended}
                current={isCurrent}
                hasActiveSub={hasActiveSub}
                onSubscribe={() => onSelectPlan(plan)}
              />
            );
          })}
        </div>
      </section>

      <p className={`text-center text-xs ${d ? "text-gray-500" : "text-gray-500"} mt-10 px-4`}>
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
  interval,
  recommended,
  current,
  hasActiveSub,
  onSubscribe,
}: {
  plan: SubscriptionPlanPublic;
  priceDisplay: number;
  displayCurrency: Currency;
  interval: BillingInterval;
  recommended: boolean;
  current: boolean;
  hasActiveSub: boolean;
  onSubscribe: () => void;
}) {
  const { dark } = useTheme();
  const d = dark;
  // CTA logic:
  //   - current plan → disabled "Current plan" pill
  //   - other plan while subscribed → "Switch to this plan" (upgrade/downgrade)
  //   - no active sub → normal subscribe button
  const buttonDisabled = current;
  const buttonLabel = current
    ? "Current plan"
    : hasActiveSub
      ? "Switch to this plan"
      : `Subscribe to ${plan.name}`;

  return (
    <div
      className={`relative ${d ? "bg-[#111827]" : "bg-white"} border rounded-2xl p-6 flex flex-col justify-between transition ${
        current
          ? d
            ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10"
            : "border-emerald-500 shadow-lg shadow-emerald-500/10"
          : recommended
            ? d
              ? "border-orange-500/40 shadow-lg shadow-orange-500/10"
              : "border-orange-500/60 shadow-lg shadow-orange-500/10"
            : d
              ? "border-white/5"
              : "border-gray-200 shadow-sm"
      }`}
    >
      {current ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3" />
          Your plan
        </div>
      ) : (
        recommended && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">
            Most Popular
          </div>
        )
      )}

      <div>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${d ? "text-gray-500" : "text-gray-400"} mb-3`}>
          Tier {plan.tier}
        </p>
        <h3 className={`text-3xl font-extrabold ${d ? "text-white" : "text-gray-900"} mb-1`}>{plan.name}</h3>
        <p className={`${d ? "text-gray-400" : "text-gray-600"} text-sm mb-2`}>
          <span className={`text-3xl font-bold ${d ? "text-white" : "text-gray-900"}`}>
            {formatMoney(priceDisplay, displayCurrency)}
          </span>{" "}
          <span className={d ? "text-gray-500" : "text-gray-400"}>
            / {interval === "ANNUAL" ? "year" : "month"}
          </span>
        </p>
        {interval === "ANNUAL" && plan.annualDiscountPct > 0 && (
          <p className="mb-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Save {plan.annualDiscountPct}% vs monthly
          </p>
        )}
        {interval !== "ANNUAL" && <div className="mb-4" />}

        {plan.description && (
          <p className={`text-sm ${d ? "text-gray-400" : "text-gray-600"} mb-5 leading-relaxed`}>
            {plan.description}
          </p>
        )}

        <ul className="space-y-3 mb-8">
          <QuotaLine label={`${getPhaseLabel("PHASE2A")}s`} count={plan.phase2aPerMonth} />
          <QuotaLine label={`${getPhaseLabel("PHASE2B")}s`} count={plan.phase2bPerMonth} />
          <QuotaLine
            label="Expert consultations"
            count={plan.consultationsPerMonth}
          />
          {plan.features.map((feature) => {
            const formatted = feature
              .replace(/Phase 2A diagnostics?/gi, "Strategic Scans")
              .replace(/Phase 2B deep dives?/gi, "Deep Dive Modules")
              .replace(/Phase 2A/gi, "Strategic Scan")
              .replace(/Phase 2B/gi, "Deep Dive Module");
            return (
              <li
                key={feature}
                className={`flex items-start gap-2 text-sm ${d ? "text-gray-300" : "text-gray-700"}`}
              >
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {formatted}
              </li>
            );
          })}
        </ul>
      </div>

      <button
        onClick={onSubscribe}
        disabled={buttonDisabled}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
          current
            ? d
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 cursor-default"
              : "bg-emerald-50 border border-emerald-300 text-emerald-700 cursor-default"
            : plan.tier === 1
              ? "bg-[#f97316] hover:bg-[#ea6c0a] text-white shadow-lg shadow-orange-500/20"
              : plan.tier === 2
                ? d
                  ? "bg-[#00ffaa] hover:bg-[#00dd99] text-gray-950 shadow-lg"
                  : "bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20"
                : d
                  ? "bg-[#1f2937] hover:bg-gray-800 text-white shadow-md border border-white/10"
                  : "bg-gray-900 hover:bg-gray-800 text-white shadow-md"
        } disabled:opacity-60 ${buttonDisabled && !current ? "cursor-not-allowed" : ""}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function QuotaLine({ label, count }: { label: string; count: number }) {
  const { dark } = useTheme();
  const d = dark;
  return (
    <li className={`flex items-start gap-2 text-sm ${d ? "text-gray-300" : "text-gray-700"}`}>
      <Sparkles className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
      <span>
        <span className={`font-semibold ${d ? "text-white" : "text-gray-900"}`}>{count}</span> {label} per
        month
      </span>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CHECKOUT MODAL — inline coupon + Paystack popup, no redirects
// ─────────────────────────────────────────────────────────────────────────

function SubscriptionCheckoutModal({
  plan,
  interval,
  me,
  displayCurrency,
  usdToNgn,
  onClose,
  onSuccess,
  onError,
}: {
  plan: SubscriptionPlanPublic;
  interval: BillingInterval;
  me: MeUser;
  displayCurrency: Currency;
  usdToNgn: number;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const { dark } = useTheme();
  const d = dark;
  // Annual checkout only fires when the tier actually has an annual option —
  // page-level effectiveInterval already collapses to MONTHLY otherwise.
  const effectiveInterval: BillingInterval =
    interval === "ANNUAL" && plan.annualDiscountPct > 0 ? "ANNUAL" : "MONTHLY";
  const [couponCode, setCouponCode] = useState("");
  const [couponPricing, setCouponPricing] = useState<CouponPricing | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Coupon validation runs in USD — same as the BE. The display values below
  // re-convert to whatever the user's wire currency is when rendering. The
  // base price swaps to the discounted annual sticker when the user picked
  // ANNUAL on the toggle.
  const basePriceUsd =
    effectiveInterval === "ANNUAL" ? plan.priceUsdAnnual : plan.priceUsd;
  const finalPriceUsd = couponPricing?.finalAmount ?? basePriceUsd;
  const discountUsd = couponPricing?.discountAmount ?? 0;

  const basePriceDisplay =
    convertFromUsd(basePriceUsd, displayCurrency, usdToNgn) ?? 0;
  const finalPriceDisplay =
    convertFromUsd(finalPriceUsd, displayCurrency, usdToNgn) ?? 0;
  const discountDisplay =
    convertFromUsd(discountUsd, displayCurrency, usdToNgn) ?? 0;

  const verifyWithRetry = async (reference: string) => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const verify = await verifyPayment(reference);
      if (!verify.error && verify.data?.paid) {
        return { ok: true as const };
      }
      const status = verify.data?.status;
      if (verify.error || (status && status !== "PENDING")) {
        return {
          ok: false as const,
          message:
            verify.error?.message ??
            `Payment status: ${status}. If you were charged, please contact support.`,
        };
      }
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1500);
      });
    }
    return {
      ok: false as const,
      message:
        "Payment confirmation is taking longer than expected. Please refresh in a moment.",
    };
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }
    setCouponBusy(true);
    setCouponError(null);
    const response = await validateCoupon({
      code,
      basePrice: basePriceUsd,
      plan: "SUBSCRIPTION",
    });
    setCouponBusy(false);
    if (response.error || !response.data) {
      setCouponPricing(null);
      setCouponError(response.error?.message ?? "Could not apply coupon.");
      return;
    }
    setCouponCode(response.data.pricing.code);
    setCouponPricing(response.data.pricing);
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponPricing(null);
    setCouponError(null);
  };

  const handlePay = async () => {
    setError(null);
    setBusy(true);

    const res = await subscribeToPlan(plan.id, {
      couponCode: couponPricing?.code,
      interval: effectiveInterval,
    });

    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not start subscription.");
      setBusy(false);
      return;
    }

    // 100%-off coupon: BE already activated the subscription. Verify is a
    // formality so the FE shows the same "settled" state the pay-per-use
    // free path does.
    if (res.data.free) {
      setVerifying(true);
      const result = await verifyWithRetry(res.data.reference);
      setVerifying(false);
      setBusy(false);
      if (result.ok) {
        onSuccess();
      } else {
        setError(result.message);
      }
      return;
    }

    // Paid path: open Paystack inline. Falls back to the hosted checkout
    // URL only if the SDK didn't load (offline, ad-block, etc.).
    if (typeof window === "undefined" || !window.PaystackPop) {
      if (res.data.authorizationUrl) {
        window.location.href = res.data.authorizationUrl;
        return;
      }
      setError("Payment SDK is still loading. Please wait a moment and try again.");
      setBusy(false);
      return;
    }
    if (!PAYSTACK_PUBLIC_KEY) {
      setError(
        "Payment is not configured for this environment. Please contact support.",
      );
      setBusy(false);
      return;
    }

    const { reference, amount, currency } = res.data;
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: me.email,
      amount: Math.round(amount * 100),
      ref: reference,
      currency,
      callback: (response) => {
        // Paystack runs this on its own; jump to verify in a microtask so
        // React state updates land cleanly.
        void (async () => {
          setVerifying(true);
          const result = await verifyWithRetry(response.reference);
          setVerifying(false);
          setBusy(false);
          if (result.ok) {
            onSuccess();
          } else {
            setError(result.message);
            onError(result.message);
          }
        })();
      },
      onClose: () => {
        // User closed the popup without paying — clear busy so they can
        // retry without refreshing.
        setBusy(false);
      },
    });
    handler.openIframe();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
      onClick={busy ? undefined : onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl ${d ? "bg-[#111827] border-white/10" : "bg-white border-gray-200"} border p-6 shadow-2xl my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-1">
              Subscribe — Tier {plan.tier}
            </p>
            <h2 className={`text-2xl font-bold ${d ? "text-white" : "text-gray-900"}`}>{plan.name}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className={`w-8 h-8 rounded-lg ${d ? "hover:bg-white/5 text-gray-500 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"} flex items-center justify-center transition disabled:opacity-40`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan summary */}
        <div className={`rounded-xl ${d ? "bg-[#0d1117] border-white/5" : "bg-gray-50 border-gray-200"} border p-4 mb-4`}>
          <div className="flex justify-between items-baseline gap-3 text-sm">
            <span className={d ? "text-gray-400" : "text-gray-600"}>
              {effectiveInterval === "ANNUAL" ? "Annual price" : "Monthly price"}
            </span>
            <span className={`${d ? "text-white" : "text-gray-900"} font-semibold`}>
              {formatMoney(basePriceDisplay, displayCurrency)}
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            <li className={`text-xs ${d ? "text-gray-400" : "text-gray-600"} flex items-center gap-2`}>
              <Sparkles className="w-3 h-3 text-orange-400" />
              {plan.phase2aPerMonth} {getPhaseLabel("PHASE2A")} · {plan.phase2bPerMonth} {getPhaseLabel("PHASE2B")} ·{" "}
              {plan.consultationsPerMonth} consultations / month
            </li>
          </ul>
        </div>

        {/* Coupon row */}
        <div className="mb-4">
          <label className={`block text-[10px] font-bold uppercase tracking-widest ${d ? "text-gray-500" : "text-gray-500"} mb-2`}>
            Have a coupon?
          </label>
          {!couponPricing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponError(null);
                }}
                placeholder="ENTER CODE"
                className={`flex-1 px-3 py-2.5 rounded-lg ${d ? "bg-[#0d1117] border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500/40" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500"} border text-sm font-mono tracking-wider focus:outline-none transition`}
                disabled={couponBusy || busy}
              />
              <button
                onClick={applyCoupon}
                disabled={couponBusy || busy || !couponCode.trim()}
                className={`px-4 py-2.5 rounded-lg ${d ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"} border text-sm font-semibold transition disabled:opacity-60`}
              >
                {couponBusy ? <Loader className="w-4 h-4 animate-spin" /> : "Apply"}
              </button>
            </div>
          ) : (
            <div className={`flex items-center justify-between gap-3 rounded-lg ${d ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"} border p-3 text-sm`}>
              <div className="flex items-center gap-2 min-w-0">
                <Tag className={`w-4 h-4 ${d ? "text-emerald-400" : "text-emerald-600"} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className={`${d ? "text-emerald-300" : "text-emerald-800"} font-semibold truncate`}>
                    {couponPricing.code}
                  </p>
                  <p className={`${d ? "text-emerald-400/80" : "text-emerald-600"} text-xs`}>
                    Saved {formatMoney(discountDisplay, displayCurrency)}
                  </p>
                </div>
              </div>
              <button
                onClick={removeCoupon}
                disabled={busy}
                className={`${d ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"} text-xs font-semibold disabled:opacity-50`}
              >
                Remove
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-rose-400 mt-2">{couponError}</p>
          )}
        </div>

        {/* Total row */}
        <div className={`rounded-xl ${d ? "bg-[#0d1117] border-white/5" : "bg-gray-50 border-gray-200"} border p-4 mb-5`}>
          <div className="flex justify-between items-baseline gap-3 text-sm mb-1.5">
            <span className={d ? "text-gray-400" : "text-gray-600"}>Subtotal</span>
            <span className={d ? "text-gray-300" : "text-gray-700"}>
              {formatMoney(basePriceDisplay, displayCurrency)}
            </span>
          </div>
          {couponPricing && (
            <div className="flex justify-between items-baseline gap-3 text-sm mb-1.5">
              <span className={d ? "text-gray-400" : "text-gray-600"}>Discount</span>
              <span className={d ? "text-emerald-300" : "text-emerald-600"}>
                −{formatMoney(discountDisplay, displayCurrency)}
              </span>
            </div>
          )}
          <div className={`border-t ${d ? "border-white/5" : "border-gray-200"} mt-2 pt-2 flex justify-between items-baseline gap-3`}>
            <span className={`${d ? "text-white" : "text-gray-900"} font-bold`}>Total today</span>
            <span className={`${d ? "text-white" : "text-gray-900"} text-xl font-extrabold`}>
              {formatMoney(finalPriceDisplay, displayCurrency)}
            </span>
          </div>
          <p className={`text-[10px] ${d ? "text-gray-500" : "text-gray-500"} mt-2`}>
            Then {formatMoney(basePriceDisplay, displayCurrency)} every{" "}
            {effectiveInterval === "ANNUAL" ? "year" : "month"}. Cancel anytime.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={busy}
          className="w-full py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {(busy || verifying) && <Loader className="w-4 h-4 animate-spin" />}
          {verifying
            ? "Confirming…"
            : busy
              ? "Starting…"
              : finalPriceUsd <= 0
                ? "Activate (free with coupon)"
                : "Pay & subscribe"}
        </button>

        <p className={`mt-4 text-[10px] ${d ? "text-gray-500" : "text-gray-500"} text-center`}>
          Billing receipts go to {me.email}.
        </p>
      </div>
    </div>
  );
}
