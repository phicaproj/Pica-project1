"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
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
  getLastSessionId,
  getMe,
  initPayment,
  verifyPayment,
  type BusinessSize,
  type MeUser,
  type VerifyPaymentResponse,
} from "@/lib/authClient";

type View = "plans" | "checkout" | "success";

const PENDING_PAYMENT_REFERENCE_KEY = "pica.pendingPaymentReference";

type PaystackHandler = { openIframe: () => void };

type PaystackSetupOptions = {
  accessCode: string;
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

// Phase 2A price in NGN major units. Backend accepts whatever the FE sends
// (validated <= 10_000_000); align this with admin pricing once that ships.
const PHASE2A_PRICE_NGN = 50000;

type PlanCard = {
  tier: string;
  name: string;
  price: string;
  features: string[];
  buttonLabel: string;
  buttonVariant: "filled" | "outlined";
  recommended?: boolean;
  backendPlan?: "PHASE2A";
};

const SMALL_PLANS: PlanCard[] = [
  {
    tier: "FOUNDATION",
    name: "Free",
    price: "N0",
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
    price: `N${PHASE2A_PRICE_NGN.toLocaleString()}`,
    features: [
      "Full Phase 2A diagnostic",
      "Pillar-by-pillar findings",
      "Downloadable PDF report",
    ],
    buttonLabel: "Unlock Plan 2A",
    buttonVariant: "filled",
    recommended: true,
    backendPlan: "PHASE2A",
  },
];

const MEDIUM_PLANS: PlanCard[] = [
  {
    tier: "FOUNDATION",
    name: "Free",
    price: "N0",
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
    price: `N${PHASE2A_PRICE_NGN.toLocaleString()}`,
    features: [
      "Full Phase 2A diagnostic",
      "Medium-business question set",
      "Downloadable PDF report",
    ],
    buttonLabel: "Unlock Plan 2A",
    buttonVariant: "filled",
    recommended: true,
    backendPlan: "PHASE2A",
  },
];

export default function SubscriptionPage() {
  const [view, setView] = useState<View>("plans");
  const [me, setMe] = useState<MeUser | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanCard | null>(null);
  const [verifyResult, setVerifyResult] =
    useState<VerifyPaymentResponse | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verifyingReturn, setVerifyingReturn] = useState(false);

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

  const handleSelectPlan = (plan: PlanCard) => {
    if (!plan.backendPlan) return;
    setPaymentError(null);
    setSelectedPlan(plan);
    setView("checkout");
  };

  const handlePaymentSuccess = (result: VerifyPaymentResponse) => {
    setPaymentError(null);
    setVerifyResult(result);
    setView("success");
  };

  if (meLoading || verifyingReturn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <Loader className="w-8 h-8 text-[#f97316] animate-spin" />
          <p className="text-sm text-gray-400">
            {verifyingReturn ? "Confirming your payment..." : "Loading your account..."}
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

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      {view === "plans" && (
        <ChoosePlanView
          me={me}
          onSelectPlan={handleSelectPlan}
          paymentError={paymentError}
        />
      )}
      {view === "checkout" && selectedPlan && (
        <CheckoutView
          plan={selectedPlan}
          onChangePlan={() => setView("plans")}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      {view === "success" && verifyResult && (
        <SuccessView
          me={me}
          plan={selectedPlan}
          verifyResult={verifyResult}
        />
      )}
    </>
  );
}

function ChoosePlanView({
  me,
  onSelectPlan,
  paymentError,
}: {
  me: MeUser;
  onSelectPlan: (plan: PlanCard) => void;
  paymentError: string | null;
}) {
  const businessSize: BusinessSize | null = me.businessSize;
  const plans =
    businessSize === "MEDIUM"
      ? MEDIUM_PLANS
      : businessSize === "SMALL"
        ? SMALL_PLANS
        : [];

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
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-5 text-sm text-yellow-300">
            We couldn&apos;t determine your business size yet. Please complete the
            free Phase 1 scan first so we can show plans that fit your operation.
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
                (plan.backendPlan === "PHASE2A" && me.hasPaidPhase2A)
              }
              onSelect={() => onSelectPlan(plan)}
            />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
          What you get with Plan 2A
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <Rocket className="w-5 h-5 text-red-400" />,
              title: "Full Diagnostic",
              desc: "Pillar-by-pillar Phase 2A analysis with detailed findings.",
            },
            {
              icon: <CircleDot className="w-5 h-5 text-teal-400" />,
              title: "PDF Report",
              desc: "Downloadable, shareable report for your team.",
            },
            {
              icon: <Shield className="w-5 h-5 text-purple-400" />,
              title: "Lifetime Access",
              desc: "One payment unlocks Phase 2A for your account permanently.",
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
          {plan.price} <span className="text-gray-600">/one-time</span>
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
  onChangePlan,
  onPaymentSuccess,
}: {
  plan: PlanCard;
  onChangePlan: () => void;
  onPaymentSuccess: (result: VerifyPaymentResponse) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("Card");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paidRef = useRef(false);

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

      const sessionId = getLastSessionId() ?? undefined;
      const init = await initPayment({
        plan: "PHASE2A",
        amount: PHASE2A_PRICE_NGN,
        sessionId,
      });

      if (init.error || !init.data) {
        setError(init.error?.message ?? "Could not initialize payment");
        setBusy(false);
        return;
      }

      const { accessCode, reference } = init.data;
      if (!accessCode) {
        setError("Payment link is unavailable. Please try again.");
        setBusy(false);
        return;
      }

      sessionStorage.setItem(PENDING_PAYMENT_REFERENCE_KEY, reference);

      const handler = window.PaystackPop.setup({
        accessCode,
        callback: (response) => {
          paidRef.current = true;
          setVerifying(true);
          void (async () => {
            const result = await verifyWithRetry(response.reference);
            sessionStorage.removeItem(PENDING_PAYMENT_REFERENCE_KEY);
            setVerifying(false);
            setBusy(false);
            if (result.ok) {
              onPaymentSuccess(result.data);
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
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
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
            <p className="text-xs text-gray-500 mb-1">Total due now</p>
            <p className="text-3xl font-extrabold text-white mb-3">
              {plan.price}
            </p>
            <button
              onClick={onChangePlan}
              className="text-teal-400 text-sm font-semibold hover:underline"
            >
              Change plan
            </button>
          </div>
        </div>

        <div>
          <div className="flex border-b border-white/10 mb-8">
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
            charge {plan.price} for one-time access to Plan 2A.
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

function SuccessView({
  me,
  plan,
  verifyResult,
}: {
  me: MeUser;
  plan: PlanCard | null;
  verifyResult: VerifyPaymentResponse;
}) {
  const capabilities = [
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
          Plan 2A is now active on your account. Your full diagnostic is ready.
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
                {plan?.price ?? `N${PHASE2A_PRICE_NGN.toLocaleString()}`}
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard/reports"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition"
              >
                Go to Reports <ArrowRight className="w-4 h-4" />
              </Link>
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
