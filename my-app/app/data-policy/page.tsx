"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import { ArrowLeft, Shield, Lock, Eye, CheckCircle2 } from "lucide-react";

export default function DataPolicyPage() {
  const { dark } = useTheme();
  const d = dark;

  return (
    <div className={`antialiased min-h-screen transition-colors duration-300 pb-20 ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>
      
      {/* Header */}
      <section className={`relative py-16 px-6 lg:px-8 border-b ${d ? "bg-[#161b22]/50 border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center sm:text-left">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${d ? "bg-teal-500/10 border-teal-500/20 text-teal-400" : "bg-teal-50 border-teal-200 text-teal-700"}`}>
              <Shield className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Privacy Assurance</span>
            </div>
            <h1 className="text-3xl font-black">Privacy Policy</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Effective: August 1, 2026</p>
          </div>
          <div>
            <Link href="/" className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold transition ${d ? "border-white/10 hover:bg-white/5 text-white" : "border-gray-200 hover:bg-gray-100 text-gray-700"}`}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 mt-12 space-y-12">
        <div className={`p-6 rounded-2xl border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200 shadow-sm"} text-sm leading-relaxed ${d ? "text-gray-300" : "text-gray-700"} space-y-4`}>
          <p>
            At <span className={`font-extrabold ${d ? "text-teal-400" : "text-teal-700"}`}>Beauvision Associates Limited</span> (&quot;Beauvision,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), we respect your privacy and are committed to protecting the personal and operational data processed through our enterprise diagnostic software, <span className={`font-extrabold ${d ? "text-teal-400" : "text-teal-700"}`}>PICA™ (Pain-Point Identification, Classification, and Assessment)</span>.
          </p>
          <p>
            This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website, use our SaaS platform, or engage with our services.
          </p>
        </div>

        <div className="space-y-8">
          {[
            {
              title: "1. Information We Collect",
              items: [
                { label: "Account & Profile Data", desc: "Name, business email address, phone number, company name, industry sector, corporate role, and login credentials." },
                { label: "Operational & Diagnostic Data", desc: "Business responses provided during the PICA™ assessment, process metrics, department performance inputs, and roadmap task assignments." },
                { label: "Payment & Billing Information", desc: "Transaction details processed securely via our third-party payment gateways (e.g., Paystack/Flutterwave/Stripe). We do not store raw credit card numbers on our servers." },
                { label: "Technical & Usage Data", desc: "IP address, browser type, device identifiers, operating system, and interaction logs collected via cookies and analytics." }
              ]
            },
            {
              title: "2. How We Use Your Information",
              desc: "We process your data strictly for legitimate business and platform delivery purposes:",
              bullets: [
                "To generate your proprietary Pain-Point Identification, Classification, and Assessment reports.",
                "To compute multi-pillar health scores and auto-generate your 90-Day Focus Roadmaps.",
                "To manage subscriptions, process transactions, and send administrative updates.",
                "To monitor, stress-test, and improve system performance, security, and user experience.",
                "To send relevant platform updates, marketing communications, and educational insights (you may opt out at any time)."
              ]
            },
            {
              title: "3. Data Confidentiality & Ownership",
              items: [
                { label: "Your Data Belongs to You", desc: "Your company’s operational and diagnostic inputs remain your sole intellectual property." },
                { label: "Non-Disclosure", desc: "We do not sell, rent, or trade your operational data to third parties. Diagnostic data is aggregated and anonymized solely for industry benchmarking and algorithmic model refinement." }
              ]
            },
            {
              title: "4. Data Sharing & Third Parties",
              desc: "We may share data only with trusted service providers who assist us in operating our platform:",
              bullets: [
                "Cloud hosting and infrastructure providers (e.g., AWS, DigitalOcean).",
                "Payment processors and transactional email delivery engines.",
                "Legal or regulatory authorities if required by law or to protect our legal rights."
              ]
            },
            {
              title: "5. Security Measures",
              desc: "We implement enterprise-grade security protocols, including SSL encryption, access controls, encrypted databases, and regular system vulnerability audits to prevent unauthorized access, loss, or alteration of your data."
            },
            {
              title: "6. Your Data Rights",
              desc: "Subject to local laws, you have the right to access, correct, update, or request the deletion of your personal account information. Account owners may also request full removal of company diagnostic profiles by contacting our privacy team."
            },
            {
              title: "7. Updates to This Policy",
              desc: "We may update this Privacy Policy periodically. Notice of significant changes will be communicated via the platform dashboard or to your registered account email."
            }
          ].map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-xl font-extrabold">{section.title}</h3>
              {section.desc && <p className={`text-sm ${d ? "text-gray-300" : "text-gray-600"}`}>{section.desc}</p>}
              
              {section.items && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.items.map((item) => (
                    <div key={item.label} className={`p-5 rounded-xl border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                      <p className={`text-sm font-bold mb-1.5 ${d ? "text-teal-400" : "text-teal-700"}`}>{item.label}</p>
                      <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.bullets && (
                <ul className={`space-y-2.5 pl-4 list-disc text-sm ${d ? "text-gray-400" : "text-gray-600"}`}>
                  {section.bullets.map((bullet, idx) => (
                    <li key={idx} className={d ? "text-gray-300" : "text-gray-600"}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
