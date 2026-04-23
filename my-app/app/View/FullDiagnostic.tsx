"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sun, Moon, CheckCircle, BarChart2, TrendingUp,
  Shield, FileText, CreditCard, Building2, Lock,
  RefreshCw, ArrowRight,
} from "lucide-react";

// ─── Shared Navbar ─────────────────────────────────────────────────────────────
function Navbar({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const d = dark;
  return (
    <nav className={`flex items-center justify-between px-8 py-1 border-b ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
      <Link href="/" className="flex items-center">
        <Image
          src="/images/logo.png"
          alt="Beauvision"
          width={120}
          height={32}
          className="h-auto"
        />
      </Link>
      <div className="flex items-center gap-8">
        {[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "General Test", href: "/questions" },
          { label: "Product", href: "/product", active: true },
        ].map(({ label, href, active }) => (
          <Link key={label} href={href}
            className={`text-sm font-medium transition ${active ? "text-[#f97316] border-b border-[#f97316] pb-0.5" : d ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
            {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setDark(!d)} className={`p-2 rounded-full transition ${d ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          {d ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link href="/auth/signup" className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#f97316] hover:bg-[#ea6c0a] text-white transition">
          Get Started
        </Link>
      </div>
    </nav>
  );
}

// ─── Page 1: Full Diagnostic ───────────────────────────────────────────────────
function FullDiagnosticPage({ dark, setDark, onCheckout }: { dark: boolean; setDark: (v: boolean) => void; onCheckout: () => void }) {
  const d = dark;

  const features = [
    { icon: <BarChart2 className="w-5 h-5 text-[#00ffaa]" />, title: "Deep-dive structural audit", desc: "Comprehensive vetting of existing codebase, workflows, and resource allocation models." },
    { icon: <TrendingUp className="w-5 h-5 text-[#00ffaa]" />, title: "Growth roadmap (36 mo)", desc: "A multi-year strategic trajectory tailored to your specific market positioning." },
    { icon: <Shield className="w-5 h-5 text-[#00ffaa]" />, title: "Compliance & Risk", desc: "Advanced assessment against international standards and internal risk protocols." },
    { icon: <FileText className="w-5 h-5 text-[#00ffaa]" />, title: "Detailed Insight PDF", desc: "Premium 40-page documentation package with actionable intelligence and charts." },
  ];

  return (
    <div className={`min-h-screen ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>
      <Navbar dark={dark} setDark={setDark} />

      {/* ── Hero ── */}
      <section className={`px-12 py-16 ${d ? "bg-[#0d1117]" : "bg-gray-50"}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-md border border-[#f97316]/40 text-[#f97316] text-xs font-bold uppercase tracking-widest mb-6">
              Full Diagnostic
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">
              Layer 02<br />
              <span className="text-[#f97316]">Full Diagnostic</span>
            </h1>
            <p className={`text-sm leading-relaxed mb-8 max-w-md ${d ? "text-gray-400" : "text-gray-600"}`}>
              A clinical analysis of your architectural infrastructure. We identify bottlenecks, hidden risks, and untapped scalability vectors before they impact your growth.
            </p>
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-white">$249</span>
              <span className={`text-sm ml-2 uppercase tracking-widest ${d ? "text-gray-500" : "text-gray-400"}`}>/ Yearly</span>
            </div>
            <button onClick={onCheckout}
              className="px-8 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition mb-10">
              Get Diagnostic
            </button>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4">
              {features.map(({ icon, title, desc }) => (
                <div key={title} className={`p-5 rounded-2xl border-l-2 border-[#00ffaa] ${d ? "bg-[#161b22]" : "bg-gray-50"}`}>
                  <div className="mb-3">{icon}</div>
                  <p className={`text-sm font-bold mb-1 ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                  <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — image + testimonial */}
          <div className="relative">
            <div className={`rounded-2xl overflow-hidden relative ${d ? "bg-[#161b22]" : "bg-gray-200"}`} style={{ minHeight: "360px" }}>
              <Image
                src="/images/assessques.png"
                alt="Full Diagnostic"
                width={500}
                height={360}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Testimonial card */}
            <div className={`absolute bottom-6 left-6 right-6 rounded-2xl p-5 border ${d ? "bg-[#0d1117]/95 border-white/10" : "bg-white/95 border-gray-200 shadow-lg"}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-1">
                  {[1, 2].map((i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gray-600 border-2 border-[#0d1117]" />
                  ))}
                </div>
                <p className={`text-xs font-bold uppercase tracking-wider ${d ? "text-gray-300" : "text-gray-700"}`}>Trusted by 2,400+ Founders</p>
              </div>
              <p className={`text-xs leading-relaxed italic ${d ? "text-gray-300" : "text-gray-600"}`}>
                "The Layer 02 diagnostic exposed architectural bottlenecks we hadn't even considered. It changed our entire Q4 strategy."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className={`px-12 py-16 ${d ? "bg-[#0d1117]" : "bg-white"}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-4 gap-8 items-start">
          <div className="col-span-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00ffaa] mb-3">Methodology</p>
            <h2 className={`text-2xl font-bold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Quantitative Intelligence</h2>
            <p className={`text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
              Our proprietary diagnostic engine processes over 150 data points per architectural node, delivering a risk-score that is 4x more accurate than traditional manual audits.
            </p>
          </div>
          <div className="col-span-3 grid grid-cols-3 gap-6">
            {[
              { label: "Resource Efficiency", sub: "Industry Average: 64%", pct: 64, color: "#f97316" },
              { label: "Growth Potential", sub: "Top Decile: 88%", pct: 88, color: "#00ffaa" },
              { label: "Compliance Readiness", sub: "Global Standard: 70%", pct: 70, color: "#3b82f6" },
            ].map(({ label, sub, pct, color }) => (
              <div key={label}>
                <div className={`h-1 rounded-full mb-3 ${d ? "bg-white/10" : "bg-gray-200"}`}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <p className={`text-sm font-semibold mb-0.5 ${d ? "text-white" : "text-gray-900"}`}>{label}</p>
                <p className={`text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={`px-8 py-8 border-t ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>PICA</p>
          <div className="flex items-center gap-8">
            {["Privacy Policy", "Terms of Service", "Security Audit", "Contact Support"].map((item) => (
              <Link key={item} href="#" className={`text-xs transition hover:opacity-70 ${d ? "text-gray-400" : "text-gray-500"}`}>{item}</Link>
            ))}
          </div>
          <p className={`text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>© 2024 PICA Architectural Intelligence. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Page 2: Checkout ──────────────────────────────────────────────────────────
type PaymentMethod = "credit" | "bank" | "opay" | "paystack";

function CheckoutPage({ dark, setDark, onSuccess }: { dark: boolean; setDark: (v: boolean) => void; onSuccess: () => void }) {
  const d = dark;
  const [method, setMethod] = useState<PaymentMethod>("credit");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4);
    return clean.length > 2 ? `${clean.slice(0, 2)} / ${clean.slice(2)}` : clean;
  };

  const methodTabs: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { key: "credit", label: "Credit Card", icon: <CreditCard className="w-4 h-4" /> },
    { key: "bank", label: "Bank Transfer", icon: <Building2 className="w-4 h-4" /> },
    { key: "opay", label: "OPay", icon: <span className="text-xs font-bold">O</span> },
    { key: "paystack", label: "Paystack", icon: <span className="text-xs font-bold">P</span> },
  ];

  const features = [
    { title: "Deep-dive structural audit", desc: "Complete architectural review of your organization's digital workflow." },
    { title: "Growth roadmap (36 mo)", desc: "Mathematical projection and strategy for the next 3 years of scaling." },
    { title: "Compliance & Risk", desc: "Proactive identification of architectural bottlenecks and legal risks." },
    { title: "Detailed Insight PDF", desc: "120+ page executive summary with actionable intelligence." },
  ];

  return (
    <div className={`min-h-screen ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>
      <Navbar dark={dark} setDark={setDark} />

      <div className="max-w-5xl mx-auto px-8 py-12 grid grid-cols-2 gap-12">
        {/* Left — Plan summary */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#00ffaa] mb-4">Selected Subscription</p>
          <h1 className={`text-4xl font-extrabold leading-tight mb-3 ${d ? "text-white" : "text-gray-900"}`}>
            Layer 02 Full<br />Diagnostic
          </h1>
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-[#00ffaa]">$249</span>
            <span className={`text-sm ml-2 ${d ? "text-gray-400" : "text-gray-500"}`}>/ yearly</span>
          </div>

          <div className="space-y-5">
            {features.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00ffaa]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-[#00ffaa]" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                  <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Payment form */}
        <div className={`rounded-2xl p-8 border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
          <h2 className={`text-xl font-bold mb-1 ${d ? "text-white" : "text-gray-900"}`}>Secure Payment</h2>
          <p className={`text-xs mb-6 ${d ? "text-gray-400" : "text-gray-500"}`}>Select your preferred method and complete the transaction.</p>

          {/* Payment method tabs */}
          <div className={`flex rounded-xl overflow-hidden border mb-6 ${d ? "border-white/10 bg-[#0d1117]" : "border-gray-200 bg-white"}`}>
            {methodTabs.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setMethod(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition ${method === key
                    ? d ? "bg-[#243044] text-white" : "bg-white text-gray-900 shadow"
                    : d ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                  }`}>
                {icon}
                {label}
              </button>
            ))}
          </div>

          {method === "credit" && (
            <div className="space-y-4">
              {/* Cardholder Name */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Cardholder Name</label>
                <input type="text" placeholder="ALEXANDER VANE" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${d ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50" : "bg-white border-gray-200 text-gray-900 focus:border-teal-400"}`} />
              </div>
              {/* Card Number */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Card Number</label>
                <div className="relative">
                  <input type="text" placeholder="0000 0000 0000 0000" value={cardNumber}
                    onChange={(e) => setCardNumber(formatCard(e.target.value))}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition pr-12 ${d ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50" : "bg-white border-gray-200 text-gray-900 focus:border-teal-400"}`} />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>
              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>Expiry Date</label>
                  <input type="text" placeholder="MM / YY" value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${d ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50" : "bg-white border-gray-200 text-gray-900 focus:border-teal-400"}`} />
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>CVC / CVV</label>
                  <input type="text" placeholder="•••" maxLength={4} value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${d ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50" : "bg-white border-gray-200 text-gray-900 focus:border-teal-400"}`} />
                </div>
              </div>
            </div>
          )}

          {(method === "bank" || method === "opay" || method === "paystack") && (
            <div className={`rounded-xl p-6 text-center border ${d ? "border-white/10 bg-[#0d1117]" : "border-gray-200 bg-white"}`}>
              <p className={`text-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
                You will be redirected to complete payment via{" "}
                <span className="font-bold text-[#00ffaa]">
                  {method === "bank" ? "Bank Transfer" : method === "opay" ? "OPay" : "Paystack"}
                </span>.
              </p>
            </div>
          )}

          {/* Confirm button */}
          <button onClick={onSuccess}
            className="w-full py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-extrabold uppercase tracking-widest transition mt-6">
            Confirm &amp; Authorize Payment
          </button>

          <div className={`flex items-center justify-center gap-2 mt-3 text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>
            <Lock className="w-3 h-3" /> Secure Encrypted Payment
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: <Shield className="w-5 h-5 text-blue-400" />, label: "PCI DSS\nCompliant" },
              { icon: <CheckCircle className="w-5 h-5 text-green-400" />, label: "Verified\nSecure" },
              { icon: <RefreshCw className="w-5 h-5 text-orange-400" />, label: "No Hassle\nRefund" },
            ].map(({ icon, label }) => (
              <div key={label} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl ${d ? "bg-[#0d1117] border border-white/10" : "bg-white border border-gray-200"}`}>
                {icon}
                <p className={`text-[10px] font-semibold text-center uppercase tracking-wider whitespace-pre-line ${d ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`px-8 py-6 border-t ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className={`text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>© 2024 PICA Clinical Architect. Secure Encrypted Payment.</p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Security Standards"].map((item) => (
              <Link key={item} href="#" className={`text-xs hover:opacity-70 transition ${d ? "text-gray-400" : "text-gray-500"}`}>{item}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Page 3: Payment Success ───────────────────────────────────────────────────
function PaymentSuccessPage({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const d = dark;

  const capabilities = [
    { icon: <Shield className="w-5 h-5 text-[#00ffaa]" />, title: "Deep-dive structural audit", desc: "Comprehensive analysis of core infrastructure." },
    { icon: <TrendingUp className="w-5 h-5 text-[#00ffaa]" />, title: "Growth roadmap (36 mo)", desc: "Strategic milestones and scaling projections." },
    { icon: <Shield className="w-5 h-5 text-[#00ffaa]" />, title: "Compliance & Risk", desc: "Real-time monitoring and mitigation paths." },
    { icon: <FileText className="w-5 h-5 text-[#00ffaa]" />, title: "Detailed Insight PDF", desc: "Weekly analytical exports for stakeholders." },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>
      <Navbar dark={dark} setDark={setDark} />

      <div className="flex-1 flex flex-col items-center px-8 py-16">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-[#00ffaa] flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-gray-900" />
        </div>

        <h1 className={`text-5xl font-extrabold mb-4 ${d ? "text-white" : "text-gray-900"}`}>Payment Successful.</h1>
        <p className={`text-base text-center mb-12 max-w-lg ${d ? "text-gray-400" : "text-gray-600"}`}>
          The diagnosis is ready to begin. We have activated your $249 yearly Diagnosis 2A plan for the intelligence unit.
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Transaction Summary */}
          <div className={`rounded-2xl p-8 border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#f97316] mb-6">Transaction Summary</p>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className={`text-xs mb-1 ${d ? "text-gray-400" : "text-gray-500"}`}>Product Tier</p>
                <p className={`text-xl font-bold ${d ? "text-white" : "text-gray-900"}`}>Diagnosis 2A</p>
              </div>
              <div className="text-right">
                <p className={`text-xs mb-1 ${d ? "text-gray-400" : "text-gray-500"}`}>Billing Cycle</p>
                <p className={`text-xl font-bold ${d ? "text-white" : "text-gray-900"}`}>Yearly</p>
              </div>
            </div>
            <div className="mb-8">
              <p className={`text-xs mb-1 ${d ? "text-gray-400" : "text-gray-500"}`}>Total Amount Paid</p>
              <p className="text-3xl font-extrabold text-[#f97316]">$249.00</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-bold transition">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <button className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition ${d ? "border-white/10 text-white hover:bg-white/5" : "border-gray-200 text-gray-700 hover:bg-gray-100"}`}>
                View Receipt
              </button>
            </div>
          </div>

          {/* Capabilities Unlocked */}
          <div className={`rounded-2xl p-8 border ${d ? "bg-[#1a2010] border-[#00ffaa]/20" : "bg-green-50 border-green-200"}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#00ffaa] mb-6">Capabilities Unlocked</p>
            <div className="space-y-5 mb-8">
              {capabilities.map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{icon}</div>
                  <div>
                    <p className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}>{title}</p>
                    <p className={`text-xs ${d ? "text-gray-400" : "text-gray-600"}`}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className={`text-xs leading-relaxed border-t pt-4 ${d ? "border-white/10 text-gray-500" : "border-green-200 text-gray-400"}`}>
              Intelligence unit activation is instantaneous. All analytical models for Diagnosis 2A Plan are now calculating your first report.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`px-8 py-6 border-t ${d ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className={`text-sm font-extrabold ${d ? "text-white" : "text-gray-900"}`}>Pica Obsidian</p>
            <p className={`text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>© 2024 Intelligence Unit. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-8">
            {["Privacy Policy", "Terms of Service", "Compliance Audit", "Contact Support"].map((item) => (
              <Link key={item} href="#" className={`text-xs hover:opacity-70 transition ${d ? "text-gray-400" : "text-gray-500"}`}>{item}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function FullDiagnosticFlow() {
  const [dark, setDark] = useState(true);
  const [screen, setScreen] = useState<"product" | "checkout" | "success">("product");

  if (screen === "product") return <FullDiagnosticPage dark={dark} setDark={setDark} onCheckout={() => setScreen("checkout")} />;
  if (screen === "checkout") return <CheckoutPage dark={dark} setDark={setDark} onSuccess={() => setScreen("success")} />;
  if (screen === "success") return <PaymentSuccessPage dark={dark} setDark={setDark} />;
  return null;
}