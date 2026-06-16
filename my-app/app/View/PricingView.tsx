"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import { CheckCircle, Globe, Loader, Shield } from "lucide-react";
import { getPublicPricing, type PublicPricingResponse } from "@/lib/authClient";
import { formatMoney } from "@/lib/utils";

// Anonymous landing page — there's no logged-in user to derive a country from,
// so we default to USD here. Once a country picker lands (see todo I/H), feed
// its value to resolveDisplayCurrency() and convert via usdToNgn.

export default function PricingPage() {
  const { dark } = useTheme();
  const [scale, setScale] = useState<"Small Business" | "Medium Business">("Small Business");
  const [pricing, setPricing] = useState<PublicPricingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const d = dark;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getPublicPricing();
      if (cancelled) return;
      if (res.error || !res.data) {
        setError(res.error?.message ?? "Could not load pricing.");
      } else {
        setPricing(res.data);
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

  return (
    <div className={`min-h-screen ${d ? "bg-[#111111] text-white" : "bg-white text-gray-900"}`}>
      <section className={`px-4 sm:px-6 md:px-8 py-10 md:py-16 ${d ? "bg-[#111111]" : "bg-gray-50"}`}>
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-md border border-white/20 text-xs font-semibold uppercase tracking-widest text-gray-300 mb-6">
            Strategic Intelligence
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 max-w-xl mx-auto">
            Architectural Pricing for<br />
            <span className="text-[#00ffaa]">African Enterprise.</span>
          </h1>
          <p className={`text-sm leading-relaxed mb-8 max-w-lg mx-auto ${d ? "text-gray-400" : "text-gray-600"}`}>
            Choose a framework designed to scale with your organizational complexity. Pricing is served from the platform backend.
          </p>

          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Organization Scale</p>
            <div className="flex items-center gap-2">
              {(["Small Business", "Medium Business"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition ${
                    scale === s
                      ? d ? "bg-white/10 border-white/30 text-white" : "bg-gray-900 border-gray-900 text-white"
                      : d ? "border-white/10 text-gray-400 hover:border-white/20" : "border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {s}
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

          {payPerUseActive ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start">
              <div className={`rounded-2xl p-8 border ${d ? "bg-[#1a2535] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Layer 01</p>
                <h3 className={`text-2xl md:text-3xl font-extrabold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Free Scan</h3>
                <p className="text-3xl md:text-5xl font-extrabold mb-6">{formatMoney(0, "USD")}</p>
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

              <div className="rounded-2xl p-8 bg-[#2a3f2a] border border-[#00ffaa]/30 relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00ffaa] text-gray-900 text-xs font-extrabold px-4 py-1 rounded-full uppercase tracking-wider">
                  Most Selected
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Layer 02</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4">Plan 2A Full Diagnostic</h3>
                <p className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                  {formatMoney(phase2A?.price, phase2A?.currency ?? "USD")}
                </p>
                <ul className="space-y-3 mb-8">
                  {["Deep-dive structural audit", "Pillar-by-pillar findings", "Detailed Insight PDF Package"].map((item) => (
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
                <ul className="space-y-3 mb-8">
                  {["Targeted pillar modules", "Granular scoring", "Actionable insights per pillar"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-[#00ffaa] flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/deep-dive" className={`block w-full py-3.5 rounded-xl text-sm font-bold border transition text-center ${d ? "bg-[#1a2010] border-white/10 text-white hover:bg-white/5" : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"}`}>
                  Choose Module
                </Link>
              </div>
            </div>
          ) : (
            // Section F — pay-per-use turned off by admin. If subscription is
            // still live, point users at the monthly plans; otherwise the BE
            // invariant prevents both being off so this branch never renders
            // alone.
            <div className={`rounded-2xl p-8 md:p-12 text-center border ${d ? "bg-[#1a2535] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
              <h3 className={`text-2xl md:text-3xl font-extrabold mb-3 ${d ? "text-white" : "text-gray-900"}`}>
                One-off purchases paused
              </h3>
              <p className={`text-sm md:text-base mb-6 max-w-xl mx-auto ${d ? "text-gray-400" : "text-gray-600"}`}>
                Pay-per-use checkout is currently disabled.
                {subscriptionActive
                  ? " Subscribe to a monthly plan to unlock all diagnostics."
                  : " Please check back later."}
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
        </div>
      </section>

      <section className={`px-4 sm:px-6 md:px-8 py-10 md:py-16 ${d ? "bg-[#111111]" : "bg-white"}`}>
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
