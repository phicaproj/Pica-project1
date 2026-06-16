"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import { Check, CheckCircle, Globe, Loader, Shield, Sparkles } from "lucide-react";
import {
  getPublicPricing,
  getSubscriptionPlans,
  type PublicPricingResponse,
  type SubscriptionPlanPublic,
} from "@/lib/authClient";
import { formatMoney } from "@/lib/utils";

// Anonymous landing page — there's no logged-in user to derive a country from,
// so prices stay in USD by design. Logged-in dashboards convert via
// resolveDisplayCurrency(me.country) once the user signs up.

type PricingMode = "payPerUse" | "subscription";

// Quota row helper — mirrors the QuotaLine on dashboard/plans so logged-in
// and logged-out subscription cards look the same. Theme-aware because the
// public pricing page supports the dark/light toggle while the dashboard
// version is always dark.
function QuotaLine({ count, label, dark }: { count: number; label: string; dark: boolean }) {
  return (
    <li className={`flex items-start gap-2 text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>
      <Sparkles className="w-4 h-4 text-[#f97316] flex-shrink-0 mt-0.5" />
      <span>
        <span className={`font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{count}</span>{" "}
        {label} per month
      </span>
    </li>
  );
}

export default function PricingPage() {
  const { dark } = useTheme();
  const [pricing, setPricing] = useState<PublicPricingResponse | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PricingMode>("payPerUse");
  const d = dark;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Both endpoints are independent reads; fetch in parallel so the
      // single loading state covers them.
      const [pricingRes, plansRes] = await Promise.all([
        getPublicPricing(),
        getSubscriptionPlans(),
      ]);
      if (cancelled) return;
      if (pricingRes.error || !pricingRes.data) {
        setError(pricingRes.error?.message ?? "Could not load pricing.");
      } else {
        setPricing(pricingRes.data);
      }
      // Subscription plans are optional — if the admin paused the section
      // we'll just hide the toggle button. Don't block the whole page on
      // a plans-endpoint failure.
      if (!plansRes.error && plansRes.data) {
        setPlans(plansRes.data.plans);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const phase2A = pricing?.phase2A ?? null;
  const phase2BPrices = pricing?.phase2B ?? [];
  const phase2BFrom =
    phase2BPrices.length > 0
      ? Math.min(...phase2BPrices.map((row) => row.price))
      : null;
  // Section F — storefront on/off toggles. Default to "both live" so the page
  // renders normally during the initial fetch and any pre-toggle deploys
  // continue to work.
  const payPerUseActive = pricing?.sections?.payPerUse ?? true;
  const subscriptionActive = pricing?.sections?.subscription ?? true;

  // Auto-flip the initial mode if pay-per-use is paused but subscription
  // is live — landing on a paused section would be a dead end.
  useEffect(() => {
    if (!loading && !payPerUseActive && subscriptionActive) {
      setMode("subscription");
    }
  }, [loading, payPerUseActive, subscriptionActive]);

  const sortedPlans = [...plans].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.tier - b.tier,
  );

  return (
    <div className={`min-h-screen ${d ? "bg-[#111111] text-white" : "bg-white text-gray-900"}`}>
      {/* Hero — no min-h-screen / justify-center anywhere. The hero block on
          this page is short (headline + subtitle + 2 toggle buttons), so
          centering inside one full viewport left a large empty band before
          the pricing cards below on mobile AND desktop. Natural top-anchored
          flow with breathing-room padding solves both. (HomeView keeps the
          full-viewport centering because its hero is tall enough to fill it.) */}
      <section className={`px-4 sm:px-6 md:px-8 pt-6 pb-8 md:pt-12 md:pb-12 ${d ? "bg-[#111111]" : "bg-gray-50"}`}>
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-md border border-white/20 text-xs font-semibold uppercase tracking-widest text-gray-300 mb-4 md:mb-6">
            Strategic Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-tight mb-3 md:mb-4 max-w-xl mx-auto">
            Architectural Pricing for<br />
            <span className="text-[#00ffaa]">African Enterprise.</span>
          </h1>
          <p className={`text-sm leading-relaxed mb-6 md:mb-8 max-w-lg mx-auto ${d ? "text-gray-400" : "text-gray-600"}`}>
            Choose a framework designed to scale with your organizational complexity. Pricing is served from the platform backend.
          </p>

          {/* Section I — Pay Per Use / Subscription Plan toggle. A button is
              disabled (and visually muted) when its corresponding section
              has been paused by the admin so the user can't land on an
              empty grid. */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Pricing Model</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {([
                { value: "payPerUse" as const, label: "Pay Per Use", available: payPerUseActive },
                { value: "subscription" as const, label: "Subscription Plan", available: subscriptionActive },
              ]).map(({ value, label, available }) => (
                <button
                  key={value}
                  onClick={() => available && setMode(value)}
                  disabled={!available}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition ${
                    !available
                      ? d ? "border-white/5 text-gray-600 cursor-not-allowed" : "border-gray-200 text-gray-400 cursor-not-allowed"
                      : mode === value
                        ? d ? "bg-white/10 border-white/30 text-white" : "bg-gray-900 border-gray-900 text-white"
                        : d ? "border-white/10 text-gray-400 hover:border-white/20" : "border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {label}{!available ? " (paused)" : ""}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`px-4 sm:px-6 md:px-8 pb-20 ${d ? "bg-[#111111]" : "bg-gray-50"}`}>
        <div className="max-w-6xl mx-auto">
          {loading && (
            <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader className="w-4 h-4 animate-spin" /> Loading pricing
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Section I — Pay Per Use card grid. Only renders in payPerUse
              mode; the subscription mode below has its own grid. */}
          {mode === "payPerUse" && (
          <>
          {/* Free Scan is a lead magnet, not a paid product — it always
              renders regardless of the pay-per-use toggle. When pay-per-use
              is live we keep the original 3-card grid; when it's paused
              Free Scan sits alone above a "paid plans paused" callout. */}
          <div
            className={`grid grid-cols-1 ${
              payPerUseActive ? "md:grid-cols-2 lg:grid-cols-3" : ""
            } gap-4 md:gap-6 items-start`}
          >
            <div className={`rounded-2xl p-8 border ${d ? "bg-[#1a2535] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Layer 01</p>
              <h3 className={`text-2xl md:text-3xl font-extrabold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Free Scan</h3>
              <p className="text-3xl md:text-5xl font-extrabold mb-6">{formatMoney(0, "USD")}</p>
              {/* Free Scan is a fixed lead-magnet, not an admin-priced row, so
                  its bullets stay hardcoded here — they describe the product
                  shape, not a configurable price tier. */}
              <ul className="space-y-3 mb-10">
                {["Core business health check", "Phase 1 quick scan", "Basic PDF Performance Summary"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-[#00ffaa] flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <Link href="/pages/freescan" className={`block w-full py-3.5 rounded-xl text-sm font-semibold border transition text-center ${d ? "border-white/20 text-white hover:bg-white/5" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
                Start Scanning
              </Link>
            </div>

            {payPerUseActive ? (
              <>
                <div className="rounded-2xl p-8 bg-[#2a3f2a] border border-[#00ffaa]/30 relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00ffaa] text-gray-900 text-xs font-extrabold px-4 py-1 rounded-full uppercase tracking-wider">
                    Most Selected
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Layer 02</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4">Plan 2A Full Diagnostic</h3>
                  <p className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                    {formatMoney(phase2A?.price, phase2A?.currency ?? "USD")}
                  </p>
                  {/* Section P — bullets are admin-edited on PlanPrice.features
                      and served via the public pricing endpoint. The fallback
                      mirrors the migration seed so the card never looks
                      broken if an admin manually empties the array. */}
                  <ul className="space-y-3 mb-8">
                    {(phase2A?.features?.length
                      ? phase2A.features
                      : ["Deep-dive structural audit", "Pillar-by-pillar findings", "Detailed Insight PDF Package"]
                    ).map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-[#00ffaa] flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/dashboard/subscription" className="block w-full py-3.5 rounded-xl text-sm font-bold bg-[#f97316] hover:bg-[#ea6c0a] text-white transition text-center">
                    Get Diagnostic
                  </Link>
                </div>

                <div className="rounded-2xl p-8 bg-[#2a3520] border border-[#4a6030]/40">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Layer 03</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4">Plan 2B Deep Dive</h3>
                  <p className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                    {phase2BFrom === null
                      ? "Not configured"
                      : `From ${formatMoney(phase2BFrom, pricing?.currency ?? "USD")}`}
                  </p>
                  {/* Section P — every PHASE2B_PILLAR row carries the same
                      bullets (the admin form edits one pillar at a time but
                      mirrors the list across siblings); render whichever 2B
                      row we have first, then fall back. */}
                  <ul className="space-y-3 mb-8">
                    {(phase2BPrices[0]?.features?.length
                      ? phase2BPrices[0].features
                      : ["Targeted pillar modules", "Granular scoring", "Actionable insights per pillar"]
                    ).map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-[#00ffaa] flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/dashboard/deep-dive" className={`block w-full py-3.5 rounded-xl text-sm font-bold border transition text-center ${d ? "bg-[#1a2010] border-white/10 text-white hover:bg-white/5" : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"}`}>
                    Choose Module
                  </Link>
                </div>
              </>
            ) : null}
          </div>

          {/* Section F — paid pay-per-use cards paused by admin. The Free
              Scan above still renders; this callout replaces the two paid
              cards and points users at subscriptions when they're live.
              The BE invariant guarantees subscriptions are live whenever
              pay-per-use is off, so the callout always has a destination. */}
          {!payPerUseActive && (
            <div className={`mt-6 rounded-2xl p-8 md:p-12 text-center border ${d ? "bg-[#1a2535] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
              <h3 className={`text-2xl md:text-3xl font-extrabold mb-3 ${d ? "text-white" : "text-gray-900"}`}>
                Paid diagnostics paused
              </h3>
              <p className={`text-sm md:text-base mb-6 max-w-xl mx-auto ${d ? "text-gray-400" : "text-gray-600"}`}>
                One-off Plan 2A and Plan 2B purchases are currently disabled.
                {subscriptionActive
                  ? " Subscribe to a monthly plan to unlock all diagnostics, or take the free scan above."
                  : " The free scan above is still available — please check back later for paid diagnostics."}
              </p>
              {subscriptionActive && (
                <Link
                  href="/dashboard/plans"
                  className="inline-block py-3.5 px-8 rounded-xl text-sm font-bold bg-[#f97316] hover:bg-[#ea6c0a] text-white transition"
                >
                  See subscription plans
                </Link>
              )}
            </div>
          )}
          </>
          )}

          {/* Section I — Subscription tier grid. Mirrors the SubscriptionCard
              layout used on /dashboard/plans so logged-in and logged-out
              users see consistent cards. Anonymous CTA points at signup;
              completion of signup lands the user on /dashboard/plans
              where they can actually subscribe. */}
          {mode === "subscription" && (
            subscriptionActive ? (
              sortedPlans.length === 0 ? (
                <div className={`rounded-2xl p-8 md:p-12 text-center border ${d ? "bg-[#1a2535] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                  <p className={`text-sm md:text-base ${d ? "text-gray-400" : "text-gray-600"}`}>
                    No subscription tiers have been configured yet. Please check back soon.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
                  {sortedPlans.map((plan, idx) => {
                    // Middle tier picks up the "Most Popular" badge by
                    // convention — same heuristic the dashboard uses.
                    const recommended = idx === 1 && sortedPlans.length >= 3;
                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-2xl p-6 md:p-8 border flex flex-col justify-between transition ${
                          recommended
                            ? d
                              ? "bg-[#1a2535] border-[#f97316]/40 shadow-lg shadow-[#f97316]/10"
                              : "bg-white border-orange-500/40 shadow-lg shadow-orange-500/10"
                            : d
                              ? "bg-[#1a2535] border-white/10"
                              : "bg-white border-gray-200 shadow-sm"
                        }`}
                      >
                        {recommended && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f97316] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                            Most Popular
                          </div>
                        )}
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${d ? "text-gray-500" : "text-gray-400"}`}>
                            Tier {plan.tier}
                          </p>
                          <h3 className={`text-2xl md:text-3xl font-extrabold mb-1 ${d ? "text-white" : "text-gray-900"}`}>
                            {plan.name}
                          </h3>
                          <p className={`text-sm mb-4 ${d ? "text-gray-400" : "text-gray-500"}`}>
                            <span className={`text-3xl md:text-4xl font-extrabold ${d ? "text-white" : "text-gray-900"}`}>
                              {formatMoney(plan.priceUsd, "USD")}
                            </span>
                            <span className="text-gray-500"> / month</span>
                          </p>
                          {plan.description && (
                            <p className={`text-sm leading-relaxed mb-5 ${d ? "text-gray-400" : "text-gray-600"}`}>
                              {plan.description}
                            </p>
                          )}
                          <ul className="space-y-3 mb-8">
                            <QuotaLine count={plan.phase2aPerMonth} label="Phase 2A diagnostics" dark={d} />
                            <QuotaLine count={plan.phase2bPerMonth} label="Phase 2B deep dives" dark={d} />
                            <QuotaLine count={plan.consultationsPerMonth} label="Expert consultations" dark={d} />
                            {plan.features.map((feature) => (
                              <li key={feature} className={`flex items-start gap-2 text-sm ${d ? "text-gray-300" : "text-gray-700"}`}>
                                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Anonymous CTA — sign up first, then land on the
                            authenticated plans page where Paystack checkout
                            actually fires. */}
                        <Link
                          href="/Auth/signup"
                          className={`block w-full py-3.5 rounded-xl text-sm font-bold transition text-center ${
                            recommended
                              ? "bg-[#f97316] hover:bg-[#ea6c0a] text-white"
                              : d
                                ? "border border-white/20 text-white hover:bg-white/5"
                                : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          Sign up to subscribe
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className={`rounded-2xl p-8 md:p-12 text-center border ${d ? "bg-[#1a2535] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                <h3 className={`text-2xl md:text-3xl font-extrabold mb-3 ${d ? "text-white" : "text-gray-900"}`}>
                  Subscriptions paused
                </h3>
                <p className={`text-sm md:text-base ${d ? "text-gray-400" : "text-gray-600"}`}>
                  Recurring subscriptions are currently unavailable. Please use the Pay Per Use option above.
                </p>
              </div>
            )
          )}
        </div>
      </section>

      <section className={`px-4 sm:px-6 md:px-8 py-8 md:py-12 ${d ? "bg-[#111111]" : "bg-white"}`}>
        <div className="max-w-6xl mx-auto">
          <div className={`rounded-2xl p-5 md:p-10 border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00ffaa] mb-3">The PICA Advantage</p>
                <h2 className={`text-2xl font-bold mb-6 ${d ? "text-white" : "text-gray-900"}`}>
                  Why organizations transition to PICA Intelligence.
                </h2>
                <div className="space-y-5">
                  {[
                    { icon: <Globe className="w-4 h-4 text-[#00ffaa]" />, title: "Pan-African Context", desc: "Our diagnostics account for local market dynamics and operational realities." },
                    { icon: <Shield className="w-4 h-4 text-[#00ffaa]" />, title: "Compliance-First Design", desc: "Governance and risk checks are built into the assessment framework." },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00ffaa]/10 flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>{item.title}</p>
                        <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: "94%", label: "Accuracy in Predictive Scaling" },
                  { value: "12k+", label: "Enterprises Audited" },
                  { value: "<2hr", label: "Assessment Turnaround" },
                  { value: "Tier 4", label: "Data Security Protocols" },
                ].map(({ value, label }) => (
                  <div key={label} className={`rounded-xl p-5 border-l-4 border-[#00ffaa] ${d ? "bg-[#0d1117]" : "bg-white"}`}>
                    <p className={`text-2xl font-extrabold mb-1 ${d ? "text-white" : "text-gray-900"}`}>{value}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={`px-4 sm:px-6 md:px-8 py-8 border-t ${d ? "bg-[#111111] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>PICA</p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-8">
            {["Privacy Policy", "Terms of Service", "Contact Support", "Documentation"].map((item) => (
              <Link key={item} href="#" className={`text-xs transition hover:opacity-70 ${d ? "text-gray-400" : "text-gray-500"}`}>{item}</Link>
            ))}
          </div>
          <p className={`text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>
            (c) 2024 PICA Editorial SaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
