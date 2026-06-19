"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { PillarPickerModal } from "../deep-dive/PillarPickerModal";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Building2,
  Check,
  CheckCircle,
  CircleDot,
  Cpu,
  CreditCard,
  HelpCircle,
  Landmark,
  Loader,
  Lock,
  Rocket,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import {
  getAccessToken,
  getLastSessionId,
  getMe,
  getMySubscription,
  getPublicPricing,
  initPayment,
  quotaCheck,
  validateCoupon,
  verifyPayment,
  getAllPillars,
  getMyPhase2BPillars,
  type BusinessSize,
  type CouponPricing,
  type MeUser,
  type MySubscriptionPayload,
  type PricingRow,
  type PublicPricingResponse,
  type VerifyPaymentResponse,
} from "@/lib/authClient";
import { convertFromUsd, formatMoney, resolveDisplayCurrency, type Currency } from "@/lib/utils";
import { SubscriptionPickerSkeleton } from "@/components/ui/skeleton";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://pica-project1.onrender.com/api";

type LockedScan = {
  sessionId: string;
  phase: string;
  totalScore: number;
  colorBand: string;
  completedAt: string | null;
};

type View = "plans" | "checkout" | "success";

const PENDING_PAYMENT_REFERENCE_KEY = "pica.pendingPaymentReference";

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

type PlanCard = {
  tier: string;
  name: string;
  price: string;
  amount: number | null;
  currency: string;
  features: string[];
  buttonLabel: string;
  buttonVariant: "filled" | "outlined";
  recommended?: boolean;
  backendPlan?: "PHASE2A" | "PHASE2B_PILLAR";
  priceMissing?: boolean;
};

// Renders a USD catalogue value in the user's display currency. Nigerian
// users see ₦ (converted via pricing.usdToNgn); everyone else sees $.
// Kept as a closure inside buildPlans / use-sites so the call signature stays
// (amount, currency) for any existing inline reader.
function formatPrice(amount: number | null | undefined, currency: string = "USD") {
  const c: Currency = currency === "NGN" ? "NGN" : "USD";
  return formatMoney(amount, c);
}

function buildPlans(
  businessSize: BusinessSize | null,
  pricing: PublicPricingResponse | null,
  display: Currency,
): PlanCard[] {
  const usdToNgn = pricing?.usdToNgn ?? 1;
  const phase2APriceUsd = pricing?.phase2A?.price ?? null;
  const phase2BPrices = pricing?.phase2B ?? [];
  const phase2BStartPriceUsd =
    phase2BPrices.length > 0
      ? Math.min(...phase2BPrices.map((price) => price.price))
      : null;

  // Display values: USD catalogue → user currency. `amount` stays in the
  // display currency because the coupon math and Paystack receipt downstream
  // expect a single currency throughout.
  const phase2APriceDisplay = convertFromUsd(phase2APriceUsd, display, usdToNgn);
  const phase2BStartPriceDisplay = convertFromUsd(phase2BStartPriceUsd, display, usdToNgn);

  const phase2BLabel =
    phase2BStartPriceDisplay === null
      ? "Not configured"
      : `From ${formatMoney(phase2BStartPriceDisplay, display)}`;

  return [
    {
      tier: "FOUNDATION",
      name: "Free",
      price: formatMoney(0, display),
      amount: 0,
      currency: display,
      features: [
        "Phase 1 quick scan",
        "Standard insights summary",
        "Email-delivered report",
      ],
      buttonLabel: "Included",
      buttonVariant: "outlined",
    },
    {
      tier: "ACCELERATOR",
      name: "Plan 2A",
      price: formatMoney(phase2APriceDisplay, display),
      amount: phase2APriceDisplay,
      currency: display,
      // Section P — bullets come from PlanPrice.features (admin-edited);
      // fall back to a sensible default + the size-specific quip if the row
      // somehow has no features.
      features:
        pricing?.phase2A?.features?.length
          ? pricing.phase2A.features
          : [
              "Full Phase 2A diagnostic",
              businessSize === "MEDIUM"
                ? "Medium-business question set"
                : "Pillar-by-pillar findings",
              "Downloadable PDF report",
            ],
      buttonLabel: "Unlock Plan 2A",
      buttonVariant: "filled",
      recommended: true,
      backendPlan: "PHASE2A",
      priceMissing: phase2APriceUsd === null,
    },
    {
      tier: "DEEP DIVE",
      name: "Plan 2B Module",
      price: phase2BLabel,
      amount: phase2BStartPriceDisplay,
      currency: display,
      features:
        phase2BPrices[0]?.features?.length
          ? phase2BPrices[0].features
          : [
              "Targeted Pillar Analysis",
              "Granular scoring",
              "Actionable insights per pillar",
            ],
      buttonLabel: "Buy a Module",
      buttonVariant: "filled",
      backendPlan: "PHASE2B_PILLAR",
      priceMissing: phase2BStartPriceUsd === null,
    },
  ];
}

// BE-1 — price a Phase 2B bundle in the user's display currency. Sums the
// per-pillar catalogue prices (converted from USD), then applies the
// admin-configured compound discount. Mirrors backend resolvePhase2BBundlePrice.
function resolveBundleAmount(
  pillarIds: string[],
  pricing: PublicPricingResponse | null,
  display: Currency,
): { base: number; total: number; discountPct: number; savings: number; anyMissing: boolean } {
  const usdToNgn = pricing?.usdToNgn ?? 1;
  const byId = new Map((pricing?.phase2B ?? []).filter((r) => r.pillarId).map((r) => [r.pillarId!, r]));
  let baseUsd = 0;
  let anyMissing = false;
  for (const id of pillarIds) {
    const row = byId.get(id);
    if (!row) anyMissing = true;
    else baseUsd += row.price;
  }
  const cfg = pricing?.phase2bDiscount ?? { pctPerPillar: 5, maxPillars: 5 };
  const extra = Math.max(0, Math.min(pillarIds.length, cfg.maxPillars) - 1);
  const discountPct = Math.min(100, extra * cfg.pctPerPillar);
  const base = convertFromUsd(baseUsd, display, usdToNgn) ?? 0;
  const total = Math.round(base * (1 - discountPct / 100) * 100) / 100;
  return { base, total, discountPct, savings: Math.round((base - total) * 100) / 100, anyMissing };
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
          <Loader className="w-8 h-8 text-[#f97316] animate-spin" />
        </div>
      }
    >
      <SubscriptionPageInner />
    </Suspense>
  );
}

function SubscriptionPageInner() {
  const searchParams = useSearchParams();
  const urlSessionId = searchParams?.get("sessionId") ?? null;
  const urlPillarId = searchParams?.get("pillarId") ?? null;
  // BE-1 — comma-separated pillar set for a multi-pillar bundle.
  const urlPillarIdsRaw = searchParams?.get("pillarIds") ?? null;
  const urlPlan = searchParams?.get("plan") ?? null;
  const urlAutoCheckout = searchParams?.get("autoCheckout") === "1";

  const [view, setView] = useState<View>("plans");
  const [me, setMe] = useState<MeUser | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanCard | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  const [checkoutPillarId, setCheckoutPillarId] = useState<string | null>(null);
  // BE-1 — full pillar set for a multi-pillar bundle checkout. For a
  // single-pillar purchase this holds one id (mirrors checkoutPillarId).
  const [checkoutPillarIds, setCheckoutPillarIds] = useState<string[]>([]);
  // Pillar display names for the bundle, for the success screen list.
  const [checkoutPillarNames, setCheckoutPillarNames] = useState<string[]>([]);
  const [verifyResult, setVerifyResult] =
    useState<VerifyPaymentResponse | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verifyingReturn, setVerifyingReturn] = useState(false);
  const [lockedScans, setLockedScans] = useState<LockedScan[] | null>(null);
  const [loadingLocked, setLoadingLocked] = useState(false);
  const [showLockedPicker, setShowLockedPicker] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanCard | null>(null);
  const [showPillarPicker, setShowPillarPicker] = useState(false);
  const [allPillars, setAllPillars] = useState<any[]>([]);
  const [ownedPillarIds, setOwnedPillarIds] = useState<Set<string>>(new Set());
  const [loadingPillars, setLoadingPillars] = useState(false);
  const [pricing, setPricing] = useState<PublicPricingResponse | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [chargedAmount, setChargedAmount] = useState<number | null>(null);
  // Set while we run the pre-init quota check. The BE returns `free: true`
  // when the user's subscription still has unused tests, in which case the
  // payment is settled and entitlements are granted — there's nothing to
  // charge, so the FE should never show the checkout screen. We keep a
  // short busy indicator over the picker while this single round-trip
  // resolves rather than flashing the checkout UI in between.
  const [quotaInFlight, setQuotaInFlight] = useState(false);
  // Active subscription — when present we run the pre-init quota probe so a
  // user with credits never sees the checkout screen. When absent we skip
  // the probe entirely so the BE doesn't accumulate orphaned PENDING rows
  // for non-subscribers.
  const [mySub, setMySub] = useState<MySubscriptionPayload | null>(null);

  // NG users see NGN throughout; everyone else USD. Falls back to USD when
  // /auth/me is still in flight so the page doesn't jump currencies mid-render.
  const displayCurrency: Currency = useMemo(
    () => resolveDisplayCurrency(me?.country ?? null),
    [me?.country],
  );

  const plans = useMemo(
    () => buildPlans(me?.businessSize ?? null, pricing, displayCurrency),
    [me?.businessSize, pricing, displayCurrency],
  );

  const pricingByPillarId = useMemo(() => {
    const entries = pricing?.phase2B ?? [];
    return new Map(entries.filter((row) => row.pillarId).map((row) => [row.pillarId!, row]));
  }, [pricing]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getMe();
      if (cancelled) return;
      if (res.error || !res.data) {
        setMeError(
          res.error?.message ??
            "Could not load your account. Please log in again.",
        );
      } else {
        setMe(res.data.user);
      }
      setMeLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getPublicPricing();
      if (cancelled) return;
      if (res.error || !res.data) {
        setPaymentError(res.error?.message ?? "Could not load pricing.");
      } else {
        setPricing(res.data);
      }
      setPricingLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch the user's active subscription up-front. The pre-init quota probe
  // is gated on `mySub` being non-null so we don't run a wasteful init for
  // pay-per-use users with no quota to consume in the first place.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getMySubscription();
      if (cancelled) return;
      if (res.data) setMySub(res.data.subscription);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (meLoading || !me || verifyResult || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const returnedReference =
      params.get("reference") ||
      params.get("trxref") ||
      sessionStorage.getItem(PENDING_PAYMENT_REFERENCE_KEY);

    if (!returnedReference) return;

    let cancelled = false;

    const cleanupReference = () => {
      sessionStorage.removeItem(PENDING_PAYMENT_REFERENCE_KEY);
      if (params.has("reference") || params.has("trxref")) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    (async () => {
      setVerifyingReturn(true);
      setPaymentError(null);

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const verify = await verifyPayment(returnedReference);
        if (cancelled) return;

        if (!verify.error && verify.data?.paid) {
          cleanupReference();
          setPaymentError(null);
          setVerifyResult(verify.data);
          setView("success");
          setVerifyingReturn(false);
          return;
        }

        const status = verify.data?.status;
        if (verify.error || (status && status !== "PENDING")) {
          cleanupReference();
          setPaymentError(
            verify.error?.message ??
              `Payment status: ${status}. If you were charged, please contact support.`,
          );
          setVerifyingReturn(false);
          return;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, 1500);
        });
      }

      cleanupReference();
      setPaymentError(
        "Payment confirmation is taking longer than expected. Please refresh in a moment.",
      );
      setVerifyingReturn(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [me, meLoading, verifyResult]);

  useEffect(() => {
    if (meLoading || pricingLoading || !me || verifyResult) return;
    if (!urlAutoCheckout) return;

    // Multi-pillar bundle (BE-1) — `pillarIds` csv takes precedence over a
    // single `pillarId`. A single id in the csv resolves to a 0%-discount
    // bundle, i.e. the plain pillar price.
    const bundleIds = urlPillarIdsRaw
      ? urlPillarIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : urlPillarId
        ? [urlPillarId]
        : [];

    if (urlPlan === "PHASE2B_PILLAR" && bundleIds.length > 0) {
      const phase2bPlan = plans.find(
        (p) => p.backendPlan === "PHASE2B_PILLAR",
      );
      if (!phase2bPlan) return;
      const { total, anyMissing } = resolveBundleAmount(bundleIds, pricing, displayCurrency);
      const names = bundleIds
        .map((id) => pricingByPillarId.get(id)?.pillarName)
        .filter((n): n is string => Boolean(n));
      setPaymentError(null);
      setSelectedPlan({
        ...phase2bPlan,
        price: formatMoney(total, displayCurrency),
        amount: total,
        currency: displayCurrency,
        priceMissing: anyMissing,
      });
      setCheckoutPillarId(bundleIds.length === 1 ? bundleIds[0] : null);
      setCheckoutPillarIds(bundleIds);
      setCheckoutPillarNames(names);
      setView("checkout");
      return;
    }

    if (urlSessionId) {
      const phase2aPlan = plans.find(
        (p) => p.backendPlan === "PHASE2A",
      );
      if (!phase2aPlan) return;
      setPaymentError(null);
      setSelectedPlan(phase2aPlan);
      setCheckoutSessionId(urlSessionId);
      setView("checkout");
    }
  }, [
    me,
    meLoading,
    plans,
    pricingByPillarId,
    pricingLoading,
    verifyResult,
    urlSessionId,
    urlPillarId,
    urlPillarIdsRaw,
    urlPlan,
    urlAutoCheckout,
  ]);

  const fetchLockedScans = async (): Promise<LockedScan[]> => {
    const token = getAccessToken();
    if (!token) return [];
    const res = await fetch(`${API_BASE}/result/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    const items: unknown[] = Array.isArray(json)
      ? json
      : Array.isArray((json as { results?: unknown[] })?.results)
        ? (json as { results: unknown[] }).results
        : [];
    const locked: LockedScan[] = [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const entry = item as {
        paywalled?: unknown;
        result?: {
          sessionId?: unknown;
          phase?: unknown;
          totalScore?: unknown;
          colorBand?: unknown;
          generatedAt?: unknown;
          updatedAt?: unknown;
          createdAt?: unknown;
        } | null;
      };
      if (entry.paywalled !== true || !entry.result) continue;
      const r = entry.result;
      if (typeof r.sessionId !== "string") continue;
      if (r.phase !== "PHASE2A") continue;
      locked.push({
        sessionId: r.sessionId,
        phase: typeof r.phase === "string" ? r.phase : "PHASE2A",
        totalScore: typeof r.totalScore === "number" ? r.totalScore : 0,
        colorBand: typeof r.colorBand === "string" ? r.colorBand : "AMBER",
        completedAt:
          (typeof r.generatedAt === "string" && r.generatedAt) ||
          (typeof r.updatedAt === "string" && r.updatedAt) ||
          (typeof r.createdAt === "string" && r.createdAt) ||
          null,
      });
    }
    return locked;
  };

  const handleSelectPlan = async (plan: PlanCard) => {
    if (!plan.backendPlan) return;
    setPaymentError(null);

    if (plan.backendPlan === "PHASE2A") {
      setPendingPlan(plan);
      setLoadingLocked(true);
      const locked = await fetchLockedScans();
      setLockedScans(locked);
      setLoadingLocked(false);

      if (locked.length === 0) {
        setShowLockedPicker(true);
        return;
      }
      if (locked.length === 1) {
        // Auto-pick + pre-check quota in one shot — if the user's
        // subscription has a free Phase 2A left we want them to skip the
        // checkout screen, not flash through it.
        const onlyScan = locked[0];
        const shortCircuited = await tryFreeShortCircuit(plan, {
          sessionId: onlyScan.sessionId,
        });
        if (shortCircuited) {
          setSelectedPlan(plan);
          setCheckoutSessionId(onlyScan.sessionId);
          return;
        }
        setSelectedPlan(plan);
        setCheckoutSessionId(onlyScan.sessionId);
        setView("checkout");
        return;
      }
      setShowLockedPicker(true);
      return;
    }

    if (plan.backendPlan === "PHASE2B_PILLAR") {
      setPendingPlan(plan);
      setLoadingPillars(true);
      setShowPillarPicker(true);
      try {
        const [pillarsRes, myPillarsRes] = await Promise.all([
          getAllPillars(),
          getMyPhase2BPillars()
        ]);
        if (pillarsRes.data) {
          const usdToNgn = pricing?.usdToNgn ?? 1;
          const enrichedPillars = (pillarsRes.data.pillars || []).map((pillar: any) => {
            const row = pricingByPillarId.get(pillar.id);
            const display = convertFromUsd(row?.price ?? null, displayCurrency, usdToNgn);
            return {
              ...pillar,
              // The picker renders these values verbatim — pre-convert and
              // pre-label so it doesn't need to know about FX.
              price: display,
              currency: displayCurrency,
            };
          });
          setAllPillars(enrichedPillars);
        }
        if (myPillarsRes.data) {
          const owned = new Set((myPillarsRes.data.pillars || [])
            .filter((p: any) => p.status === 'OPEN')
            .map((p: any) => p.pillarId));
          setOwnedPillarIds(owned);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPillars(false);
      }
      return;
    }

    setSelectedPlan(plan);
    setCheckoutSessionId(null);
    setCheckoutPillarId(null);
    setView("checkout");
  };

  // Pre-init helper: ask the BE whether this purchase can be settled from
  // the user's subscription quota (or some other free path) before we ever
  // render the checkout screen. Returns `true` when the call already
  // settled the payment and we've jumped to the success view; `false` when
  // the user actually needs to pay and the caller should proceed into
  // checkout. Errors fall back to `false` so the user can still complete
  // the purchase manually — the BE will re-check quota at the real init.
  const tryFreeShortCircuit = async (
    plan: PlanCard,
    args: { sessionId?: string; pillarId?: string; pillarIds?: string[] },
  ): Promise<boolean> => {
    if (!plan.backendPlan) return false;
    // Skip the probe entirely if the user has no active subscription.
    // Without quota to consume there's nothing for the BE to short-circuit,
    // and the wasted PENDING Payment row is the trade-off we're avoiding.
    if (!mySub || (mySub.status !== "ACTIVE" && mySub.status !== "PAST_DUE")) {
      return false;
    }
    setQuotaInFlight(true);
    try {
      // Section R-2 — cheap read-only probe first. If the user has no
      // quota for this kind we skip initPayment entirely, which means no
      // PENDING Payment row is written for paid outcomes. The probe
      // failing (network blip, etc.) falls through to the original
      // initPayment path so the user can still complete the purchase.
      const probe = await quotaCheck(plan.backendPlan);
      if (probe.error || !probe.data?.hasQuota) {
        return false;
      }

      const res = await initPayment({
        plan: plan.backendPlan,
        sessionId: args.sessionId,
        pillarId: args.pillarId,
        pillarIds: args.pillarIds,
      });
      if (res.error || !res.data) {
        // Couldn't pre-check — fall through to the normal checkout path
        // where the same call runs again with proper error handling.
        return false;
      }
      if (!res.data.free) {
        // Defence in depth — the probe said hasQuota=true but the BE
        // disagreed at consume time (race between probe and init, or a
        // mis-mapped kind). Treat as "user must pay" and fall through.
        return false;
      }
      // Quota covered it. Verify (BE returns "already settled") and jump
      // to success. The success view shows entitlement details.
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const verify = await verifyPayment(res.data.reference);
        if (!verify.error && verify.data?.paid) {
          handlePaymentSuccess(verify.data, 0);
          return true;
        }
        const status = verify.data?.status;
        if (verify.error || (status && status !== "PENDING")) {
          // Verify failed despite `free: true` from init — this is rare
          // (it means the BE record didn't materialize). Surface the
          // error and let the user retry.
          setPaymentError(
            verify.error?.message ??
              "Could not confirm subscription credit. Please try again.",
          );
          return false;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
      return false;
    } finally {
      setQuotaInFlight(false);
    }
  };

  const handlePickPillars = async (pillarIds: string[]) => {
    if (!pendingPlan || pillarIds.length === 0) return;
    setShowPillarPicker(false);
    const { total, anyMissing } = resolveBundleAmount(pillarIds, pricing, displayCurrency);
    const names = pillarIds
      .map((id) => pricingByPillarId.get(id)?.pillarName)
      .filter((n): n is string => Boolean(n));
    const planForCheckout: PlanCard = {
      ...pendingPlan,
      price: formatMoney(total, displayCurrency),
      amount: total,
      currency: displayCurrency,
      priceMissing: anyMissing,
    };
    // Pre-check quota before opening the checkout screen. If the user's
    // subscription covers the whole bundle, the helper jumps straight to
    // success (the BE grants one unlock per pillar).
    const shortCircuited = await tryFreeShortCircuit(planForCheckout, { pillarIds });
    setSelectedPlan(planForCheckout);
    setCheckoutSessionId(null);
    setCheckoutPillarId(pillarIds.length === 1 ? pillarIds[0] : null);
    setCheckoutPillarIds(pillarIds);
    setCheckoutPillarNames(names);
    if (shortCircuited) return;
    setView("checkout");
  };

  const handlePickLockedScan = async (sessionId: string) => {
    if (!pendingPlan) return;
    setShowLockedPicker(false);
    const planForCheckout = pendingPlan;
    const shortCircuited = await tryFreeShortCircuit(planForCheckout, {
      sessionId,
    });
    if (shortCircuited) {
      setSelectedPlan(planForCheckout);
      setCheckoutSessionId(sessionId);
      return;
    }
    setSelectedPlan(planForCheckout);
    setCheckoutSessionId(sessionId);
    setView("checkout");
  };

  const closeLockedPicker = () => {
    setShowLockedPicker(false);
    setPendingPlan(null);
  };

  const handlePaymentSuccess = (result: VerifyPaymentResponse, amount: number | null) => {
    setPaymentError(null);
    setChargedAmount(amount);
    setVerifyResult(result);
    setView("success");
  };

  // The cold-start (meLoading + pricingLoading) gets the picker-shaped
  // skeleton so the page doesn't flash blank. The transient busy states
  // (verifyingReturn, quotaInFlight) keep the spinner + status copy
  // because they're explicit user-initiated actions where progress
  // narration matters more than layout continuity.
  if (meLoading || pricingLoading) {
    return <SubscriptionPickerSkeleton />;
  }

  if (verifyingReturn || quotaInFlight) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <Loader className="w-8 h-8 text-[#f97316] animate-spin" />
          <p className="text-sm text-gray-400">
            {quotaInFlight
              ? "Checking your subscription credits..."
              : verifyingReturn
                ? "Confirming your payment..."
                : "Loading your account..."}
          </p>
        </div>
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

  // Section F — when the admin turns the pay-per-use section off, hide the
  // catalogue entirely and push users to subscriptions. The BE already zeros
  // out the pricing payload, but this gives a clearer in-app message than an
  // empty grid. Default to "live" so the page renders normally during the
  // initial fetch and any pre-toggle deploys keep working.
  const payPerUseSectionLive = pricing?.sections?.payPerUse ?? true;
  const subscriptionSectionLive = pricing?.sections?.subscription ?? true;

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      {view === "plans" && !payPerUseSectionLive && (
        <PayPerUsePausedView subscriptionLive={subscriptionSectionLive} />
      )}
      {view === "plans" && payPerUseSectionLive && (
        <ChoosePlanView
          me={me}
          plans={plans}
          onSelectPlan={handleSelectPlan}
          paymentError={paymentError}
        />
      )}
      {view === "checkout" && selectedPlan && (
        <CheckoutView
          plan={selectedPlan}
          me={me}
          sessionId={checkoutSessionId}
          pillarId={checkoutPillarId}
          pillarIds={checkoutPillarIds}
          pillarNames={checkoutPillarNames}
          bundle={
            checkoutPillarIds.length > 1
              ? (() => {
                  const b = resolveBundleAmount(checkoutPillarIds, pricing, displayCurrency);
                  return b.discountPct > 0
                    ? { base: b.base, total: b.total, discountPct: b.discountPct, savings: b.savings }
                    : null;
                })()
              : null
          }
          onChangePlan={() => setView("plans")}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      {view === "success" && verifyResult && (
        <SuccessView
          me={me}
          plan={selectedPlan}
          verifyResult={verifyResult}
          chargedAmount={chargedAmount}
          pillarNames={checkoutPillarNames}
        />
      )}

      {showLockedPicker && (
        <LockedScanPickerModal
          scans={lockedScans ?? []}
          loading={loadingLocked}
          onPick={handlePickLockedScan}
          onClose={closeLockedPicker}
        />
      )}

      {showPillarPicker && (
        <div className="relative z-[60]">
          <PillarPickerModal
            pillars={allPillars}
            ownedPillarIds={ownedPillarIds}
            discount={pricing?.phase2bDiscount ?? { pctPerPillar: 5, maxPillars: 5 }}
            onClose={() => {
              setShowPillarPicker(false);
              setPendingPlan(null);
            }}
            onConfirm={handlePickPillars}
          />
        </div>
      )}
    </>
  );
}

function LockedScanPickerModal({
  scans,
  loading,
  onPick,
  onClose,
}: {
  scans: LockedScan[];
  loading: boolean;
  onPick: (sessionId: string) => void;
  onClose: () => void;
}) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#111827] border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Choose a scan to unlock
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Phase 2A is unlocked per scan. Pick which locked scan this payment should
              unlock.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : scans.length === 0 ? (
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-5">
            <p className="text-sm text-yellow-300 mb-3">
              You don&apos;t have any locked Phase 2A scans yet. Take a Strategic Scan
              first, then come back to unlock the full diagnostic.
            </p>
            <Link
              href="/dashboard/strategic-scan"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Start Strategic Scan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {scans.map((scan) => (
              <button
                key={scan.sessionId}
                onClick={() => onPick(scan.sessionId)}
                className="w-full text-left rounded-xl bg-[#0d1117] border border-white/5 hover:border-orange-500/40 hover:bg-[#161f33] p-4 transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      Phase 2A Scan · {scan.sessionId.substring(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(scan.completedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-gray-500">Score</p>
                      <p className="text-sm font-bold text-white">
                        {Math.round(scan.totalScore)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-gray-500">Status</p>
                      <p
                        className={`text-sm font-bold inline-flex items-center gap-1 ${bandColor(scan.colorBand)}`}
                      >
                        <Lock className="w-3 h-3" />
                        Locked
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Section F — rendered in place of the catalogue when admin has paused the
// pay-per-use section. The BE invariant guarantees at least one section is
// live so we always have something to direct the user toward.
function PayPerUsePausedView({ subscriptionLive }: { subscriptionLive: boolean }) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-24 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          One-off purchases are paused
        </h1>
        <p className="text-sm md:text-base text-gray-400 mb-8">
          Pay-per-use checkout isn&apos;t available right now.
          {subscriptionLive
            ? " You can still subscribe to a monthly plan for full access."
            : " Please check back later."}
        </p>
        {subscriptionLive && (
          <Link
            href="/dashboard/plans"
            className="inline-block py-3 px-6 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white transition"
          >
            See monthly plans
          </Link>
        )}
      </div>
    </div>
  );
}

function ChoosePlanView({
  me,
  plans,
  onSelectPlan,
  paymentError,
}: {
  me: MeUser;
  plans: PlanCard[];
  onSelectPlan: (plan: PlanCard) => void;
  paymentError: string | null;
}) {
  const businessSize: BusinessSize | null = me.businessSize;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-20">
      <section className="text-center px-4 pt-16 pb-12 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
          Celestial Intelligence{" "}
          <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
            Architected for Growth.
          </span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Plans tailored to your business profile. The PICA engine has classified
          your operation as{" "}
          <span className="text-orange-400 font-semibold">
            {businessSize === "MEDIUM"
              ? "Medium Business"
              : businessSize === "SMALL"
                ? "Small Business"
                : "Unclassified"}
          </span>
          .
        </p>
      </section>

      {!businessSize && (
        <div className="max-w-2xl mx-auto px-4 mb-12">
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-5 text-sm text-yellow-300 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="flex-1">
              We couldn&apos;t determine your business size yet. Add your staff
              size in settings so we can show plans that fit your operation.
            </span>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/30 hover:bg-yellow-500/40 text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap"
            >
              Complete profile
            </Link>
          </div>
        </div>
      )}

      {paymentError && (
        <div className="max-w-2xl mx-auto px-4 mb-12">
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-5 text-sm text-red-300">
            {paymentError}
          </div>
        </div>
      )}

      {me.hasPaidPhase2A && (
        <div className="max-w-2xl mx-auto px-4 mb-12">
          <div className="rounded-xl bg-teal-500/10 border border-teal-500/30 p-5 text-sm text-teal-300 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              You&apos;ve already unlocked Plan 2A. Head to your{" "}
              <Link href="/dashboard/reports" className="underline font-semibold">
                reports
              </Link>{" "}
              to download the full diagnostic.
            </div>
          </div>
        </div>
      )}

      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-orange-400 mb-1">
            {businessSize === "MEDIUM" ? "Medium Business" : "Small Business"}
          </h2>
          <p className="text-gray-500 text-sm">
            {businessSize === "MEDIUM"
              ? "Expansive power for scaling infrastructures."
              : "Precision tools for emerging enterprises."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              disabled={
                !plan.backendPlan ||
                plan.priceMissing ||
                (plan.backendPlan === "PHASE2A" && me.hasPaidPhase2A) ||
                // Paid Phase 2A/2B both require a resolved businessSize on the
                // BE; greying these out matches the gate instead of erroring late.
                (plan.backendPlan !== undefined && !me.profileComplete)
              }
              onSelect={() => onSelectPlan(plan)}
            />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
          What you get with PICA Diagnostics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <Rocket className="w-5 h-5 text-red-400" />,
              title: "Full Diagnostic",
              desc: "Complete Phase 2A analysis or Deep Dive Phase 2B Module.",
            },
            {
              icon: <CircleDot className="w-5 h-5 text-teal-400" />,
              title: "Detailed Reports",
              desc: "Downloadable, shareable PDF reports and pillar-level insights.",
            },
            {
              icon: <Shield className="w-5 h-5 text-purple-400" />,
              title: "Lifetime Access",
              desc: "One payment unlocks the assessment for your account permanently.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-[#111827] border border-white/5 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                {feature.icon}
                <p className="text-sm font-bold text-white">{feature.title}</p>
              </div>
              <p className="text-sm text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PricingCard({
  plan,
  disabled,
  onSelect,
}: {
  plan: PlanCard;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`relative bg-[#111827] border rounded-xl p-6 flex flex-col justify-between ${
        plan.recommended ? "border-orange-500/40" : "border-white/5"
      }`}
    >
      {plan.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">
          Recommended
        </div>
      )}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
          {plan.tier}
        </p>
        <h3 className="text-3xl font-extrabold text-white mb-1">{plan.name}</h3>
        <p className="text-gray-400 text-sm mb-6">
          {plan.price}{" "}
          {!plan.priceMissing && <span className="text-gray-600">/one-time</span>}
        </p>
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 text-sm text-gray-300"
            >
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={onSelect}
        disabled={disabled}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
          disabled
            ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
            : plan.buttonVariant === "filled"
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "border border-white/20 text-white hover:bg-white/5"
        }`}
      >
        {plan.buttonLabel}
      </button>
    </div>
  );
}

function CheckoutView({
  plan,
  me,
  sessionId: explicitSessionId,
  pillarId: explicitPillarId,
  pillarIds: explicitPillarIds,
  pillarNames,
  bundle,
  onChangePlan,
  onPaymentSuccess,
}: {
  plan: PlanCard;
  me: MeUser;
  sessionId: string | null;
  pillarId: string | null;
  // BE-1 — full pillar set for a multi-pillar bundle. Single-pillar purchases
  // pass a one-element array (or fall back to explicitPillarId).
  pillarIds: string[];
  pillarNames: string[];
  // Bundle discount breakdown (null for single-pillar / no-discount). Mirrors the
  // selection modal's subtotal → discount → total strip on the checkout summary.
  bundle: { base: number; total: number; discountPct: number; savings: number } | null;
  onChangePlan: () => void;
  onPaymentSuccess: (result: VerifyPaymentResponse, amount: number | null) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("Card");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponPricing, setCouponPricing] = useState<CouponPricing | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const paidRef = useRef(false);

  const baseAmount = plan.amount;
  const displayTotal =
    couponPricing && baseAmount !== null
      ? formatPrice(couponPricing.finalAmount, plan.currency)
      : plan.price;
  const hasAppliedCoupon = couponPricing !== null;

  const tabs = [
    { label: "Card", icon: <CreditCard className="w-4 h-4" /> },
    { label: "Transfer", icon: <Building2 className="w-4 h-4" /> },
    { label: "Opay", icon: <Landmark className="w-4 h-4" /> },
    { label: "Paystack", icon: <Shield className="w-4 h-4" /> },
  ];

  const verifyWithRetry = async (reference: string) => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const verify = await verifyPayment(reference);
      if (!verify.error && verify.data?.paid) {
        return { ok: true as const, data: verify.data };
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

  const handleCouponChange = (value: string) => {
    setCouponCode(value.toUpperCase());
    setCouponPricing(null);
    setCouponError(null);
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }
    if (baseAmount === null || plan.priceMissing) {
      setCouponError("Pricing is not configured for this plan yet.");
      return;
    }

    setCouponBusy(true);
    setCouponError(null);
    if (!plan.backendPlan) {
      setCouponError("Invalid plan selection.");
      return;
    }
    const response = await validateCoupon({
      code,
      basePrice: baseAmount,
      plan: plan.backendPlan,
      // For a bundle the coupon validates against the first pillar; the BE
      // applies the coupon to the already-discounted bundle total.
      pillarId: explicitPillarId ?? explicitPillarIds[0] ?? undefined,
    });
    setCouponBusy(false);

    if (response.error || !response.data) {
      setCouponPricing(null);
      setCouponError(response.error?.message ?? "Could not apply coupon.");
      return;
    }

    setCouponCode(response.data.pricing.code);
    setCouponPricing(response.data.pricing);
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1800);
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponPricing(null);
    setCouponError(null);
    setShowConfetti(false);
  };

  const handlePay = async () => {
    setError(null);
    setBusy(true);
    paidRef.current = false;

    try {
      if (typeof window === "undefined" || !window.PaystackPop) {
        setError(
          "Payment SDK is still loading. Please wait a moment and try again.",
        );
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

      const sessionId = explicitSessionId ?? getLastSessionId() ?? undefined;
      // Normalize the pillar set: prefer the bundle array, fall back to the
      // single id. Empty for PHASE2A.
      const pillarIds =
        explicitPillarIds.length > 0
          ? explicitPillarIds
          : explicitPillarId
            ? [explicitPillarId]
            : [];

      if (plan.backendPlan === "PHASE2A" && !sessionId) {
        setError(
          "No scan selected. Please pick a locked Phase 2A scan to unlock, or take a Strategic Scan first.",
        );
        setBusy(false);
        return;
      }

      if (plan.backendPlan === "PHASE2B_PILLAR" && pillarIds.length === 0) {
        setError("No pillar selected. Please select a Deep Dive module to unlock.");
        setBusy(false);
        return;
      }

      if (plan.priceMissing) {
        setError("Pricing is not configured for this plan yet. Please contact support.");
        setBusy(false);
        return;
      }

      const init = await initPayment({
        plan: plan.backendPlan!,
        sessionId,
        ...(pillarIds.length > 0 ? { pillarIds } : {}),
        ...(couponPricing ? { couponCode: couponPricing.code } : {}),
      });

      if (init.error || !init.data) {
        setError(init.error?.message ?? "Could not initialize payment");
        setBusy(false);
        return;
      }

      const { reference, amount, currency } = init.data;
      if (!reference) {
        setError("Payment reference is unavailable. Please try again.");
        setBusy(false);
        return;
      }

      // 100%-off coupon: the backend already settled the payment and granted
      // access — no Paystack checkout to open. Confirm via verify (returns
      // "already verified" for settled payments) and jump to success.
      if (init.data.free) {
        paidRef.current = true;
        setVerifying(true);
        const result = await verifyWithRetry(reference);
        setVerifying(false);
        setBusy(false);
        if (result.ok) {
          onPaymentSuccess(result.data, amount);
        } else {
          setError(result.message);
        }
        return;
      }

      sessionStorage.setItem(PENDING_PAYMENT_REFERENCE_KEY, reference);

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: me.email,
        amount: Math.round(amount * 100),
        ref: reference,
        currency,
        callback: (response) => {
          paidRef.current = true;
          setVerifying(true);
          void (async () => {
            const result = await verifyWithRetry(response.reference);
            sessionStorage.removeItem(PENDING_PAYMENT_REFERENCE_KEY);
            setVerifying(false);
            setBusy(false);
            if (result.ok) {
              onPaymentSuccess(result.data, amount);
            } else {
              setError(result.message);
            }
          })();
        },
        onClose: () => {
          if (paidRef.current) return;
          sessionStorage.removeItem(PENDING_PAYMENT_REFERENCE_KEY);
          setBusy(false);
          setError("Payment was cancelled before completion.");
        },
      });
      handler.openIframe();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            Complete your{" "}
            <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
              ascension.
            </span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base mb-10 max-w-md">
            Secure your access to the full Phase 2A diagnostic. Payment is processed
            by Paystack in a secure popup — you stay on this page the whole time.
          </p>

          <div className="rounded-xl bg-gradient-to-br from-teal-900/60 to-[#111827] border border-teal-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                Selected Plan
              </p>
              <span className="px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase">
                One-time
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-4">
              {plan.name}
            </h3>
            <ul className="space-y-2.5 mb-6">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-gray-300"
                >
                  <Check className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                Total due now
              </p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-black text-white">{displayTotal}</p>
                {couponPricing ? (
                  <span className="text-lg font-bold text-gray-500 line-through">
                    {formatPrice(couponPricing.basePrice, plan.currency)}
                  </span>
                ) : bundle ? (
                  <span className="text-lg font-bold text-gray-500 line-through">
                    {formatPrice(bundle.base, plan.currency)}
                  </span>
                ) : null}
              </div>
              {!couponPricing && bundle && (
                <div className="mt-4 space-y-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 text-sm">
                  <div className="flex justify-between gap-4 text-gray-200">
                    <span className="font-semibold">
                      {explicitPillarIds.length} modules · subtotal
                    </span>
                    <span className="font-bold text-white">
                      {formatPrice(bundle.base, plan.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-teal-300">
                    <span className="font-semibold">
                      Bundle discount ({bundle.discountPct}% off)
                    </span>
                    <span className="font-extrabold">
                      −{formatPrice(bundle.savings, plan.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-teal-500/20 pt-2.5 text-white">
                    <span className="font-bold">Total</span>
                    <span className="text-lg font-black text-[#00ffaa]">
                      {formatPrice(bundle.total, plan.currency)}
                    </span>
                  </div>
                </div>
              )}
              {couponPricing && (
                <div className="mt-4 space-y-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 text-sm">
                  <div className="flex justify-between gap-4 text-gray-200">
                    <span className="font-semibold">Base price</span>
                    <span className="font-bold text-white">
                      {formatPrice(couponPricing.basePrice, plan.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-teal-300">
                    <span className="font-semibold">
                      Coupon {couponPricing.code}
                    </span>
                    <span className="font-extrabold">
                      -{formatPrice(couponPricing.discountAmount, plan.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-teal-500/20 pt-2.5 text-white">
                    <span className="font-bold">You pay</span>
                    <span className="text-lg font-black text-[#00ffaa]">
                      {formatPrice(couponPricing.finalAmount, plan.currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onChangePlan}
              className="text-teal-400 text-sm font-semibold hover:underline"
            >
              Change plan
            </button>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap gap-2 border-b border-white/10 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition relative ${
                  activeTab === tab.label
                    ? "text-orange-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.label && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111827] p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-teal-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Secure Hosted Payment
              </p>
            </div>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              Clicking <span className="font-semibold">Complete Payment</span>{" "}
              opens a Paystack checkout popup on this page. We confirm the
              transaction with our servers before unlocking your success page.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-green-400" /> 256-bit encryption
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-blue-400" /> PCI-DSS Level 1
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3 h-3 text-orange-400" /> Cards & transfers
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-teal-400" /> Verified Visa & MC
              </div>
            </div>
          </div>

          <div className="relative overflow-visible rounded-xl border border-white/10 bg-[#111827] p-6 mb-6">
            <AnimatePresence>{showConfetti && <CouponConfetti />}</AnimatePresence>
            <div className="flex items-center justify-between gap-4 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400">
                Coupon Discount
              </p>
              {hasAppliedCoupon && (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="rounded-full bg-teal-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-teal-300"
                >
                  Applied
                </motion.span>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={couponCode}
                onChange={(event) => handleCouponChange(event.target.value)}
                disabled={busy || verifying || couponBusy || hasAppliedCoupon}
                placeholder="Enter coupon code"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white outline-none transition placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-600 focus:border-orange-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {hasAppliedCoupon ? (
                <button
                  type="button"
                  onClick={removeCoupon}
                  disabled={busy || verifying}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void applyCoupon()}
                  disabled={busy || verifying || couponBusy || !couponCode.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-gray-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {couponBusy && <Loader className="h-4 w-4 animate-spin" />}
                  Apply
                </button>
              )}
            </div>
            {couponError && (
              <p className="mt-3 text-sm font-semibold text-red-400">{couponError}</p>
            )}
            {couponPricing && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-[#00ffaa]" />
                <p className="text-base font-bold text-white">
                  Coupon applied! You save{" "}
                  <span className="text-[#00ffaa]">
                    {formatPrice(couponPricing.discountAmount, plan.currency)}
                  </span>
                </p>
              </motion.div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={busy || verifying}
            className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Confirming
                payment...
              </>
            ) : busy ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Opening checkout...
              </>
            ) : (
              <>
                Complete Payment <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="mt-3 text-[11px] text-gray-600 leading-relaxed flex items-start gap-2">
            <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            By clicking Complete Payment, you authorize PICA, via Paystack, to
            charge {displayTotal} for one-time access to this plan.
          </p>
        </div>
      </div>

      <footer className="max-w-6xl mx-auto px-4 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
        <span className="font-bold text-gray-400 tracking-wider">PICA</span>
        <div className="flex items-center gap-6">
          <span className="hover:text-gray-400 cursor-pointer transition">
            PRIVACY
          </span>
          <span className="hover:text-gray-400 cursor-pointer transition">
            TERMS
          </span>
          <span className="hover:text-gray-400 cursor-pointer transition">
            SUPPORT
          </span>
        </div>
        <span>&copy; 2024 PICA.</span>
      </footer>
    </div>
  );
}

const CONFETTI_COLORS = [
  "#f97316",
  "#2dd4bf",
  "#facc15",
  "#a855f7",
  "#ec4899",
  "#34d399",
];

// Lightweight party-popper burst — fires once when a coupon is applied.
// Pieces spray outward from the center and fall away; no external lib needed.
function CouponConfetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 36 + Math.random() * 0.4;
        const distance = 120 + Math.random() * 160;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 40,
          rotate: Math.random() * 540 - 270,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: Math.random() * 0.12,
          size: 6 + Math.random() * 6,
          round: Math.random() > 0.5,
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: [1, 1, 0],
            x: p.x,
            y: [0, p.y, p.y + 220],
            rotate: p.rotate,
            scale: [1, 1, 0.6],
          }}
          transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "2px",
          }}
        />
      ))}
    </div>
  );
}

function SuccessView({
  me,
  plan,
  verifyResult,
  chargedAmount,
  pillarNames,
}: {
  me: MeUser;
  plan: PlanCard | null;
  verifyResult: VerifyPaymentResponse;
  chargedAmount: number | null;
  // BE-1 — names of every pillar unlocked in this (possibly multi-pillar) purchase.
  pillarNames: string[];
}) {
  const displayAmount = chargedAmount !== null ? formatPrice(chargedAmount) : (plan?.price ?? "Paid");
  const isBundle = plan?.backendPlan === "PHASE2B_PILLAR";
  const capabilities = isBundle
    ? [
        // One "module unlocked" row per purchased pillar, then the shared perks.
        ...pillarNames.map((name) => ({
          icon: <CircleDot className="w-5 h-5 text-[#f97316]" />,
          title: `${name} Deep Dive`,
          desc: "Module unlocked — ready to start whenever you are.",
        })),
        {
          icon: <Zap className="w-5 h-5 text-[#f97316]" />,
          title: "Downloadable Report",
          desc: "PDF copy delivered to your inbox and dashboard.",
        },
      ]
    : [
        {
          icon: <BarChart2 className="w-5 h-5 text-[#f97316]" />,
          title: "Full Phase 2A Diagnostic",
          desc: "Pillar-level findings, scoring, and risk markers.",
        },
        {
          icon: <Users className="w-5 h-5 text-[#f97316]" />,
          title: `Tailored for ${me.businessSize === "MEDIUM" ? "Medium" : "Small"} Business`,
          desc: "Question set chosen based on your business size.",
        },
        {
          icon: <Zap className="w-5 h-5 text-[#f97316]" />,
          title: "Downloadable Report",
          desc: "PDF copy delivered to your inbox and dashboard.",
        },
        {
          icon: <Star className="w-5 h-5 text-[#f97316]" />,
          title: "Lifetime Access",
          desc: "Re-run the assessment any time - no further charges.",
        },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-white">
      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 md:px-8 py-16">
        <div className="w-16 h-16 rounded-full bg-[#00ffaa] flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-gray-900" />
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-center">
          Payment Successful.
        </h1>
        <p className="text-base text-center mb-12 max-w-lg text-gray-400">
          {plan?.backendPlan === "PHASE2B_PILLAR"
            ? pillarNames.length > 1
              ? `${pillarNames.length} deep-dive modules are now active. Start whenever you're ready.`
              : "Plan 2B Module is now active. Your deep dive is ready."
            : "Plan 2A is now active on your account. Your full diagnostic is ready."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="rounded-2xl p-8 border bg-[#161b22] border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#00ffaa]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#00ffaa]">
                Transaction Details
              </p>
            </div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1 text-gray-500">
                  Plan
                </p>
                <p className="text-xl font-bold text-white">
                  {plan?.name ?? "Plan 2A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest mb-1 text-gray-500">
                  Status
                </p>
                <p className="text-xl font-bold text-[#00ffaa]">
                  {verifyResult.status}
                </p>
              </div>
            </div>

            <div className="border-t pt-6 mb-8 border-white/10">
              <p className="text-xs mb-1 text-gray-400">Reference</p>
              <p className="text-sm font-mono text-gray-300 break-all mb-4">
                {verifyResult.reference}
              </p>
              <p className="text-xs mb-1 text-gray-400">Total amount</p>
              <p className="text-3xl font-extrabold text-[#00ffaa]">
                {displayAmount}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {plan?.backendPlan === "PHASE2B_PILLAR" ? (
                <Link
                  href="/dashboard/deep-dive"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition"
                >
                  Start Deep Dive <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/dashboard/reports"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition"
                >
                  Go to Reports <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                href="/dashboard"
                className="flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-semibold border border-white/10 text-white hover:bg-white/5 transition"
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-2xl p-8 border bg-[#1a2010] border-[#00ffaa]/20">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-4 h-4 text-[#f97316]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#f97316]">
                What&apos;s Unlocked
              </p>
            </div>
            <div className="space-y-5 mb-8">
              {capabilities.map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{icon}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed rounded-xl p-4 bg-[#0d1117]/50 text-gray-500 flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 text-yellow-500" />
              A receipt has been sent to {me.email}.
            </p>
          </div>
        </div>

        <div className="hidden">
          <Cpu />
        </div>
      </div>
    </div>
  );
}
