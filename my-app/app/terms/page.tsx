"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import { ArrowLeft, Shield, FileText, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  const { dark } = useTheme();
  const d = dark;

  return (
    <div className={`antialiased min-h-screen transition-colors duration-300 pb-20 ${d ? "bg-[#0d1117] text-white" : "bg-white text-gray-900"}`}>
      
      {/* Header */}
      <section className={`relative py-16 px-6 lg:px-8 border-b ${d ? "bg-[#161b22]/50 border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Platform Agreement</span>
            </div>
            <h1 className="text-3xl font-black">Terms of Service</h1>
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
            Welcome to <span className="font-extrabold text-teal-400">PICA™</span>, a proprietary software-as-a-service (SaaS) platform owned and operated by <span className="font-extrabold text-teal-400">Beauvision Associates Limited</span>. By registering, accessing, or using the PICA™ platform, you agree to be bound by these Terms of Service.
          </p>
        </div>

        <div className="space-y-8">
          {[
            {
              title: "1. Subscription & Account License",
              items: [
                { label: "Grant of License", desc: "Beauvision grants your organization a non-exclusive, non-transferable, revocable license to access and use the PICA™ platform according to your selected subscription tier." },
                { label: "Account Responsibility", desc: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your registered user seats." }
              ]
            },
            {
              title: "2. Acceptable Use Policy",
              desc: "You agree not to:",
              bullets: [
                "Reverse engineer, decompile, copy, or duplicate the PICA™ diagnostic framework, algorithms, scoring methodologies, or software interface.",
                "Use the platform for any illegal, unauthorized, or fraudulent purpose.",
                "Attempt to breach or probe platform security, cloud servers, or user networks.",
                "Sub-license or resell access to the software without explicit written authorization from Beauvision Associates Limited."
              ]
            },
            {
              title: "3. Fees, Subscriptions & Renewals",
              items: [
                { label: "Billing Cycles", desc: "Subscriptions are billed in advance on a monthly or annual basis depending on your selected plan." },
                { label: "Automated Renewals", desc: "Subscriptions auto-renew unless cancelled prior to the billing cycle date through your platform billing settings." },
                { label: "Refund Policy", desc: "All fees paid are non-refundable except where explicitly required by law or specified in a formal enterprise service agreement." }
              ]
            },
            {
              title: "4. Intellectual Property",
              desc: "All rights, titles, and interests in and to the PICA™ software, including the Pain-Point Identification, Classification, and Assessment methodology, 7 Pillar framework, visual branding, trademarks, code, and interface designs, belong exclusively to Beauvision Associates Limited."
            },
            {
              title: "5. Disclaimer of Warranties",
              desc: "The PICA™ platform provides automated diagnostic insights, risk classifications, and roadmap recommendations based on user-inputted data. While engineered for high strategic accuracy, the software is provided on an \"AS IS\" and \"AS AVAILABLE\" basis. Users remain ultimately responsible for their executive decisions and operational implementation."
            },
            {
              title: "6. Limitation of Liability",
              desc: "To the maximum extent permitted by applicable law, Beauvision Associates Limited shall not be liable for any indirect, incidental, consequential, or special damages arising out of or in connection with your use or inability to use the PICA™ platform."
            },
            {
              title: "7. Termination",
              desc: "We reserve the right to suspend or terminate accounts that violate these Terms, fail to pay subscription fees, or engage in malicious security practices."
            },
            {
              title: "8. Governing Law & Dispute Resolution",
              desc: "These Terms, your access to the PICA™ platform, and any disputes arising out of or related to our services shall be governed by and construed in accordance with generally accepted principles of international commercial law. Any dispute shall be settled through arbitration under the Rules of Arbitration of the International Chamber of Commerce (ICC) in English."
            },
            {
              title: "9. Contact Us",
              desc: "Need assistance or strategic guidance? Contact us at:",
              items: [
                { label: "Corporate Headquarters", desc: "Beauvision Associates Limited, Plot 473 Constitution Ave, Abuja, Nigeria." },
                { label: "Direct Channels", desc: "support@beauvisiongroup.com. Operating hours: Monday – Friday: 9:00 AM – 5:00 PM (WAT)." }
              ]
            }
          ].map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-xl font-extrabold">{section.title}</h3>
              {section.desc && <p className={`text-sm ${d ? "text-gray-300" : "text-gray-600"}`}>{section.desc}</p>}
              
              {section.items && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.items.map((item) => (
                    <div key={item.label} className={`p-5 rounded-xl border ${d ? "bg-[#161b22] border-white/10" : "bg-gray-50 border-gray-200"}`}>
                      <p className="text-sm font-bold text-teal-400 mb-1.5">{item.label}</p>
                      <p className={`text-xs leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.bullets && (
                <ul className="space-y-2.5 pl-4 list-disc text-sm text-gray-400">
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
