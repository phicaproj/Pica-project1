"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeContext";

export default function ContactView() {
  const { dark } = useTheme();
  const d = dark;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    body: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      setStatus("success");
      setFormData({ name: "", email: "", reason: "", body: "" });
    } catch (error) {
      setStatus("error");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`min-h-screen py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center ${d ? "bg-[#0d1117] text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className={`max-w-xl w-full p-8 sm:p-10 rounded-3xl border shadow-xl ${d ? "bg-[#161b22] border-white/10" : "bg-white border-gray-200"}`}>
        <h1 className="text-3xl font-extrabold mb-2 text-center">Contact Support</h1>
        <p className={`text-sm text-center mb-8 ${d ? "text-gray-400" : "text-gray-600"}`}>
          Our corporate team is ready to assist you.
        </p>

        {status === "success" ? (
          <div className={`p-6 rounded-xl border text-center ${d ? "bg-teal-500/10 border-teal-500/20 text-teal-400" : "bg-teal-50 border-teal-200 text-teal-700"}`}>
            <h3 className="font-bold mb-2">Message Sent Successfully!</h3>
            <p className="text-sm">We'll get back to you as soon as possible.</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm font-semibold underline hover:no-underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>
                Name
              </label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  d
                    ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-500"
                }`}
              />
            </div>
            
            <div>
              <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>
                Email
              </label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  d
                    ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-500"
                }`}
              />
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>
                Reason
              </label>
              <select
                required
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition appearance-none ${
                  d
                    ? "bg-[#0d1117] border-white/10 text-white focus:border-[#00ffaa]/50"
                    : "bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-500"
                }`}
              >
                <option value="" disabled>Select a reason...</option>
                <option value="Billing">Billing Issue</option>
                <option value="Technical">Technical Support</option>
                <option value="Sales">Sales Inquiry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? "text-gray-400" : "text-gray-500"}`}>
                Message
              </label>
              <textarea
                required
                name="body"
                value={formData.body}
                onChange={handleChange}
                rows={5}
                placeholder="How can we help you?"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition resize-none ${
                  d
                    ? "bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-500"
                }`}
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm font-semibold">
                An error occurred while sending your message. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition ${
                status === "submitting"
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-[#f97316] hover:bg-[#ea6c0a] text-white"
              }`}
            >
              {status === "submitting" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className={`mt-8 text-center text-xs ${d ? "text-gray-500" : "text-gray-400"}`}>
        <p>support@beauvisiongroup.com | +2349139657000</p>
        <p>Monday - Friday: 9:00 AM - 5:00 PM (WAT)</p>
      </div>
    </div>
  );
}
