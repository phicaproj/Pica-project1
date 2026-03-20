"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/authClient";

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
      const res = await authClient.forgetPassword.emailOtp({
        email,
      });

      if (res.error) {
        setError(
          res.error.message ?? "Failed to send reset code. Please try again.",
        );
        return;
      }

      // OTP email was sent — go to verify page with forgot-password type
      router.push(
        `/auth/verify-code?email=${encodeURIComponent(email)}&type=forget-password`,
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/loginbg.jpeg')" }}
      />

      {/* Main content */}
      <div className="relative flex-1 flex flex-col">
        {/* Logo - centered */}
        <div className="pt-10 flex justify-center">
          <div className="flex items-center gap-2">
            {/* Replace with your logo */}
            <img src="/images/logo.png" alt="logo" />
          </div>
        </div>

        {/* Card - centered */}
        <div className="flex-1 flex items-center justify-center pb-10">
          <div className="bg-white rounded-md shadow-xl p-10 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Forgot Password
            </h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              Enter your email address and we'll send you a code to reset your
              password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  disabled={isLoading}
                  className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-60 ${
                    error
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-200 focus:ring-[#017CA3]"
                  }`}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#017CA3] hover:bg-[#046f91] active:bg-[#017CA3] text-white font-semibold text-sm tracking-wide transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Continue"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remembered your password?{" "}
              <a
                href="/auth/login"
                className="font-bold text-gray-900 hover:text-[#017CA3] transition"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-4 text-center text-sm text-gray-600 bg-white/80 backdrop-blur-sm">
        © Beauvision 2024 . All rights reserved. Powered By{" "}
        <a
          href="https://sundimension.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#017CA3] transition"
        >
          SunDimension
        </a>
      </div>
    </div>
  );
}
