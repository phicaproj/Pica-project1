"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPassword } from "@/lib/authClient";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await forgotPassword({ email });

      if (res.error) {
        setError(
          res.error.message ?? "Failed to send reset code. Please try again.",
        );
        return;
      }

      router.push(
        `/Auth/verify-code?email=${encodeURIComponent(email)}&type=forget-password`,
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0d1117]">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <img src="/images/logo.png" alt="Beauvision" className="h-8" />
          <span className="text-white text-lg font-bold">Beauvision</span>
        </div>

        {/* Card */}
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161b22] p-8 md:p-10">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Reset Password
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">
            Enter your email address and we&apos;ll send you a code to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="email"
                placeholder="Business email*"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                required
                disabled={isLoading}
                className={`w-full px-4 py-3.5 rounded-xl border bg-[#0d1117] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-60 ${
                  error
                    ? "border-red-500 focus:ring-red-400"
                    : "border-white/10 focus:ring-[#f97316]/50"
                }`}
              />
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] hover:from-[#ea6c0a] hover:to-[#d97706] text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Continue"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Remembered your password?{" "}
            <Link
              href="/Auth/login"
              className="font-bold text-white hover:text-[#f97316] transition underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-white/5">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-3">
          {["Privacy Policy", "Terms of Service", "Security Architecture"].map(
            (item) => (
              <Link
                key={item}
                href="#"
                className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition"
              >
                {item}
              </Link>
            )
          )}
        </div>
        <p className="text-xs text-gray-600 uppercase tracking-wider">
          © 2024 PICA Intelligence Systems. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
