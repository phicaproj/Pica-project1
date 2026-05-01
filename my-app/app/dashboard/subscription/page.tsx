"use client";

import { useState } from "react";
import {
  Check,
  Lock,
  Rocket,
  Shield,
  Users,
  CircleDot,
  CreditCard,
  Building2,
  Landmark,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

type View = "plans" | "checkout";

export default function SubscriptionPage() {
  const [view, setView] = useState<View>("plans");

  const goToCheckout = () => setView("checkout");
  const goToPlans = () => setView("plans");

  if (view === "checkout") {
    return <CheckoutView onChangePlan={goToPlans} />;
  }

  return <ChoosePlanView onSelectPlan={goToCheckout} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATE 1 — CHOOSE PLAN
   ═══════════════════════════════════════════════════════════════════════════ */

function ChoosePlanView({ onSelectPlan }: { onSelectPlan: () => void }) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-20">
      {/* ── Hero ── */}
      <section className="text-center px-4 pt-16 pb-12 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
          Celestial Intelligence{" "}
          <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
            Architected for Growth.
          </span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
          Choose the structural framework that aligns with your business
          trajectory. High-performance models powered by the PICA engine.
        </p>
      </section>

      {/* ── Small Business ── */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-orange-400 mb-1">
            Small Business
          </h2>
          <p className="text-gray-500 text-sm">
            Precision tools for emerging enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Foundation */}
          <PricingCard
            tier="FOUNDATION"
            name="Free"
            price="$0"
            features={[
              "3 Core Architecture Nodes",
              "Standard Kinetic Compute",
              "Advanced Data Visualization",
            ]}
            buttonLabel="Deploy Now"
            buttonVariant="outlined"
            onSelect={onSelectPlan}
          />

          {/* Accelerator */}
          <PricingCard
            tier="ACCELERATOR"
            name="2A"
            price="$49"
            features={[
              "12 Core Architecture Nodes",
              "Enhanced Kinetic Flow",
              "Custom Domain Mapping",
            ]}
            buttonLabel="Begin Integration"
            buttonVariant="filled"
            recommended
            onSelect={onSelectPlan}
          />

          {/* Optimization */}
          <PricingCard
            tier="OPTIMIZATION"
            name="2B"
            price="$129"
            features={[
              "50 Core Architecture Nodes",
              "Full Spectrum Analytics",
              "Priority Signal Support",
            ]}
            buttonLabel="Get Started"
            buttonVariant="outlined"
            onSelect={onSelectPlan}
          />
        </div>
      </section>

      {/* ── Medium Business ── */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-orange-400 mb-1">
            Medium Business
          </h2>
          <p className="text-gray-500 text-sm">
            Expansive power for scaling infrastructures.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Free Trial card */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Free Trial</h3>
              <p className="text-gray-400 text-sm mb-6">
                14-day full spectrum access for teams.
              </p>
              {/* Decorative pattern placeholder */}
              <div className="w-full h-32 rounded-lg bg-gradient-to-br from-[#1a2332] to-[#0d1117] border border-white/5 mb-6" />
            </div>
            <button
              onClick={onSelectPlan}
              className="w-full py-3 rounded-xl text-sm font-semibold border border-white/20 text-white hover:bg-white/5 transition"
            >
              Claim Trial
            </button>
          </div>

          {/* Plan 2A center */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider mb-4">
                High Performance
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                Plan 2A
              </h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                The standard for medium enterprises requiring rapid iterative
                intelligence and deep-stack integration.
              </p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                $399{" "}
                <span className="text-sm font-normal text-gray-500">
                  /month
                </span>
              </p>
              <p className="text-xs bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent font-semibold">
                Billed annually at $4,788
              </p>
            </div>
          </div>

          {/* Core Capabilities */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                Core Capabilities
              </p>
              <ul className="space-y-4 mb-6">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Rocket className="w-4 h-4 text-red-400 flex-shrink-0" />
                  Unlimited Architecture Drafting
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <CircleDot className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  Dedicated Tier 1 Kinetic Compute
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Shield className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  Quantum-Ready Security Layer
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <Users className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  Team Collaboration (Up to 50)
                </li>
              </ul>
            </div>
            <button
              onClick={onSelectPlan}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
            >
              Deploy Enterprise 2A
            </button>
          </div>
        </div>
      </section>

      {/* ── Plan 2B Banner ── */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              Plan 2B:{" "}
              <span className="text-gray-300">The Architect Sovereign</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ultimate performance for global entities. Custom nodes, zero
              latency, and 24/7 dedicated celestial support.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-2xl font-extrabold text-white">$899 /mo</p>
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                Custom Nodes Included
              </p>
            </div>
            <button
              onClick={onSelectPlan}
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-teal-400 text-teal-400 hover:bg-teal-400/10 transition whitespace-nowrap"
            >
              Configure 2B
            </button>
          </div>
        </div>
      </section>

      {/* ── Deep Feature Spectrum ── */}
      <section className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
          Deep Feature Spectrum
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold bg-[#111827] rounded-tl-xl border border-white/5">
                  Feature
                </th>
                <th className="py-3 px-4 text-center font-semibold bg-gray-700/50 text-gray-300 border border-white/5">
                  Free
                </th>
                <th className="py-3 px-4 text-center font-semibold bg-orange-500/20 text-orange-400 border border-white/5">
                  Plan 2A
                </th>
                <th className="py-3 px-4 text-center font-semibold bg-teal-500/20 text-teal-400 rounded-tr-xl border border-white/5">
                  Plan 2B
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#111827]">
              {[
                ["Kinetic Power", "Standard", "Accelerated", "Prime Kinetic"],
                ["Compute Cycles", "Shared", "Dedicated (S)", "Dedicated (L)"],
                ["Node Capacity", "3 Units", "12-50 Units", "50-500 Units"],
                [
                  "Architect Support",
                  "Community",
                  "Priority",
                  "Concierge",
                ],
              ].map(([feature, free, a, b], i, arr) => (
                <tr
                  key={feature}
                  className="border-t border-white/5 hover:bg-white/[0.02] transition"
                >
                  <td
                    className={`py-3.5 px-4 text-gray-300 font-medium border border-white/5 ${
                      i === arr.length - 1 ? "rounded-bl-xl" : ""
                    }`}
                  >
                    {feature}
                  </td>
                  <td className="py-3.5 px-4 text-center text-gray-400 border border-white/5">
                    {free}
                  </td>
                  <td className="py-3.5 px-4 text-center text-orange-300 border border-white/5">
                    {a}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-center text-teal-300 border border-white/5 ${
                      i === arr.length - 1 ? "rounded-br-xl" : ""
                    }`}
                  >
                    {b}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ── Small Business Pricing Card ── */

function PricingCard({
  tier,
  name,
  price,
  features,
  buttonLabel,
  buttonVariant,
  recommended,
  onSelect,
}: {
  tier: string;
  name: string;
  price: string;
  features: string[];
  buttonLabel: string;
  buttonVariant: "filled" | "outlined";
  recommended?: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`relative bg-[#111827] border rounded-xl p-6 flex flex-col justify-between ${
        recommended ? "border-orange-500/40" : "border-white/5"
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">
          Recommended
        </div>
      )}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
          {tier}
        </p>
        <h3 className="text-3xl font-extrabold text-white mb-1">{name}</h3>
        <p className="text-gray-400 text-sm mb-6">
          {price}{" "}
          <span className="text-gray-600">/month</span>
        </p>
        <ul className="space-y-3 mb-8">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
          buttonVariant === "filled"
            ? "bg-orange-500 hover:bg-orange-600 text-white"
            : "border border-white/20 text-white hover:bg-white/5"
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATE 2 — SECURE CHECKOUT
   ═══════════════════════════════════════════════════════════════════════════ */

function CheckoutView({ onChangePlan }: { onChangePlan: () => void }) {
  const [activeTab, setActiveTab] = useState<string>("Card");

  const tabs = [
    { label: "Card", icon: <CreditCard className="w-4 h-4" /> },
    { label: "Transfer", icon: <Building2 className="w-4 h-4" /> },
    { label: "Opay", icon: <Landmark className="w-4 h-4" /> },
    { label: "Paystack", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* ── Left Column ── */}
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            Complete your{" "}
            <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
              ascension.
            </span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base mb-10 max-w-md">
            Secure your access to the Celestial Architect&apos;s full suite of
            precision tools.
          </p>

          {/* Plan summary card */}
          <div className="rounded-xl bg-gradient-to-br from-teal-900/60 to-[#111827] border border-teal-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                Selected Plan
              </p>
              <span className="px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase">
                Annual
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-4">
              Architect Pro
            </h3>
            <ul className="space-y-2.5 mb-6">
              {[
                "Unlimited generative workspaces",
                "Priority neural processing",
                "24/7 Celestial Support",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-gray-300"
                >
                  <Check className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mb-1">Billed yearly</p>
            <p className="text-3xl font-extrabold text-white mb-3">
              $499{" "}
              <span className="text-sm font-normal text-gray-500">/yr</span>
            </p>
            <button
              onClick={onChangePlan}
              className="text-teal-400 text-sm font-semibold hover:underline"
            >
              Change plan
            </button>
          </div>
        </div>

        {/* ── Right Column — Payment Form ── */}
        <div>
          {/* Tabs */}
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

          {/* Form */}
          <div className="space-y-6">
            {/* Cardholder Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="THE CELESTIAL ARCHITECT"
                className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4021"
                  className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition pr-24"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                    VISA
                  </span>
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">
                    MC
                  </span>
                </div>
              </div>
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  CVV
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="&bull;&bull;&bull;"
                    className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition pr-10"
                  />
                  <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition flex items-center justify-center gap-2">
              Complete Payment <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-gray-600 leading-relaxed">
              By clicking complete payment, you authorize PICA to charge your
              card for this and future payments in accordance with our terms.
            </p>
          </div>
        </div>
      </div>

      {/* ── Security Badges ── */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="rounded-xl bg-[#111827] border border-white/5 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Lock className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">
                Encryption Active
              </p>
              <p className="text-xs text-gray-500">
                Your transaction is protected by 256-bit AES protocol.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              Verified Visa
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
              Mastercard ID Check
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
              PCI-DSS Level 1
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
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
          <span className="hover:text-gray-400 cursor-pointer transition">
            STATUS
          </span>
        </div>
        <span>&copy; 2024 PICA. THE CELESTIAL ARCHITECT.</span>
      </footer>
    </div>
  );
}
