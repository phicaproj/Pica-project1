"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/ThemeContext";
import {
  CheckCircle, BarChart2, Users,
  Zap, Star, Shield, CreditCard, Building2, Lock,
  RefreshCw, ArrowRight, FileText, TrendingUp,
  AlertTriangle, Cpu,
} from "lucide-react";

// ─── Page 1: Layer 03 Intelligence Product Page ─────────────────────────────
function IntelligenceProductPage({
  dark,
  onCheckout,
}: {
  dark: boolean;
  onCheckout: () => void;
}) {
  const d = dark;

  const features = [
    {
      icon: <BarChart2 className="w-5 h-5 text-[#f97316]" />,
      title: "Advanced Analytics Dashboard",
      desc: "Multi-variable projection models and deep data visualization suites.",
    },
    {
      icon: <Users className="w-5 h-5 text-[#f97316]" />,
      title: "Medium: > 10 Employees Focus",
      desc: "Optimized for collaborative environments and team-level intelligence sharing.",
    },
    {
      icon: <Zap className="w-5 h-5 text-[#f97316]" />,
      title: "Real-time market volatility alerts",
      desc: "Millisecond notification latency for global market shifts and indicators.",
    },
    {
      icon: <Star className="w-5 h-5 text-[#f97316]" />,
      title: "API access for custom CRM",
      desc: "Seamless endpoint integration with enterprise-grade security protocols.",
    },
  ];

  return (
    <div
      className={`min-h-screen ${
        d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* ── Hero ── */}
      <section
        className={`px-4 sm:px-6 md:px-12 py-10 md:py-16 ${
          d ? "bg-[#0d1117]" : "bg-gray-50"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-md border border-[#f97316]/40 text-[#f97316] text-xs font-bold uppercase tracking-widest mb-6">
            Architectural Intelligence Systems
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            Scale Your{" "}
            <span className="text-[#f97316]">Architectural</span>
            <br />
            Vision.
          </h1>
          <p
            className={`text-sm leading-relaxed mb-10 max-w-lg ${
              d ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Precision engineering meets market data. Select the intelligence
            layer that powers your corporate evolution.
          </p>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section
        className={`px-4 sm:px-6 md:px-12 pb-10 md:pb-16 ${
          d ? "bg-[#0d1117]" : "bg-gray-50"
        }`}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
          {/* Left — Plan card */}
          <div
            className={`rounded-2xl p-6 md:p-8 border ${
              d
                ? "bg-[#161b22] border-white/10"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2
                  className={`text-xl md:text-2xl font-extrabold mb-1 ${
                    d ? "text-white" : "text-gray-900"
                  }`}
                >
                  Layer 03: Intelligence
                </h2>
                <p
                  className={`text-xs ${
                    d ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Engineered for medium-scale operations
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl md:text-3xl font-extrabold ${
                    d ? "text-white" : "text-gray-900"
                  }`}
                >
                  $1,200
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-[#f97316]">
                  Yearly Billing
                </p>
              </div>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              {features.map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{icon}</div>
                  <div>
                    <p
                      className={`text-sm font-bold mb-1 ${
                        d ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {title}
                    </p>
                    <p
                      className={`text-xs leading-relaxed ${
                        d ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={onCheckout}
              className="w-full sm:w-auto px-12 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-extrabold uppercase tracking-widest transition"
            >
              Contact Expert
            </button>
          </div>

          {/* Right — Image + Testimonial */}
          <div className="space-y-6">
            <div
              className={`rounded-2xl overflow-hidden relative ${
                d ? "bg-[#161b22]" : "bg-gray-200"
              }`}
              style={{ minHeight: "320px" }}
            >
              <Image
                src="/images/assessques.png"
                alt="Intelligence at Scale"
                width={500}
                height={320}
                className="w-full h-full object-cover"
              />
              <div
                className={`absolute bottom-0 left-0 right-0 p-5 ${
                  d
                    ? "bg-gradient-to-t from-[#0d1117] to-transparent"
                    : "bg-gradient-to-t from-white to-transparent"
                }`}
              >
                <p
                  className={`text-lg font-bold ${
                    d ? "text-white" : "text-gray-900"
                  }`}
                >
                  Intelligence at Scale
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-[#f97316]">
                  Expert Strategy
                </p>
              </div>
            </div>

            {/* Testimonial card */}
            <div
              className={`rounded-2xl p-6 border ${
                d
                  ? "bg-[#161b22] border-white/10"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-[#00ffaa]" />
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${
                    d ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Enterprise Integrity
                </p>
              </div>
              <p
                className={`text-sm leading-relaxed mb-5 ${
                  d ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Layer 03 includes dedicated success management and 24/7
                technical surveillance to ensure your API uptime never drops
                below 99.99%.
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    d ? "bg-gray-600" : "bg-gray-300"
                  }`}
                >
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p
                    className={`text-sm font-bold ${
                      d ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Marcus Vance
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#f97316]">
                    Chief Systems Architect, Global AI
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Refined Section ── */}
      <section
        className={`px-4 sm:px-6 md:px-12 py-10 md:py-16 ${
          d ? "bg-[#0d1117]" : "bg-white"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className={`text-2xl md:text-3xl font-extrabold leading-tight mb-4 ${
              d ? "text-white" : "text-gray-900"
            }`}
          >
            Refined For Professional
            <br />
            Precision.
          </h2>
          <div className="w-10 h-1 bg-[#00ffaa] rounded-full mb-6" />
          <p
            className={`text-sm leading-relaxed max-w-md ${
              d ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Every data point within the Intelligence 2B ecosystem is scrubbed
            for noise and verified through our proprietary Tier-4 security
            protocols.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className={`px-4 sm:px-6 md:px-8 py-8 border-t ${
          d
            ? "bg-[#0d1117] border-white/10"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p
              className={`text-sm font-extrabold ${
                d ? "text-white" : "text-gray-900"
              }`}
            >
              Intelligence 2B
            </p>
            <p
              className={`text-xs ${
                d ? "text-gray-500" : "text-gray-400"
              }`}
            >
              © 2024 Intelligence 2B. Engineered for Architectural
              Intelligence.
            </p>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            {["Privacy", "Terms", "API", "Status"].map((item) => (
              <Link
                key={item}
                href="#"
                className={`text-xs font-semibold uppercase tracking-wider transition hover:opacity-70 ${
                  d ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Page 2: Checkout ──────────────────────────────────────────────────────────
type PaymentMethod = "credit" | "bank" | "opay" | "paystack";

function IntelligenceCheckoutPage({
  dark,
  onSuccess,
}: {
  dark: boolean;
  onSuccess: () => void;
}) {
  const d = dark;
  const [method, setMethod] = useState<PaymentMethod>("credit");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const formatCard = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4);
    return clean.length > 2
      ? `${clean.slice(0, 2)} / ${clean.slice(2)}`
      : clean;
  };

  const methodTabs: {
    key: PaymentMethod;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "credit",
      label: "Credit Card",
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      key: "bank",
      label: "Bank Transfer",
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      key: "opay",
      label: "OPay",
      icon: <span className="text-xs font-bold">O</span>,
    },
    {
      key: "paystack",
      label: "Paystack",
      icon: <span className="text-xs font-bold">P</span>,
    },
  ];

  const features = [
    {
      title: "Advanced Analytics Dashboard",
      desc: "Full access to proprietary L03 terminal interface.",
    },
    {
      title: "Medium Business Focus",
      desc: "Optimized for organizations with >10 employees.",
    },
    {
      title: "Real-time market volatility alerts",
      desc: "High-frequency monitoring of Tier 1 assets.",
    },
    {
      title: "API access for custom CRM",
      desc: "Full REST API documentation and sandbox access.",
    },
  ];

  return (
    <div
      className={`min-h-screen ${
        d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
        {/* Left — Plan summary */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#00ffaa] mb-4">
            Selected Subscription
          </p>
          <h1
            className={`text-2xl md:text-4xl font-extrabold leading-tight mb-3 ${
              d ? "text-white" : "text-gray-900"
            }`}
          >
            Layer 03
            <br />
            Intelligence
          </h1>
          <div className="mb-8">
            <span className="text-2xl md:text-4xl font-extrabold text-[#00ffaa]">
              $1,200
            </span>
            <span
              className={`text-sm ml-2 ${
                d ? "text-gray-400" : "text-gray-500"
              }`}
            >
              / yearly
            </span>
          </div>

          <div className="space-y-5">
            {features.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00ffaa]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-[#00ffaa]" />
                </div>
                <div>
                  <p
                    className={`text-sm font-bold ${
                      d ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {title}
                  </p>
                  <p
                    className={`text-xs leading-relaxed ${
                      d ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Payment form */}
        <div
          className={`rounded-2xl p-8 border ${
            d
              ? "bg-[#161b22] border-white/10"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <h2
            className={`text-xl font-bold mb-1 ${
              d ? "text-white" : "text-gray-900"
            }`}
          >
            Secure Payment
          </h2>
          <p
            className={`text-xs mb-6 ${
              d ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Select your preferred method and complete the transaction.
          </p>

          {/* Payment method tabs */}
          <div
            className={`flex rounded-xl overflow-hidden border mb-6 ${
              d
                ? "border-white/10 bg-[#0d1117]"
                : "border-gray-200 bg-white"
            }`}
          >
            {methodTabs.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setMethod(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition ${
                  method === key
                    ? d
                      ? "bg-[#243044] text-white"
                      : "bg-white text-gray-900 shadow"
                    : d
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {method === "credit" && (
            <div className="space-y-4">
              {/* Cardholder Name */}
              <div>
                <label
                  className={`text-xs font-bold uppercase tracking-widest block mb-2 ${
                    d ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="ALEXANDER VANE"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                    d
                      ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50"
                      : "bg-white border-gray-200 text-gray-900 focus:border-teal-400"
                  }`}
                />
              </div>
              {/* Card Number */}
              <div>
                <label
                  className={`text-xs font-bold uppercase tracking-widest block mb-2 ${
                    d ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(formatCard(e.target.value))
                    }
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition pr-12 ${
                      d
                        ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50"
                        : "bg-white border-gray-200 text-gray-900 focus:border-teal-400"
                    }`}
                  />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>
              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`text-xs font-bold uppercase tracking-widest block mb-2 ${
                      d ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    value={expiry}
                    onChange={(e) =>
                      setExpiry(formatExpiry(e.target.value))
                    }
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                      d
                        ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50"
                        : "bg-white border-gray-200 text-gray-900 focus:border-teal-400"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`text-xs font-bold uppercase tracking-widest block mb-2 ${
                      d ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    CVC / CVV
                  </label>
                  <input
                    type="text"
                    placeholder="•••"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) =>
                      setCvv(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                      d
                        ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50"
                        : "bg-white border-gray-200 text-gray-900 focus:border-teal-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {(method === "bank" ||
            method === "opay" ||
            method === "paystack") && (
            <div
              className={`rounded-xl p-6 text-center border ${
                d
                  ? "border-white/10 bg-[#0d1117]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <p
                className={`text-sm ${
                  d ? "text-gray-400" : "text-gray-600"
                }`}
              >
                You will be redirected to complete payment via{" "}
                <span className="font-bold text-[#00ffaa]">
                  {method === "bank"
                    ? "Bank Transfer"
                    : method === "opay"
                    ? "OPay"
                    : "Paystack"}
                </span>
                .
              </p>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={onSuccess}
            className="w-full py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-extrabold uppercase tracking-widest transition mt-6"
          >
            Confirm &amp; Authorize Payment
          </button>

          <div
            className={`flex items-center justify-center gap-2 mt-3 text-xs ${
              d ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <Lock className="w-3 h-3" /> Secure Encrypted Payment
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              {
                icon: <Shield className="w-5 h-5 text-blue-400" />,
                label: "PCI DSS\nCompliant",
              },
              {
                icon: (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ),
                label: "Verified\nSecure",
              },
              {
                icon: (
                  <RefreshCw className="w-5 h-5 text-orange-400" />
                ),
                label: "No Hassle\nRefund",
              },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl ${
                  d
                    ? "bg-[#0d1117] border border-white/10"
                    : "bg-white border border-gray-200"
                }`}
              >
                {icon}
                <p
                  className={`text-[10px] font-semibold text-center uppercase tracking-wider whitespace-pre-line ${
                    d ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className={`px-4 sm:px-6 md:px-8 py-6 border-t ${
          d
            ? "bg-[#0d1117] border-white/10"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className={`text-xs ${
              d ? "text-gray-500" : "text-gray-400"
            }`}
          >
            © 2024 PICA Clinical Architect. Secure Encrypted Payment.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Security Standards"].map(
              (item) => (
                <Link
                  key={item}
                  href="#"
                  className={`text-xs hover:opacity-70 transition ${
                    d ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {item}
                </Link>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Page 3: Payment Success ───────────────────────────────────────────────────
function IntelligenceSuccessPage({ dark }: { dark: boolean }) {
  const d = dark;

  const capabilities = [
    {
      icon: <BarChart2 className="w-5 h-5 text-[#f97316]" />,
      title: "Advanced Analytics Dashboard",
      desc: "Deep-tier predictive modeling and visualization tools.",
    },
    {
      icon: <Users className="w-5 h-5 text-[#f97316]" />,
      title: "Medium Business Focus",
      desc: "Optimized for organizations with 10-50 employees.",
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-[#f97316]" />,
      title: "Market Volatility Alerts",
      desc: "Real-time SMS and API triggers for market shifts.",
    },
    {
      icon: <Cpu className="w-5 h-5 text-[#f97316]" />,
      title: "API Access for CRM",
      desc: "Custom endpoints for seamless system integration.",
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col ${
        d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 md:px-8 py-16">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-[#00ffaa] flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-gray-900" />
        </div>

        <h1
          className={`text-3xl md:text-5xl font-extrabold mb-4 text-center ${
            d ? "text-white" : "text-gray-900"
          }`}
        >
          Payment Successful.
        </h1>
        <p
          className={`text-base text-center mb-12 max-w-lg ${
            d ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Your intelligence unit is now fully operational. We have activated
          your $1,200 yearly Intelligence 2B plan.
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Transaction Details */}
          <div
            className={`rounded-2xl p-8 border ${
              d
                ? "bg-[#161b22] border-white/10"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#00ffaa]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#00ffaa]">
                Transaction Details
              </p>
            </div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p
                  className={`text-[10px] uppercase tracking-widest mb-1 ${
                    d ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Product Tier
                </p>
                <p
                  className={`text-xl font-bold ${
                    d ? "text-white" : "text-gray-900"
                  }`}
                >
                  Intelligence 2B
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-[10px] uppercase tracking-widest mb-1 ${
                    d ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Billing Cycle
                </p>
                <p
                  className={`text-xl font-bold ${
                    d ? "text-white" : "text-gray-900"
                  }`}
                >
                  Yearly (Layer 03)
                </p>
              </div>
            </div>

            <div
              className={`border-t pt-6 mb-8 ${
                d ? "border-white/10" : "border-gray-200"
              }`}
            >
              <p
                className={`text-xs mb-1 ${
                  d ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Total Amount Processed
              </p>
              <p
                className={`text-xs mb-1 ${
                  d ? "text-gray-600" : "text-gray-400"
                }`}
              >
                Including all applicable institutional taxes
              </p>
              <p className="text-3xl font-extrabold text-[#00ffaa]">
                $1,200.00
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition ${
                  d
                    ? "border-white/10 text-white hover:bg-white/5"
                    : "border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                View Receipt
              </button>
            </div>
          </div>

          {/* Intelligence Tier Capabilities */}
          <div
            className={`rounded-2xl p-8 border ${
              d
                ? "bg-[#1a2010] border-[#00ffaa]/20"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-4 h-4 text-[#f97316]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#f97316]">
                Intelligence Tier Capabilities
              </p>
            </div>
            <div className="space-y-5 mb-8">
              {capabilities.map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{icon}</div>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        d ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {title}
                    </p>
                    <p
                      className={`text-xs ${
                        d ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p
              className={`text-xs leading-relaxed rounded-xl p-4 ${
                d
                  ? "bg-[#0d1117]/50 text-gray-500"
                  : "bg-green-100 text-gray-500"
              }`}
            >
              All analytical models for Intelligence 2B are now recalibrating
              based on your profile. First institutional report delivery
              expected within 4 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className={`px-4 sm:px-6 md:px-8 py-6 border-t ${
          d
            ? "bg-[#0d1117] border-white/10"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <p
              className={`text-sm font-extrabold ${
                d ? "text-white" : "text-gray-900"
              }`}
            >
              Pica Obsidian
            </p>
            <p
              className={`text-xs ${
                d ? "text-gray-500" : "text-gray-400"
              }`}
            >
              © 2024 Intelligence Unit. Institutional Access.
            </p>
          </div>
          <div className="flex items-center gap-8">
            {["Privacy", "Terms", "Audit", "Support"].map((item) => (
              <Link
                key={item}
                href="#"
                className={`text-xs font-semibold uppercase tracking-wider hover:opacity-70 transition ${
                  d ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function PicaFullDiagnosticFlow() {
  const { dark, setDark } = useTheme();
  const [screen, setScreen] = useState<"product" | "checkout" | "success">(
    "product"
  );

  if (screen === "product")
    return (
      <IntelligenceProductPage
        dark={dark}
        onCheckout={() => setScreen("checkout")}
      />
    );
  if (screen === "checkout")
    return (
      <IntelligenceCheckoutPage
        dark={dark}
        onSuccess={() => setScreen("success")}
      />
    );
  if (screen === "success") return <IntelligenceSuccessPage dark={dark} />;
  return null;
}
